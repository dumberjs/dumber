import {SourceMapGenerator, SourceMapConsumer} from 'source-map';
import {warn} from './log';

export default function(unit, ...transformers) {
  let p = Promise.resolve(unit);

  for (let i = 0, ii = transformers.length; i < ii; i++) {
    p = p.then(unit =>
      Promise.resolve(transformers[i](unit))
        .then(newUnit => mergeUnit(unit, newUnit))
    );
  }

  return p;
}

function mergeUnit(unit, newUnit) {
  if (!newUnit) {
    // bypass nil transform
    return unit;
  }

  // eslint-disable-next-line no-unused-vars
  const {path, contents, sourceMap, moduleId, packageName, defined, deps, ...others} = newUnit;
  const merged = {...unit, ...others};

  if (contents && unit.contents !== contents) {
    merged.contents = contents;
  }

  if (sourceMap) {
    // merge source map
    if (unit.sourceMap && unit.sourceMap.mappings !== '') {
      try {
        const generator = SourceMapGenerator.fromSourceMap(new SourceMapConsumer(sourceMap));
        generator.applySourceMap(new SourceMapConsumer(unit.sourceMap));
        merged.sourceMap = JSON.parse(generator.toString());
      } catch (err) {
        warn('merging sourceMap failed for ' + unit.path);
        warn(err);
        merged.sourceMap = undefined;
      }
    } else {
      merged.sourceMap = sourceMap;
    }
  }

  const mergedDefined = mergeArray(unit.defined, defined);
  const mergedDefs = mergeArray(unit.deps, deps);

  if (mergedDefined) merged.defined = mergedDefined;
  if (mergedDefs) merged.deps = mergedDefs;

  return merged;
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
