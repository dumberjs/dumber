/* global localStorage */
export function getCache(hash) {
  try {
    return JSON.parse(localStorage.getItem(hash))
  } catch (e) {
    // ignore
  }
}

export function setCache(hash, object) {
  localStorage.setItem(hash, JSON.stringify(object));
}

export function clearCache() {
  localStorage.clear();
}
