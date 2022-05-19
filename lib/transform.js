const SourceMap = require('@parcel/source-map').default;
const {warn} = require('./log');

const SLOW_TRANSFORM = 10000;

module.exports = function (unit, ...transformers) {
  const {packageName, moduleId, path} = unit;
  const size = unit.contents.length;
  let p = Promise.resolve(unit);
  const start = (new Date()).getTime();
  let previous = start;
  const timers = [];

  for (let i = 0, ii = transformers.length; i < ii; i++) {
    p = p.then(unit => {
      return Promise.resolve(transformers[i](unit))
        .then(newUnit => mergeUnit(unit, newUnit))
        .then(mergedUnit => {
          const now = (new Date()).getTime();
          const period = now - previous;
          previous = now;
          timers.push({name: transformers[i].name, period: period / 1000});
          return mergedUnit;
        });
    });
  }

  p = p.then(newUnit => {
    const total = (new Date()).getTime() - start;
    if (total >= SLOW_TRANSFORM) {
      warn('==================================');
      warn(' Detected slow code transform');
      if (packageName) warn(` Package : ${packageName}`);
      warn(` Module  : ${moduleId}`);
      warn(` Path    : ${path}`);
      warn(` Size    : ${size}`);
      warn('----------------------------------');
      timers.forEach(timer => {
        if (timer.period >= 0.01) {
          warn(` ${timer.name.padEnd(20)} ${timer.period.toFixed(3).padStart(7)}s`);
        }
      });
      warn('----------------------------------');
      warn(` Total time           ${(total / 1000).toFixed(2).padStart(7)}s`);
      warn('==================================');
    }

    if (newUnit.sourceMap && newUnit.sourceMap.sourceRoot === "") {
      delete newUnit.sourceMap.sourceRoot;
    }
    return newUnit;
  })

  return p;
};

function mergeUnit(unit, newUnit) {
  if (!newUnit) {
    // bypass nil transform
    return unit;
  }

  if (newUnit.parsed) {
    // reuse parsed on unchanged code
    return {...unit, parsed: newUnit.parsed};
  }

  // eslint-disable-next-line no-unused-vars
  const {path, contents, sourceMap, moduleId, packageName, defined, deps, ...others} = newUnit;
  const merged = {...unit, ...others};
  delete merged.parsed;

  if (typeof contents === 'string' && unit.contents !== contents) {
    merged.contents = contents;
  }

  let p = Promise.resolve();
  if (sourceMap && unit.sourceMap) {
    // merge source map
    if (unit.sourceMap.mappings !== '') {
      try {
        const existingMap = new SourceMap();
        existingMap.addVLQMap(unit.sourceMap);

        const map = new SourceMap();
        map.addVLQMap(sourceMap);
        map.extends(existingMap);

        const mergedMap = map.toVLQ();
        mergedMap.version = 3;
        mergedMap.file = sourceMap.file;
        merged.sourceMap = mergedMap;
      } catch (e) {
        // ignore broken source map
        delete merged.sourceMap;
      }
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
