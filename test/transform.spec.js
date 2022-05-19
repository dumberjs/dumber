const test = require('tape');
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

test('transform transforms unit contents', t => {
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

  transform(unit, addLine(3, 'add;'))
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
  ).then(t.end);
});

test('transform does multiple transforms and merges unit and sourceMap', t => {
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

  transform(unit, unit => ({...unit, deps: ['a', 'b']}), addLine(3, 'add;'), addLine(3, 'add2;'))
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
  ).then(t.end);
});

test('transform merges original unit sourceMap', t => {
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

  transform(unit, addLine(3, 'add;'))
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
  ).then(t.end);
});

test('transform ignores broken sourceMap', t => {
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

  transform(unit, addLine(3, 'add;'))
  .then(
    unit => {
      t.deepEqual(unit, {
        contents: 'a;\nadd;\nb;\n',
        path: 'src/foo.js',
        moduleId: 'foo'
      })
    },
    t.fail
  ).then(t.end);
});

test('transform keeps original unit sourceMap if transformer did not supply source map', t => {
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

  transform(unit, append('/* hello */'))
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
  ).then(t.end);
});

test('transform bypass nil transform', t => {
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

  transform(unit, noop)
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
  ).then(t.end);
});

test('transform reuses parsed on nil transform', t => {
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

  transform(unit, noop)
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
  ).then(t.end);
});

test('transform merges defined', t => {
  const unit = {
    contents: 'a,b',
    path: 'src/foo.js',
    moduleId: 'foo',
    parsed: {lorem: 1} // previous parsed is discarded
  };

  function findDefines(unit) {
    return {defined: unit.contents.split(',')};
  }

  transform(unit, findDefines)
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
  ).then(t.end);
});

test('transform merges defined, avoid duplication', t => {
  const unit = {
    contents: 'a,b',
    path: 'src/foo.js',
    moduleId: 'foo',
    defined: ['b']
  };

  function findDefines(unit) {
    return {defined: unit.contents.split(',')};
  }

  transform(unit, findDefines)
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
  ).then(t.end);
});

test('transform merges deps', t => {
  const unit = {
    contents: 'a,b',
    path: 'src/foo.js',
    moduleId: 'foo'
  };

  function findDefines(unit) {
    return {deps: unit.contents.split(',')};
  }

  transform(unit, findDefines)
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
  ).then(t.end);
});

test('transform merges deps, avoid duplication', t => {
  const unit = {
    contents: 'a,b',
    path: 'src/foo.js',
    moduleId: 'foo',
    deps: ['b']
  };

  function findDefines(unit) {
    return {deps: unit.contents.split(',')};
  }

  transform(unit, findDefines)
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
  ).then(t.end);
});
