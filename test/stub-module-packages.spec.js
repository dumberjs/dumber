const test = require('tape');

test('can resolve to required stubbing', t => {
  t.doesNotThrow(() => require.resolve('assert/'));
  t.doesNotThrow(() => require.resolve('buffer/'));
  t.doesNotThrow(() => require.resolve('events/'));
  t.doesNotThrow(() => require.resolve('punycode/'));
  t.doesNotThrow(() => require.resolve('process/'));
  t.doesNotThrow(() => require.resolve('string_decoder/'));
  t.doesNotThrow(() => require.resolve('url/'));
  t.doesNotThrow(() => require.resolve('util/'));

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

  t.doesNotThrow(() => require.resolve('crypto-browserify'));
  t.doesNotThrow(() => require.resolve('https-browserify'));
  t.doesNotThrow(() => require.resolve('os-browserify'));
  t.doesNotThrow(() => require.resolve('path-browserify'));
  t.doesNotThrow(() => require.resolve('stream-browserify'));
  t.doesNotThrow(() => require.resolve('timers-browserify'));
  t.doesNotThrow(() => require.resolve('tty-browserify'));
  t.doesNotThrow(() => require.resolve('vm-browserify'));

  t.doesNotThrow(() => require.resolve('domain-browser'));
  t.doesNotThrow(() => require.resolve('stream-http'));
  t.doesNotThrow(() => require.resolve('querystring-es3'));
  t.doesNotThrow(() => require.resolve('browserify-zlib'));
  t.doesNotThrow(() => require.resolve('fs-browser-stub'));

  t.end();
});
