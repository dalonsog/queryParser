// TODO:
// * Aggregations - done
// * GROUP - done
// * Syntax checking - almost done
// * Functions' order -not sure if necessary
// * Operations - prioritary

const dataController = require('./dataController');
const QueryOptions = require('./queryOptions');
const tokenize = require('./tokenizer');
const checker = require('./syntaxChecker');
const RESERVED_WORDS = require('./reservedWords');
const UPPERCASED_TOKENS = RESERVED_WORDS.EXTRA_OPERATORS
                            .concat(RESERVED_WORDS.AGGREGATORS)
                            .concat(['AND', 'OR']);

function addQueryOptions (values, options) {
  Object.keys(values).forEach(mode => {
    values[mode].forEach(value => options.addOption(mode, value));
  });
}

function findKeywordInElement (keywordList, element) {
  let i = 0;
  while (i < keywordList.length) {
    if (element.indexOf(keywordList[i]) !== -1)
    return keywordList[i];
    i++;
  }
  return null;
};

var getStatementByKey = (statement, key) =>
  statement.reduce((acc, val) => acc.concat(val[key]), []);

var reservedWordsMapper = word =>
  UPPERCASED_TOKENS.indexOf(word.toUpperCase()) === -1
  ? word
  : word.toUpperCase();

function mapSelect (select) {
  return select.join('').split(',').map(elem => {
    var splittedElem = elem.split('AS');
    var selectObj = {
      COLUMN: splittedElem[0],
      AS: splittedElem[1] || splittedElem[0]
    };
    splittedElem[0] = splittedElem[0].replace(/\(|\)/g, '');

    var agg = findKeywordInElement(RESERVED_WORDS.AGGREGATORS, splittedElem[0]);
    if (agg) {
      selectObj.AGG = agg;
      selectObj.COLUMN = splittedElem[0];
    }
    return selectObj;
  });
}

function mapWhere (where) {
  return [where.map(function (e, i) {
    return e === 'AND' ? '&&'
           : e === 'OR' ? '||'
           : (e === '=' && ['<', '>'].indexOf(where[i-1]) === -1) ? '==='
           : e
  }).join('')];
}

function mapOrder (order) {
  return order.join(',').replace(/by,|BY,/, '').split(',').map(elem => {
    var mode = findKeywordInElement(['ASC', 'DESC'], elem) || 'ASC';
    return { COLUMN: elem.replace(mode, ''), MODE: mode };
  });
}

function mapGroup (group) {
  return group.join(',').replace(/by,|BY,/, '').split(',');
}

function mapAggregation (select) {
  return select.reduce((acc, val) =>
    val.AGG ? acc.concat({ COLUMN: val.COLUMN, FUNCTION: val.AGG }) : acc, []);
}

module.exports = query => {
  var start = new Date().getTime();
  var mode, values = {}, options = new QueryOptions(query);

  var tokenizedQuery = tokenize(query);
  var nextToken = tokenizedQuery.next();

  while (!nextToken.done) {
    var token = nextToken.value;

    // If new mode
    if (RESERVED_WORDS.OPERATORS.indexOf(token.type) !== -1) {
      mode = token.type;
      values[mode] = [];
    }
    // Add new value
    values[mode].push(token);
    nextToken = tokenizedQuery.next();
  }
  Object.keys(values).forEach(function (key) {
    let statement = getStatementByKey(values[key], 'type').join('|');
    let check = checker(statement);
    if (!check.check)
      throw new Error("Parsing failed. Query has errors: " + check.error);
    else
      values[key] = getStatementByKey(values[key].slice(1), 'value')
                      .map(reservedWordsMapper);
  });

  values.SELECT = mapSelect(values.SELECT);
  values.AGGREGATION = mapAggregation(values.SELECT);
  if (values.WHERE) values.WHERE = mapWhere(values.WHERE);
  if (values.ORDER) values.ORDER = mapOrder(values.ORDER);
  if (values.GROUP) values.GROUP = mapGroup(values.GROUP);
  // Add all values to queryOptions
  addQueryOptions(values, options);
  var data = dataController.getData(options);
  var end = new Date().getTime();
  console.log("\nTime(ms): " + (end - start).toString());
  return data;
};
