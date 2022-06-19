const {test} = require('zora');
const text = require('../../lib/transformers/text');

test('text wraps text into amd module', t => {
  const source = '<p></p>';
  const target = "define('text!a.html',function(){return \"<p></p>\";});";

  t.deepEqual(text({
    moduleId: 'a.html',
    contents: source,
    path: 'src/a.html'
  }), {
    defined: ['text!a.html'],
    deps: [],
    contents: target,
    sourceMap: {
      version: 3,
      file: 'src/a.html',
      sources: ['src/a.html'],
      mappings: 'AAAA',
      names: [],
      sourcesContent: [source]
    }
  });
});

test('text skips identity source map when there is existing map', t => {
  const source = '<p></p>';
  const target = "define('text!a.html',function(){return \"<p></p>\";});";

  t.deepEqual(text({
    moduleId: 'a.html',
    contents: source,
    path: 'src/a.html',
    sourceMap: {
      version: 3,
      file: 'src/a.html',
      sources: ['src/a.html'],
      mappings: '',
      names: [],
      sourcesContent: [source]
    }
  }), {
    defined: ['text!a.html'],
    deps: [],
    contents: target
  });
});
