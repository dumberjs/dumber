const {test} = require('zora');
const ModulesTodo = require('../lib/modules-todo');

test('ModulesTodo process traced unit', t => {
  const md = new ModulesTodo();
  md.process({
    moduleId: 'foo',
    deps: ['text!./foo.html', 'bar', 'some-plugin!./readme.md']
  });
  md.process({
    moduleId: 'bar/index',
    packageName: 'bar',
    deps: ['./lo']
  });

  t.deepEqual(Object.assign({}, md.todos), {
    '0 text!foo.html 1': ['foo'],
    '2 some-plugin 0': ['foo'],
    '0 some-plugin!readme.md 1': ['foo'],
    '2 bar 0': ['foo'],
    '1 bar/lo 1': ['bar/index']
  });
  t.notOk(md.needCssInjection);
  t.ok(md.hasTodo());
});

test('ModulesTodo sequentially calls acquire callback', async t => {
  const md = new ModulesTodo();
  md.process({
    moduleId: 'foo',
    deps: ['text!./foo.html', 'bar']
  });
  md.process({
    moduleId: 'bar/index',
    packageName: 'bar',
    deps: ['./lo']
  });

  const log = [];

  function cb(id, opts) {
    return new Promise(resolve => {
      log.push({id, ...opts});
      setTimeout(resolve, 20);
    });
  }

  t.ok(md.hasTodo());

  return md.acquire(cb).then(
    () => {
      t.deepEqual(log, [
        {id: 'text!foo.html', user: true, package: false, requiredBy: ['foo'], isRelative: true},
        {id: 'bar/lo', user: false, package: true, requiredBy: ['bar/index'], isRelative: true},
        {id: 'bar', user: true, package: true, requiredBy: ['foo'], isRelative: false}
      ]);
      t.notOk(md.needCssInjection);
      t.notOk(md.hasTodo());
    },
    err => {
      t.fail(err);
    }
  );
});

test('ModulesTodo handles additional todos, set needCssInjection', async t => {
  const modulesDone = {has() {return false;}};
  const md = new ModulesTodo(modulesDone);
  md.process({
    moduleId: 'foo',
    deps: ['text!./foo.html', 'bar']
  });
  md.process({
    moduleId: 'bar/index',
    packageName: 'bar',
    deps: ['./lo']
  });

  const log = [];

  function cb(id, opts) {
    return new Promise(resolve => {
      if (id === 'bar/lo' && opts.package) {
        md.process({
          moduleId: 'bar/lo',
          packageName: 'bar',
          deps: ['./lor']
        })
      }
      if (id === 'bar/lor' && opts.package) {
        md.process({
          moduleId: 'bar/lor/index',
          packageName: 'bar',
          deps: ['./tool.css', './tool2']
        })
      }
      log.push({id, ...opts});
      setTimeout(resolve, 20);
    });
  }

  t.ok(md.hasTodo());

  return md.acquire(cb).then(() => {
    t.deepEqual(log, [
      {id: 'text!foo.html', user: true, package: false, requiredBy: ['foo'], isRelative: true},
      {id: 'bar/lo', user: false, package: true, requiredBy: ['bar/index'], isRelative: true},
      {id: 'bar', user: true, package: true, requiredBy: ['foo'], isRelative: false}
    ]);
    t.notOk(md.needCssInjection);
    t.deepEqual(Object.assign({}, md.todos), {
      '1 bar/lor 1': ['bar/lo'],
    });
    t.ok(md.hasTodo());

    return md.acquire(cb);
  }).then(() => {
    t.deepEqual(log, [
      {id: 'text!foo.html', user: true, package: false, requiredBy: ['foo'], isRelative: true},
      {id: 'bar/lo', user: false, package: true, requiredBy: ['bar/index'], isRelative: true},
      {id: 'bar', user: true, package: true, requiredBy: ['foo'], isRelative: false},
      {id: 'bar/lor', user: false, package: true, requiredBy: ['bar/lo'], isRelative: true},
    ]);
    t.ok(md.needCssInjection);
    t.deepEqual(Object.assign({}, md.todos), {
      '1 bar/lor/tool.css 1': ['bar/lor/index'],
      '1 bar/lor/tool2 1': ['bar/lor/index']
    });
    t.ok(md.hasTodo());

    return md.acquire(cb);
  }).then(() => {
    t.deepEqual(log, [
      {id: 'text!foo.html', user: true, package: false, requiredBy: ['foo'], isRelative: true},
      {id: 'bar/lo', user: false, package: true, requiredBy: ['bar/index'], isRelative: true},
      {id: 'bar', user: true, package: true, requiredBy: ['foo'], isRelative: false},
      {id: 'bar/lor', user: false, package: true, requiredBy: ['bar/lo'], isRelative: true},
      {id: 'bar/lor/tool.css', user: false, package: true, requiredBy: ['bar/lor/index'], isRelative: true},
      {id: 'bar/lor/tool2', user: false, package: true, requiredBy: ['bar/lor/index'], isRelative: true},
    ]);
    t.ok(md.needCssInjection);
    t.deepEqual(Object.assign({}, md.todos), {});
    t.notOk(md.hasTodo());

    return md.acquire(cb);
  }).catch(t.fail);
});

test('ModulesTodo sets needCssInjection for less module', t => {
  const md = new ModulesTodo();
  md.process({
    moduleId: 'foo',
    deps: ['./foo.less']
  });

  t.deepEqual(Object.assign({}, md.todos), {
    '0 foo.less 1': ['foo']
  });
  t.ok(md.needCssInjection);
  t.ok(md.hasTodo());
});

test('ModulesTodo sets needCssInjection for scss module', t => {
  const md = new ModulesTodo();
  md.process({
    moduleId: 'foo',
    deps: ['./foo.scss']
  });

  t.deepEqual(Object.assign({}, md.todos), {
    '0 foo.scss 1': ['foo']
  });
  t.ok(md.needCssInjection);
  t.ok(md.hasTodo());
});

test('ModulesTodo sets needCssInjection for sass module', t => {
  const md = new ModulesTodo();
  md.process({
    moduleId: 'foo',
    deps: ['./foo.sass']
  });

  t.deepEqual(Object.assign({}, md.todos), {
    '0 foo.sass 1': ['foo']
  });
  t.ok(md.needCssInjection);
  t.ok(md.hasTodo());
});

test('ModulesTodo sets needCssInjection for styl module', t => {
  const md = new ModulesTodo();
  md.process({
    moduleId: 'foo',
    deps: ['./foo.styl']
  });

  t.deepEqual(Object.assign({}, md.todos), {
    '0 foo.styl 1': ['foo']
  });
  t.ok(md.needCssInjection);
  t.ok(md.hasTodo());
});
