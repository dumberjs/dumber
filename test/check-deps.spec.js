import test from 'tape';
import {dependencies} from '../package.json';

test('readable-stream must be 2.3.6 to make stream-browserify working', t => {
  t.equal(dependencies['readable-stream'], '^2.3.6');
  t.end();
});

test('source-map must be 0.6.1 for easy setup in browser', t => {
  t.equal(dependencies['source-map'], '^0.6.1');
  t.end();
});
