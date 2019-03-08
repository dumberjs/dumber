export default function (unit, transformed) {
  if (transformed.defined) {
    let newDefined = transformed.defined
    if (!Array.isArray(newDefined)) newDefined = [newDefined];

    if (!unit.defined) {
      unit.defined = [];
    } else if (typeof unit.defined === 'string') {
      unit.defined = [unit.defined];
    }
    unit.defined.push.apply(unit.defined, newDefined);
  }

  if (transformed.contents) {
    unit.contents += transformed.contents;
  }
}
