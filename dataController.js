const TABLES = require('./Data');

var retrieveData = table => TABLES[table].data;

var limitter = (arr, limit) => limit ? arr.slice(0, limit) : arr;

var filterer = (arr, where) => where ? filterFunc(arr, where) : arr;

function filterFunc (arr, where) {
  var newArr = arr.slice(0);
  var columns = Object.keys(newArr[0]);
  var whereFilters = formatFilters(columns, where);
  
  whereFilters.forEach(function (whereFilter) {
    newArr = newArr.filter(elem => eval(whereFilter));
  });

  return newArr;
}

function formatFilters (columns, filters) {
  var formattedFilters = [];
  
  filters.forEach(function (whereFilter) {
    columns.forEach(function (column) {
      whereFilter = whereFilter.replace(column, 'elem.' + column);
    });

    formattedFilters.push(whereFilter);
  });

  return formattedFilters;
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

  var groupedData = grouper (arr, group);
  
  var min = (data, c) => data.map(elem => elem[c])
                             .reduce((acc, val) => val < acc ? val : acc);

  var max = (data, c) => data.map(elem => elem[c])
                             .reduce((acc, val) => val > acc ? val : acc);                             

  var sum = (data, c) => data.map(elem => elem[c])
                             .reduce((acc, val) => acc + val);

  var count = data => data.length;
  var avg = (data, c) => sum(data, c) / count(data);

  var results = [];

  groupedData.forEach(function (data) {
    var result = {};
    group.forEach(function (groupKey) {
      result[groupKey] = data[0][groupKey];
    });
    
    aggregations.forEach(function (agg) {
      var c = agg.COLUMN;
      var f = agg.FUNCTION;

      result[c] = eval(f.toLowerCase())(data, c.replace(f, ''));
    });
    results.push(result);
  });

  return results;
}

var mapper = columns => elem => {
  var finalElem = {};
  columns.forEach(column => finalElem[column.AS] = elem[column.COLUMN]);
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

exports.getData = function (options) {
  // Get data from table
  var data = retrieveData(options.FROM);
  // Filter data
  data = filterer(data, options.WHERE);
  // Aggregate data, if needed
  data = aggregator(data, options.GROUP, options.AGGREGATION);
  // Order data, if needed
  data = orderer(data, options.ORDER);
  // Limit data, if needed
  data = limitter(data, options.LIMIT);
  // Map selected columns
  return data.map(mapper(options.SELECT));
};

exports.getTableHeaders = table => TABLES[table].headers;
