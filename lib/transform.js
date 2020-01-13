const {SourceMapGenerator, SourceMapConsumer} = require('source-map');
const {warn} = require('./log');

if (typeof process === 'undefined' || process.browser) {
  SourceMapConsumer.initialize({
    "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.3/lib/mappings.wasm"
  });
}

module.exports = function(unit, ...transformers) {
  let p = Promise.resolve(unit);

  for (let i = 0, ii = transformers.length; i < ii; i++) {
    p = p.then(unit =>
      Promise.resolve(transformers[i](unit))
        .then(newUnit => mergeUnit(unit, newUnit))
    );
  }

  return p;
};

function mergeUnit(unit, newUnit) {
  if (!newUnit) {
    // bypass nil transform
    return unit;
  }

  // eslint-disable-next-line no-unused-vars
  const {path, contents, sourceMap, moduleId, packageName, defined, deps, ...others} = newUnit;
  const merged = {...unit, ...others};

  if (typeof contents === 'string' && unit.contents !== contents) {
    merged.contents = contents;
  }

  let p = Promise.resolve();
  if (sourceMap) {
    // merge source map
    if (unit.sourceMap && unit.sourceMap.mappings !== '') {
      // These promise wrapped source map consumer can work against
      // both source-map v0.7+ and source-map v0.5 or v0.6.
      p = Promise.all([
        new SourceMapConsumer(sourceMap),
        new SourceMapConsumer(unit.sourceMap)
      ]).then(([newConsumer, oldConsumer]) => {
        try {
          const generator = SourceMapGenerator.fromSourceMap(newConsumer);
          generator.applySourceMap(oldConsumer);
          merged.sourceMap = JSON.parse(generator.toString());
        } catch (err) {
          warn('merging sourceMap failed for ' + unit.path);
          warn(err);
          merged.sourceMap = undefined;
        }

        newConsumer.destroy();
        oldConsumer.destroy();
      });
    } else {
      merged.sourceMap = sourceMap;
    }
  }

  return p.then(() => {
    const mergedDefined = mergeArray(unit.defined, defined);
    const mergedDefs = mergeArray(unit.deps, deps);

    if (mergedDefined) merged.defined = mergedDefined;
    if (mergedDefs) merged.deps = mergedDefs;

    return merged;
  });
}

function mergeArray(arr1, arr2) {
  if (!arr1) return arr2;
  if (!arr2) return undefined;

  const merged = [...arr1];
  arr2.forEach(a => {
    if (merged.indexOf(a) === -1) merged.push(a);
  });

  return merged;
}
