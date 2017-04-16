// TODO:
// * Aggregations
// * GROUP
// * Syntax checking
// * Functions' order
// * Operations

const dataController = require('./dataController');
const QueryOptions = require('./queryOptions');
const Tokenizer = require('./tokenizer');

const OPERATIONS = ['SELECT', 'FROM', 'WHERE', 'LIMIT', 'GROUP', 'ORDER'];

const EXTRA_OPERATIONS = ['AS', 'BY', 'AND', 'ASC', 'DESC'];

const AGGREGATION_FUNCTIONS = ['MIN', 'MAX', 'COUNT', 'SUM', 'AVG'];

const RESERVED_WORDS = OPERATIONS.concat(EXTRA_OPERATIONS);

function addQueryOptions (values, options) {
  Object.keys(values).forEach(mode => {
    values[mode].forEach(value => options.addOption(mode, value));
  });
}

function mapSelect (select) {
  var mapper = elem => {
    var splittedElem = elem.split('AS');
    var selectObj = { 
      COLUMN: splittedElem[0], 
      AS: splittedElem[1] || splittedElem[0]
    };

    splittedElem[0] = splittedElem[0].replace(/min\(|MIN\(/g, 'MIN')
                                     .replace(/max\(|MAX\(/g, 'MAX')
                                     .replace(/avg\(|AVG\(/g, 'AVG')
                                     .replace(/count\(|COUNT\(/g, 'COUNT')
                                     .replace(/sum\(|SUM\(/g, 'SUM')
                                     .replace(/\)/g, '');
    
    var agg = splittedElem[0].match(/MIN|MAX|AVG|SUM|COUNT/);
    
    if (agg) {
      selectObj.AGG = agg[0];
      selectObj.COLUMN = splittedElem[0];
    }

    return selectObj;
  };

  return select.join(',')
               .replace(/,AS,|,as,/g, 'AS')
               .split(',')
               .map(mapper);
}

function mapWhere (where) {
  return where.join('').replace(/AND|and/g, 'AND').split('AND');
}

function mapOrder (order) {
  var mapper = elem => {
    var mode = elem.match(/ASC|DESC/);
    mode = mode ? mode[0] : 'ASC';
    return { COLUMN: elem.replace(mode, ''), MODE: mode };
  };
  
  return order.join(',')
              .replace(/,asc|,ASC/g, 'ASC')
              .replace(/,desc|,DESC/g, 'DESC')
              .replace(/by,|BY,/, '')
              .split(',')
              .map(mapper);
}

function mapGroup (group) {
  return group.join(',')
              .replace(/by,|BY,/, '')
              .split(',');
}

function mapAggregation (select) {
  return select.reduce((acc, val) => 
    val.AGG ? acc.concat({ COLUMN: val.COLUMN, FUNCTION: val.AGG }) : acc, []);
}

module.exports = query => {
  var mode, values = {}, options = new QueryOptions(query);

  var tokenizedQuery = Tokenizer.tokenize(query);

  while (tokenizedQuery.hasNext()) {
    var token = tokenizedQuery.next();
    var tokenUpperCase = token.toUpperCase();
    // If new mode
    if (OPERATIONS.indexOf(tokenUpperCase) !== -1) {
      mode = tokenUpperCase;
      values[mode] = [];
    } else
        // Add new value
        values[mode].push(token);
  }
  values.SELECT = mapSelect(values.SELECT);
  values.AGGREGATION = mapAggregation(values.SELECT);
  if (values.WHERE) values.WHERE = mapWhere(values.WHERE);
  if (values.ORDER) values.ORDER = mapOrder(values.ORDER);
  if (values.GROUP) values.GROUP = mapGroup(values.GROUP);
  // Add all values to queryOptions
  addQueryOptions(values, options);

  return dataController.getData(options);
};