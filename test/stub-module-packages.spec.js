const {test} = require('zora');

test('can resolve to required stubbing', t => {
  require.resolve('assert/');
  require.resolve('buffer/');
  require.resolve('events/');
  require.resolve('punycode/');
  require.resolve('process/');
  require.resolve('string_decoder/');
  require.resolve('url/');
  require.resolve('util/');

  t.throws(() => require.resolve('child_process/'));
  t.throws(() => require.resolve('cluster/'));
  t.throws(() => require.resolve('dgram/'));
  t.throws(() => require.resolve('dns/'));
  t.throws(() => require.resolve('net/'));
  t.throws(() => require.resolve('readline/'));
  t.throws(() => require.resolve('repl/'));
  t.throws(() => require.resolve('tls/'));
  t.throws(() => require.resolve('worker_thread/'));
  t.throws(() => require.resolve('sys/'));

  require.resolve('crypto-browserify');
  require.resolve('https-browserify');
  require.resolve('os-browserify');
  require.resolve('path-browserify');
  require.resolve('stream-browserify');
  require.resolve('timers-browserify');
  require.resolve('tty-browserify');
  require.resolve('vm-browserify');

  require.resolve('domain-browser');
  require.resolve('stream-http');
  require.resolve('querystring-browser-stub');
  require.resolve('browserify-zlib');
  require.resolve('fs-browser-stub');
});
