var min = (data, c) => data.map(elem => elem[c])
                           .reduce((acc, val) => val < acc ? val : acc);

var max = (data, c) => data.map(elem => elem[c])
                           .reduce((acc, val) => val > acc ? val : acc);

var sum = (data, c) => data.map(elem => elem[c])
                           .reduce((acc, val) => acc + val);

var count = data => data.length;
var avg = (data, c) => sum(data, c) / count(data);

module.exports = { min, max, sum, count, avg };
