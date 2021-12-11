const intendedDifficulty = 1;

/**
 * @param {number} min
 * @param {number} max
 * @param {number} numValues
 * @returns {[number,number][]}
 */
function randomValuesInInterval(min = 0, max, numValues) {
  const range = max - min;
  const values = [];
  for (let i = 0; i < numValues; i++) {
    values.push((Math.random() + min) * range);
  }
  return values;
}

function splitIntervalIntoDeltas(min = 0, max, numValues) {
  const values = randomValuesInInterval(min, max, numValues);
  values.sort((a, b) => b - a);
  const deltas = [];
  for (const [curr, next] of zip(values.splice(0, -1), values.slice(1))) {
    deltas.push(next - curr);
  }
  return deltas;
}

for (let i = 0; i < 5; i++) {
  console.log(splitIntervalIntoDeltas(0, 100, 10));
}

function computeLevel({ numberOfEggs, amountOfTime }) {
  return {
    spawnQueue: [],
  };
}
