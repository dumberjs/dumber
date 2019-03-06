import test from 'tape';
import ModulesTodo from '../src/modules-todo';

test('ModulesTodo process traced unit', t => {
  const modulesDone = {has() {return false;}};
  const md = new ModulesTodo(modulesDone);
  md.process({
    moduleId: 'foo',
    deps: ['text!./foo.html', 'bar', 'some-plugin!./readme.md']
  });
  md.process({
    moduleId: 'bar/index',
    packageName: 'bar',
    deps: ['./lo']
  });

  t.deepEqual(md.todos, {
    '0:text!foo.html': ['foo'],
    '2:some-plugin': ['foo'],
    '0:some-plugin!readme.md': ['foo'],
    '2:bar': ['foo'],
    '1:bar/lo': ['bar/index']
  });
  t.notOk(md.needCssInjection);
  t.ok(md.hasTodo());
  t.end();
});

test('ModulesTodo sequentially calls acquire callback', t => {
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
      log.push({id, ...opts});
      setTimeout(resolve, 20);
    });
  }

  t.ok(md.hasTodo());

  md.acquire(cb).then(
    () => {
      t.deepEqual(log, [
        {id: 'text!foo.html', user: true, package: false, requiredBy: ['foo']},
        {id: 'bar/lo', user: false, package: true, requiredBy: ['bar/index']},
        {id: 'bar', user: true, package: true, requiredBy: ['foo']}
      ]);
      t.notOk(md.needCssInjection);
      t.notOk(md.hasTodo());
    },
    err => {
      t.fail(err);
    }
  ).then(t.end);
});

test('ModulesTodo skips modules done', t => {
  const modulesDone = {has(id, checkUserSpace, checkPackageSpace) {
    if (id === 'bar' && checkPackageSpace) return true;
    if (id === 'bar/lo' && checkUserSpace) return true;
    return false;
  }};
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
      log.push({id, ...opts});
      setTimeout(resolve, 20);
    });
  }

  t.ok(md.hasTodo());

  md.acquire(cb).then(
    () => {
      t.deepEqual(log, [
        {id: 'text!foo.html', user: true, package: false, requiredBy: ['foo']},
        {id: 'bar/lo', user: false, package: true, requiredBy: ['bar/index']}
      ]);
      t.notOk(md.needCssInjection);
      t.notOk(md.hasTodo());
    },
    err => {
      t.fail(err);
    }
  ).then(t.end);
});

test('ModulesTodo handles additional todos, set needCssInjection', t => {
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

  md.acquire(cb).then(() => {
    t.deepEqual(log, [
      {id: 'text!foo.html', user: true, package: false, requiredBy: ['foo']},
      {id: 'bar/lo', user: false, package: true, requiredBy: ['bar/index']},
      {id: 'bar', user: true, package: true, requiredBy: ['foo']}
    ]);
    t.notOk(md.needCssInjection);
    t.deepEqual(md.todos, {
      '1:bar/lor': ['bar/lo'],
    });
    t.ok(md.hasTodo());

    return md.acquire(cb);
  }).then(() => {
    t.deepEqual(log, [
      {id: 'text!foo.html', user: true, package: false, requiredBy: ['foo']},
      {id: 'bar/lo', user: false, package: true, requiredBy: ['bar/index']},
      {id: 'bar', user: true, package: true, requiredBy: ['foo']},
      {id: 'bar/lor', user: false, package: true, requiredBy: ['bar/lo']}
    ]);
    t.ok(md.needCssInjection);
    t.deepEqual(md.todos, {
      '1:bar/lor/tool.css': ['bar/lor/index'],
      '1:bar/lor/tool2': ['bar/lor/index']
    });
    t.ok(md.hasTodo());

    return md.acquire(cb);
  }).then(() => {
    t.deepEqual(log, [
      {id: 'text!foo.html', user: true, package: false, requiredBy: ['foo']},
      {id: 'bar/lo', user: false, package: true, requiredBy: ['bar/index']},
      {id: 'bar', user: true, package: true, requiredBy: ['foo']},
      {id: 'bar/lor', user: false, package: true, requiredBy: ['bar/lo']},
      {id: 'bar/lor/tool.css', user: false, package: true, requiredBy: ['bar/lor/index']},
      {id: 'bar/lor/tool2', user: false, package: true, requiredBy: ['bar/lor/index']},
    ]);
    t.ok(md.needCssInjection);
    t.deepEqual(md.todos, {});
    t.notOk(md.hasTodo());

    return md.acquire(cb);
  }).catch(t.fail).then(t.end);
});

