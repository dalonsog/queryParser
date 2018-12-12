var TABLES = {};
const FUNCTIONS = require('./functions');

const retrieveData = table => TABLES[table].data;

const limitter = (arr, limit) => limit ? arr.slice(0, limit) : arr;

const filterer = (arr, where) => where ? filterFunc(arr, where) : arr;

const filterFunc = (arr, where) => arr.slice(0).filter(elem => eval(where));

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
    var headers = Object.keys(elem);
    var val = eval(column.SELECTOR);
    if (headers.indexOf(column.AS) === -1)
      elem[column.AS] = val;
    finalElem[column.AS] = val;
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

function formatter (data, format) {
  if (!data.length || !format || format === 'JSON') return data;
  switch (format) {
    case 'CSV':
      var headers = Object.keys(data[0]);
      var output = headers.join(',');
      data.forEach(row => {
        var values = [];
        headers.forEach(h => {
          values.push(row[h]);
        });
        output += `\n${values.join(',')}`;
      })
      return output;
    case 'KV':
      var headers = Object.keys(data[0]);
      var output = [];
      data.forEach(row => {
        var values = [];
        headers.forEach(h => {
          values.push(`${h}=${row[h]}`);
        });
        output.push(values.join(','));
      });
      return output.join('\n');
    default:
      return data;
  }
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
      data = data.map(mapper(options.SELECT));
      // Convert to output format
      return {
        data: formatter(data, options.CONVERT),
        length: data.length
      };
    },
    getTableHeaders: table => TABLES[table].headers,
    printTable: table => `${table} [${TABLES[table].headers.map(t => `${t.name}(${t.type})`)}]`,
    getTables: () => Object.keys(TABLES)
  };
};
