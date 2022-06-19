const {test} = require('zora');
const ModulesDone = require('../lib/modules-done');

test('ModulesDone adds user space module id', t => {
  const md = new ModulesDone();
  md.add('a');

  t.deepEqual(Array.from(md.userIds), ['a']);
  t.deepEqual(Array.from(md.packageIds), []);
  t.ok(md.has('a', true, false));
  t.ok(md.has('a', true, true));
  t.notOk(md.has('a', false, true));

  t.notOk(md.has('b', true, false));
  t.notOk(md.has('b', true, true));
  t.notOk(md.has('b', false, true));
});

test('ModulesDone adds package space module id', t => {
  const md = new ModulesDone();
  md.add('a', true);

  t.deepEqual(Array.from(md.packageIds), ['a']);
  t.deepEqual(Array.from(md.userIds), []);
  t.notOk(md.has('a', true, false));
  t.ok(md.has('a', true, true));
  t.ok(md.has('a', false, true));

  t.notOk(md.has('b', true, false));
  t.notOk(md.has('b', true, true));
  t.notOk(md.has('b', false, true));
});

test('ModulesDone adds traced unit moduleId and defined', t => {
  const md = new ModulesDone();
  md.addUnit({moduleId: 'foo', defined: 'foo'});
  md.addUnit({moduleId: 'bar', defined: 'bar'});
  md.addUnit({
    moduleId: 'moment/index',
    defined: ['moment/index', 'moment'],
    packageName: 'moment'
  });
  // duplicated add has no effect
  md.addUnit({
    moduleId: 'moment/index',
    defined: ['moment/index', 'moment'],
    packageName: 'moment'
  });

  t.deepEqual(Array.from(md.userIds).sort(), ['bar', 'foo']);
  t.deepEqual(Array.from(md.packageIds).sort(), ['moment', 'moment/index']);
});

test('ModulesDone checks existence of nodejs module id', t => {
  const md = new ModulesDone();
  md.add('foo/index');
  md.add('text!bar.html');
  md.add('bar/lo', true);

  t.deepEqual(Array.from(md.packageIds), ['bar/lo']);
  t.deepEqual(Array.from(md.userIds).sort(), ['foo/index', 'text!bar.html']);

  t.ok(md.has('foo/index', true, false));
  t.notOk(md.has('foo/index', false, true));
  t.ok(md.has('foo', true, false));
  t.notOk(md.has('foo.js', true, false));

  t.ok(md.has('text!bar.html', true, false));
  t.ok(md.has('text!bar.html', true, true));
  t.notOk(md.has('text!bar.html', false, true));

  t.notOk(md.has('bar.html', true, false));
  t.notOk(md.has('bar.html', true, true));
  t.notOk(md.has('bar.html', false, true));

  t.ok(md.has('bar/lo', false, true));
  t.ok(md.has('bar/lo', true, true));
  t.notOk(md.has('bar/lo', true, false));

  t.ok(md.has('bar/lo.js', false, true));
  t.ok(md.has('bar/lo.js', true, true));
  t.notOk(md.has('bar/lo.js', true, false));
});
