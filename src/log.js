export function info(message) {
  console.info('[dumber] INFO: ' + message);
}

export function warn(message) {
  console.warn(`\x1b[43m\x1b[30m[dumber] WARN: ${message}\x1b[0m`);
}

export function error(message) {
  console.error(`\x1b[41m\x1b[37m[dumber] ERROR: ${message}\x1b[0m`);
}
