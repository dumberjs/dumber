export function info(message) {
  console.info(`\x1b[36m[dumber] INFO: ${message}\x1b[0m`);
}

export function warn(message) {
  console.warn(`\x1b[32m[dumber] WARN: ${message}\x1b[0m`);
}

export function error(message) {
  console.error(`\x1b[31m[dumber] ERROR: ${message}\x1b[0m`);
}
