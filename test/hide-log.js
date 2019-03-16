import * as log from '../src/log';

function noop() {}
log.info = noop;
log.warn = noop;
log.error = noop;
