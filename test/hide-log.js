const log = require('../lib/log');

function noop() {}
log.info = noop;
log.warn = noop;
log.error = noop;
