var TABLES = {};
const FUNCTIONS = require('./functions');

var retrieveData = table => TABLES[table].data;

var limitter = (arr, limit) => limit ? arr.slice(0, limit) : arr;

var filterer = (arr, where) => where ? filterFunc(arr, where) : arr;

function filterFunc (arr, where) {
  var newArr = arr.slice(0);
  var columns = Object.keys(newArr[0]);
  var whereFilter = formatFilter(columns, where);

  return newArr.filter(elem => eval(whereFilter));
}

function formatFilter (columns, whereFilter) {
  columns.forEach(function (column) {
    whereFilter = whereFilter.split(column).join('elem.' + column);
  });

  return whereFilter;
}

function orderer (arr, order) {
  if (!order.length) return arr;

  var orderedArr = arr.slice();

  orderedArr.sort(function (a, b) {
    var ordererFunc = (a, b, ord) => {
      var aC = a[ord.COLUMN], bC = b[ord.COLUMN] ;
      var result = aC > bC ? 1 : aC < bC ? -1 : 0;
      return ord.MODE === 'DESC' ? -1 * result : result;
    }

    var i = 0;
    var orderedValue = 0;

    while (orderedValue === 0 && i < order.length) {
      var orderedValue = ordererFunc(a, b, order[i]);
      i++;
    }

    return orderedValue;
  });

  return orderedArr;
}

function aggregator (arr, group, aggregations) {
  if (!aggregations.length) return arr;

  var groupedData = grouper(arr, group);
  var results = [];

  groupedData.forEach(function (data) {
    var result = {};
    group.forEach(function (groupKey) {
      result[groupKey] = data[0][groupKey];
    });

    aggregations.forEach(function (agg) {
      var f = FUNCTIONS[agg.FUNCTION.toLowerCase()];

      result[agg.FUNCTION + '__' + agg.COLUMN] =
        f(data, agg.COLUMN.replace(agg.FUNCTION, ''));
    });
    results.push(result);
  });
  return results;
}

var mapper = columns => elem => {
  var finalElem = {};
  columns.forEach(column => {
    let c = 'elem.' + column.SELECTOR;
    if (Object.keys(elem).indexOf(column.AS) === -1)
      elem[column.AS] = eval(c);
    finalElem[column.AS] = eval(c);
  });
  return finalElem;
};

function grouper (arr, group) {
  if (!group.length) return [arr];

  var groupedData = [arr];

  group.forEach(function (key) {
    var processedData = [];

    groupedData.forEach(function (rawData) {
      var grouper = {};

      grouper = rawData.reduce((acc, elem) => {
        if (!acc[elem[key]]) acc[elem[key]] = [];
        acc[elem[key]].push(elem);
        return acc;
      }, {});
      Object.keys(grouper).forEach(key => processedData.push(grouper[key]));
    });

    groupedData = processedData.slice(0);
  });

  return groupedData;
}

module.exports = tables => {
  TABLES = tables;
  return {
    getData: function (options) {
      // Get data from table
      var data = retrieveData(options.FROM);
      // Filter data, if needed
      data = filterer(data, options.WHERE);
      // Aggregate data, if needed
      data = aggregator(data, options.GROUP, options.AGGREGATION);
      // Order data, if needed
      data = orderer(data, options.ORDER);
      // Limit data, if needed
      data = limitter(data, options.LIMIT);
      // Map selected columns
      return data.map(mapper(options.SELECT));
    },
    getTableHeaders: table => TABLES[table].headers,
    getTables: () => Object.keys(TABLES)
  };
};
