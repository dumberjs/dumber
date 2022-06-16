const {test} = require('zora');
const transform = require('../lib/transform');
const modifyCode = require('modify-code').default;
const {encode} = require('sourcemap-codec');

function addLine(idx, line) {
  return function(unit) {
    const result = modifyCode(unit.contents, unit.path).insert(idx, line + '\n').transform();
    return {
      contents: result.code,
      sourceMap: result.map
    };
  };
}

test('transform transforms unit contents', async t => {
  const unit = {
    contents: 'a;\nb;\n',
    path: 'src/foo.js',
    moduleId: 'foo',
    sourceMap: {
      version: 3,
      file: 'src/foo.js',
      sources: [ 'src/foo.js' ],
      sourcesContent: [ 'a;\nb;\n' ],
      names: [],
      mappings: ''
    }
  };

  return transform(unit, addLine(3, 'add;'))
  .then(
    unit => {
      t.deepEqual(unit, {
        contents: 'a;\nadd;\nb;\n',
        path: 'src/foo.js',
        moduleId: 'foo',
        sourceMap: {
          version: 3,
          file: 'src/foo.js',
          sources: [ 'src/foo.js' ],
          sourcesContent: [ 'a;\nb;\n' ],
          names: [],
          mappings: encode([
            [ [ 0, 0, 0, 0 ], [ 1, 0, 0, 1 ], [ 2, 0, 0, 2 ] ],
            [ [ 0, 0, 0, 2 ] ],
            [ [ 0, 0, 1, 0 ], [ 1, 0, 1, 1 ], [ 2, 0, 1, 2 ] ]
          ])
        }
      })
    },
    t.fail
  );
});

test('transform does multiple transforms and merges unit and sourceMap', async t => {
  const unit = {
    contents: 'a;\nb;\n',
    path: 'src/foo.js',
    moduleId: 'foo',
    sourceMap: {
      version: 3,
      file: 'src/foo.js',
      sources: [ 'src/foo.js' ],
      sourcesContent: [ 'a;\nb;\n' ],
      names: [],
      mappings: ''
    }
  };

  return transform(unit, unit => ({...unit, deps: ['a', 'b']}), addLine(3, 'add;'), addLine(3, 'add2;'))
  .then(
    unit => {
      t.deepEqual(unit, {
        contents: 'a;\nadd2;\nadd;\nb;\n',
        path: 'src/foo.js',
        moduleId: 'foo',
        sourceMap: {
          version: 3,
          file: 'src/foo.js',
          sources: [ 'src/foo.js' ],
          sourcesContent: [ 'a;\nb;\n' ],
          names: [],
          mappings: encode([
            [ [ 0, 0, 0, 0 ], [ 1, 0, 0, 1 ], [ 2, 0, 0, 2 ] ],
            [ [ 0, 0, 0, 2 ] ],
            [ [ 0, 0, 0, 2 ], [ 3, 0, 0, 2 ], [ 4, 0, 0, 2 ] ],
            [ [ 0, 0, 1, 0 ], [ 1, 0, 1, 1 ], [ 2, 0, 1, 2 ] ]
          ])
        },
        deps: ['a', 'b']
      })
    },
    t.fail
  );
});

test('transform merges original unit sourceMap', async t => {
  const unit = {
    contents: 'a;\nb;\n',
    path: 'src/foo.js',
    moduleId: 'foo',
    sourceMap: {
      version: 3,
      file: 'src/foo.js',
      sources: [ 'src/foo.js' ],
      sourcesContent: [ 'a;b;\n' ],
      names: [],
      mappings: encode([
        [
          [0, 0, 0, 0]
        ],
        [
          [0, 0, 0, 3]
        ]
      ])
    }
  };

  return transform(unit, addLine(3, 'add;'))
  .then(
    unit => {
      t.deepEqual(unit, {
        contents: 'a;\nadd;\nb;\n',
        path: 'src/foo.js',
        moduleId: 'foo',
        sourceMap: {
          version: 3,
          file: 'src/foo.js',
          sources: [ 'src/foo.js' ],
          sourcesContent: [ 'a;b;\n' ],
          names: [],
          mappings: encode([
            [ [ 0, 0, 0, 0 ], [ 1, 0, 0, 0 ], [ 2, 0, 0, 0 ] ],
            [ [ 0, 0, 0, 0 ] ],
            [ [ 0, 0, 0, 3 ], [ 1, 0, 0, 3 ], [ 2, 0, 0, 3 ] ]
          ])
        }
      })
    },
    t.fail
  );
});

test('transform ignores broken sourceMap', async t => {
  const unit = {
    contents: 'a;\nb;\n',
    path: 'src/foo.js',
    moduleId: 'foo',
    sourceMap: {
      version: 3,
      file: 'src/foo.js',
      sources: [ 'src/foo.js' ],
      sourcesContent: [ 'a;b;\n' ],
      names: [],
      mappings: 'XXX'
    }
  };

  return transform(unit, addLine(3, 'add;'))
  .then(
    unit => {
      t.deepEqual(unit, {
        contents: 'a;\nadd;\nb;\n',
        path: 'src/foo.js',
        moduleId: 'foo'
      })
    },
    t.fail
  );
});

test('transform keeps original unit sourceMap if transformer did not supply source map', async t => {
  const unit = {
    contents: 'a;\nb;\n',
    path: 'src/foo.js',
    moduleId: 'foo',
    sourceMap: {
      version: 3,
      file: 'src/foo.js',
      sources: [ 'src/foo.js' ],
      sourcesContent: [ 'a;b;\n' ],
      names: [],
      mappings: encode([
        [
          [0, 0, 0, 0]
        ],
        [
          [0, 0, 0, 3]
        ]
      ])
    }
  };

  function append(str) {
    return function (unit) {
      return {contents: unit.contents + str};
    };
  }

  return transform(unit, append('/* hello */'))
  .then(
    unit => {
      t.deepEqual(unit, {
        contents: 'a;\nb;\n/* hello */',
        path: 'src/foo.js',
        moduleId: 'foo',
        sourceMap: {
          version: 3,
          file: 'src/foo.js',
          sources: [ 'src/foo.js' ],
          sourcesContent: [ 'a;b;\n' ],
          names: [],
          mappings: encode([
            [
              [0, 0, 0, 0]
            ],
            [
              [0, 0, 0, 3]
            ]
          ])
        }
      })
    },
    t.fail
  );
});

test('transform bypass nil transform', async t => {
  const unit = {
    contents: 'a;\nb;\n',
    path: 'src/foo.js',
    moduleId: 'foo',
    sourceMap: {
      version: 3,
      file: 'src/foo.js',
      sources: [ 'src/foo.js' ],
      sourcesContent: [ 'a;b;\n' ],
      names: [],
      mappings: encode([
        [
          [0, 0, 0, 0]
        ],
        [
          [0, 0, 0, 3]
        ]
      ])
    }
  };

  function noop() {}

  return transform(unit, noop)
  .then(
    newUnit => {
      t.equal(newUnit, unit);
      t.deepEqual(newUnit, {
        contents: 'a;\nb;\n',
        path: 'src/foo.js',
        moduleId: 'foo',
        sourceMap: {
          version: 3,
          file: 'src/foo.js',
          sources: [ 'src/foo.js' ],
          sourcesContent: [ 'a;b;\n' ],
          names: [],
          mappings: encode([
            [
              [0, 0, 0, 0]
            ],
            [
              [0, 0, 0, 3]
            ]
          ])
        }
      })
    },
    t.fail
  );
});

test('transform reuses parsed on nil transform', async t => {
  const unit = {
    contents: 'a;\nb;\n',
    path: 'src/foo.js',
    moduleId: 'foo',
    sourceMap: {
      version: 3,
      file: 'src/foo.js',
      sources: [ 'src/foo.js' ],
      sourcesContent: [ 'a;b;\n' ],
      names: [],
      mappings: encode([
        [
          [0, 0, 0, 0]
        ],
        [
          [0, 0, 0, 3]
        ]
      ])
    }
  };

  function noop() { return { parsed: {lorem: 1}}}

  return transform(unit, noop)
  .then(
    newUnit => {
      t.deepEqual(newUnit, {
        parsed: {lorem: 1},
        contents: 'a;\nb;\n',
        path: 'src/foo.js',
        moduleId: 'foo',
        sourceMap: {
          version: 3,
          file: 'src/foo.js',
          sources: [ 'src/foo.js' ],
          sourcesContent: [ 'a;b;\n' ],
          names: [],
          mappings: encode([
            [
              [0, 0, 0, 0]
            ],
            [
              [0, 0, 0, 3]
            ]
          ])
        }
      })
    },
    t.fail
  );
});

test('transform merges defined', async t => {
  const unit = {
    contents: 'a,b',
    path: 'src/foo.js',
    moduleId: 'foo',
    parsed: {lorem: 1} // previous parsed is discarded
  };

  function findDefines(unit) {
    return {defined: unit.contents.split(',')};
  }

  return transform(unit, findDefines)
  .then(
    newUnit => {
      t.deepEqual(newUnit, {
        contents: 'a,b',
        path: 'src/foo.js',
        moduleId: 'foo',
        defined: ['a', 'b']
      })
    },
    t.fail
  );
});

test('transform merges defined, avoid duplication', async t => {
  const unit = {
    contents: 'a,b',
    path: 'src/foo.js',
    moduleId: 'foo',
    defined: ['b']
  };

  function findDefines(unit) {
    return {defined: unit.contents.split(',')};
  }

  return transform(unit, findDefines)
  .then(
    newUnit => {
      t.deepEqual(newUnit, {
        contents: 'a,b',
        path: 'src/foo.js',
        moduleId: 'foo',
        defined: ['b', 'a']
      })
    },
    t.fail
  );
});

test('transform merges deps', async t => {
  const unit = {
    contents: 'a,b',
    path: 'src/foo.js',
    moduleId: 'foo'
  };

  function findDefines(unit) {
    return {deps: unit.contents.split(',')};
  }

  return transform(unit, findDefines)
  .then(
    newUnit => {
      t.deepEqual(newUnit, {
        contents: 'a,b',
        path: 'src/foo.js',
        moduleId: 'foo',
        deps: ['a', 'b']
      })
    },
    t.fail
  );
});

test('transform merges deps, avoid duplication', async t => {
  const unit = {
    contents: 'a,b',
    path: 'src/foo.js',
    moduleId: 'foo',
    deps: ['b']
  };

  function findDefines(unit) {
    return {deps: unit.contents.split(',')};
  }

  return transform(unit, findDefines)
  .then(
    newUnit => {
      t.deepEqual(newUnit, {
        contents: 'a,b',
        path: 'src/foo.js',
        moduleId: 'foo',
        deps: ['b', 'a']
      })
    },
    t.fail
  );
});
