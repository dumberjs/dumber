export function stripJsExtension(d) {
   return d.endsWith('.js') ? d.substring(0, d.length - 3) : d;
}

export function isPackageName(path) {
  if (path.startsWith('.')) return false;
  const parts = path.split('/');
  // package name, or scope package name
  return parts.length === 1 || (parts.length === 2 && parts[0].startsWith('@'));
}