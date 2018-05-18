var min = (data, c) => data.reduce(
  (acc, val) => val[c] < acc ? val[c] : acc, data[0][c]);

var max = (data, c) => data.reduce(
  (acc, val) => val > acc ? val : acc, data[0][c]);

var first = (data, c) => data[0][c];

var last = (data, c) => data[data.length - 1][c];

var sum = (data, c) => data.reduce((acc, val) => acc + val[c], 0);

var count = data => data.length;
var avg = (data, c) => sum(data, c) / count(data);

var values = (data, c) => Object.keys(data.reduce((acc, val) => {
                            acc[val[c]] = 0;
                            return acc;
                          }, {}));

var dc = (data, c) => values(data, c).length;

var median = (data, c) => {
  let sortedData = data.map(e => e[c]).sort();
  let medianIndex = sortedData.length / 2;
  if (medianIndex % 2 !== 0) return sortedData[Math.ceil(medianIndex) - 1];
  else return (sortedData[medianIndex] + sortedData[medianIndex - 1]) / 2;
}

module.exports = { min, max, sum, count, avg, values, dc, first, last, median };
