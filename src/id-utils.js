const KNOWN_EXTS = ['.js', '.json', '.html', '.htm', '.svg', '.css'];
const idWithPlugin = /^(\w+!)(.+)$/;

export function ext (id) {
  const parts = id.split('/');
  const last = parts.pop();
  const dotPos = last.lastIndexOf('.');
  if (dotPos !== -1) {
    const ext = last.substring(dotPos).toLowerCase();
    if (KNOWN_EXTS.indexOf(ext) !== -1) return ext;
  }
  return '';
}

export function parse (id) {
  let prefix = '';
  let bareId = id;
  let m = id.match(idWithPlugin);
  if (m) {
    prefix = m[1];
    bareId = m[2];
  }

  let extname = ext(bareId);
  if (extname === '.js') {
    bareId = bareId.substr(0, bareId.length - 3);
  }

  let parts = bareId.split('/');
  if (parts[0].startsWith('@') && parts.length > 1) {
    let scope = parts.shift();
    parts[0] = scope + '/' + parts[0];
  }

  return {
    prefix: prefix,
    bareId: bareId,
    parts: parts,
    ext: extname !== '.js' ? extname : ''
  }
}

export function resolveModuleId (baseId, relativeId) {
  let parsedBaseId = parse(baseId);
  let parsed = parse(relativeId);
  if (parsed.bareId[0] !== '.') return parsed.bareId;

  let parts = parsedBaseId.parts;
  parts.pop();

  parsed.bareId.split('/').forEach(function (p) {
    if (p === '..') {
      if (parts.length === 0) {
        // no where to go but to retain '..'
        // it could end up like '../package.json'
        parts.push('..');
      } else {
        parts.pop();
      }
    } else if (p !== '.') {
      parts.push(p);
    }
  })

  return parts.join('/');
}
