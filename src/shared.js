export function stripJsExtension(d) {
   return d.endsWith('.js') ? d.substring(0, d.length - 3) : d;
}
