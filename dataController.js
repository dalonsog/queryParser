const TABLES = {
  my_table1: [
    { C1: 1, C2: 'row1column2', C3: 1, C4: 1, C5: 'a'},
    { C1: 2, C2: 'row2column2', C3: 2, C4: 2, C5: 'a'},
    { C1: 3, C2: 'row3column2', C3: 2, C4: 3, C5: 'a'},
    { C1: 2, C2: 'row4column2', C3: 1, C4: 4, C5: 'a'},
    { C1: 4, C2: 'row5column2', C3: 3, C4: 5, C5: 'a'},
    { C1: 2, C2: 'row6column2', C3: 2, C4: 6, C5: 'a'},
    { C1: 3, C2: 'row7column2', C3: 1, C4: 7, C5: 'b'},
    { C1: 1, C2: 'row8column2', C3: 2, C4: 8, C5: 'b'},
    { C1: 3, C2: 'row9column2', C3: 1, C4: 9, C5: 'b'},
    { C1: 2, C2: 'row10column2', C3: 2, C4: 10, C5: 'b'},
    { C1: 4, C2: 'row11column2', C3: 1, C4: 11, C5: 'b'}
  ]
};

function retrieveData (table, columns) {
  var mapper = columns => elem => {
    var finalElem = {};
    columns.forEach(column => finalElem[column.AS] = elem[column.COLUMN]);
    return finalElem;
  };

  //return table.map(mapper(columns));
  return TABLES[table];
}

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

exports.getTableHeaders = table => Object.keys(TABLES[table][0]);
