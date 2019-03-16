import test from 'tape';
import text from '../../src/transformers/text';

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
      mappings: '',
      names: [],
      sourcesContent: [source]
    }
  });
  t.end();
});
