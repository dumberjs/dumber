/* globals document */
// Alert: this file will be used in users' app for ext:css plugin,
// use plain ES5 JavaScript Syntax.
var cssUrlMatcher = /url\s*\(\s*(?!['"]data)([^) ]+)\s*\)/gi;

// copied from aurelia-templating-resources css-resource
// This behaves differently from webpack's style-loader.
// Here we change './hello.png' to 'foo/hello.png' if base address is 'foo/bar'.
// Note 'foo/hello.png' is technically a relative path in css.
// We inject css into a style tag on html head, it means the 'foo/hello.png'
// is related to current url (not css url on link tag), or <base> tag in html
// head (which is recommended setup of aurelia-router if not using hash).
function fixupCSSUrls(address, css) {
  if (typeof css !== 'string') {
    throw new Error(`Failed loading required CSS file: ${address}`);
  }

  return css.replace(cssUrlMatcher, function(match, p1) {
    var quote = p1.charAt(0);
    if (quote === '\'' || quote === '"') {
      p1 = p1.substr(1, p1.length - 2);
    }
    var absolutePath = absoluteModuleId(address, p1);
    if (absolutePath === p1) {
      return match;
    }
    return 'url(\'' + absolutePath + '\')';
  });
}

function absoluteModuleId(baseId, moduleId) {
  if (moduleId[0] !== '.') return moduleId;

  var parts = baseId.split('/');
  parts.pop();

  var mParts = moduleId.split('/');
  var p;

  for (p of mParts) {
    if (p === '.') continue;
    if (p === '..') {
      parts.pop();
      continue;
    }
    parts.push(p);
  }

  return parts.join('/');
}

// copied from aurelia-pal-browser DOM.injectStyles
function injectCSS(css, id) {
  if (typeof document === 'undefined' || !css) return;
  css = fixupCSSUrls(id, css);

  if (id) {
    var oldStyle = document.getElementById(id);
    if (oldStyle) {
      var isStyleTag = oldStyle.tagName.toLowerCase() === 'style';

      if (isStyleTag) {
        oldStyle.innerHTML = css;
        return;
      }

      throw new Error('The provided id does not indicate a style tag.');
    }
  }

  var node = document.createElement('style');
  node.innerHTML = css;
  node.type = 'text/css';

  if (id) {
    node.id = id;
  }

  document.head.appendChild(node);
}

// dumber-module-loader plugin ext:css
function load(name, req, load) {
  req(['text!' + name], function(text) {
    var result = splitCssModuleExports(text);
    injectCSS(result.css, name);
    // When css-module is in use, the module exports will be
    // a map of tokens. Otherwise, export original css string.
    load(result.exportTokens || result.css);
  });
}

function splitCssModuleExports(text) {
  if (!text) return {css: ''};
  var m = text.match(/\/\*\s*dumber-css-module:\s*(.+)\s*\*\/\s*$/);
  if (!m) return {css: text};
  var css = text.slice(0, m.index);
  var exportTokens = JSON.parse(m[1]);
  return {css, exportTokens};
}

exports.fixupCSSUrls = fixupCSSUrls;
exports.injectCSS = injectCSS;
exports.splitCssModuleExports = splitCssModuleExports;
exports.load = load;
