import path from 'path';
import os from 'os';
import fs from 'fs';
import del from 'del';
import mkdirp from 'mkdirp';

const tmpDir = os.tmpdir();
const CACHE_DIR = path.resolve(tmpDir, 'dumber');

function cachedFilePath(hash) {
  const folder = hash.slice(0, 2);
  const fileName = hash.slice(2);
  return path.resolve(CACHE_DIR, folder, fileName);
}

export function getCache(hash) {
  const filePath = cachedFilePath(hash);
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (e) {
    // ignore
  }
}

export function setCache(hash, object) {
  const filePath = cachedFilePath(hash);
  mkdirp.sync(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(object));
}

export function clearCache() {
  return del(CACHE_DIR, {force: true});
}
