const _CHECK_SYNTAX_ = true;

var dataController;

const QueryNodes = require('./queryNodes');
const tokenize = require('./tokenizer');
const checker = require('./syntaxChecker');
const RESERVED_WORDS = require('../config/reservedWords');
const UPPERCASED_TOKENS = RESERVED_WORDS.EXTRA_OPERATORS
                            .concat(RESERVED_WORDS.AGGREGATORS)
                            .concat(['AND', 'OR']);

function createQueryObject (query, nodes) {
  if (nodes.SELECT[0] === '*')
    nodes.SELECT = [dataController.getTableHeaders(nodes.FROM)
                                 .map(e => [e.name])];
  nodes.SELECT = mapSelect(nodes.SELECT);
  nodes.AGGREGATION = nodes.SELECT.reduce((acc, val) => {
    if (val.AGG) acc.push(val.AGG);
    return acc;
  }, []);
  if (nodes.WHERE) nodes.WHERE = mapWhere(nodes.WHERE);
  if (nodes.ORDER) nodes.ORDER = mapOrder(nodes.ORDER);
  if (nodes.GROUP) nodes.GROUP = mapGroup(nodes.GROUP);
  if (nodes.CONVERT) nodes.CONVERT = nodes.CONVERT.map(e => e.toUpperCase());

  var queryObject = new QueryNodes(query);
  Object.keys(nodes).forEach(node => {
    nodes[node].forEach(value => queryObject.addValue(node, value));
  });

  return queryObject;
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
  select = select.map(e => e === 'AS' ? '(AS)' : e);
  return select.join('').split(',').map(elem => {
    var splittedElem = elem.split('(AS)');
    var selectObj = {
      SELECTOR: splittedElem[0],
      AS: splittedElem[1] || splittedElem[0]
    };
    splittedElem[0] = splittedElem[0].replace(/\(|\)/g, '');

    var agg = findKeywordInElement(RESERVED_WORDS.AGGREGATORS, splittedElem[0]);
    if (agg) {
      let col = splittedElem[0].replace(agg, '');
      selectObj.AGG = { COLUMN: col, FUNCTION: agg };
      selectObj.SELECTOR = agg + '__' + col;
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
  return order.slice(1/*Removes BY*/).join('').split(',').map(elem => {
    var mode = findKeywordInElement(['ASC', 'DESC'], elem) || 'ASC';
    return { COLUMN: elem.replace(mode, ''), MODE: mode };
  });
}

function mapGroup (group) {
  return group.slice(1/*Removes BY*/).join(',').split(',');
}

function getQueryNodes (query) {
  var currentNode, nodes = {};

  var tokenizedQuery = tokenize(query);
  var nextToken = tokenizedQuery.next();

  while (!nextToken.done) {
    var token = nextToken.value;
    // If new node
    if (RESERVED_WORDS.OPERATORS.indexOf(token.type[0]) !== -1) {
      currentNode = token.type[0];
      nodes[currentNode] = [];
    }
    // Add new value
    nodes[currentNode].push(token);
    nextToken = tokenizedQuery.next();
  }
  Object.keys(nodes).forEach(function (node) {
    let statement = nodes[node].slice();
    let check = _CHECK_SYNTAX_ ? checker(statement) : { check: true };
    if (!check.check)
      throw new Error("Parsing failed. Query has errors: " + check.error);
    else
      nodes[node] = getStatementByKey(nodes[node].slice(1), 'value')
                      .map(reservedWordsMapper);
  });

  return nodes;
}

function checkColumnsExist (queryObject) {
  var tableHeaders = dataController.getTableHeaders(queryObject.FROM)
                                   .map(e => e.name);
  var requiredHeaders = queryObject.SELECT.reduce((acc, val) => {
    if (acc.indexOf(val.SELECTOR) === -1) acc.push(val.SELECTOR);
    return acc;
  }, []);
  var aliasedHeaders = queryObject.SELECT.reduce((acc, val) => {
    if (acc.indexOf(val.AS) === -1) acc.push(val.AS);
    return acc;
  }, []);
  for (let i = 0; i < requiredHeaders.length; i++)
    if (tableHeaders.indexOf(requiredHeaders[i]) === -1)
      throw new Error(
          "Column %s does not exist".replace('%s', requiredHeaders[i]));
}

module.exports = controller => {
  dataController = controller;
  return query => {
    var start = new Date().getTime();
    var nodes = getQueryNodes(query);
    var queryObject = createQueryObject(query, nodes);
    //checkColumnsExist(queryObject);
    var data = dataController.getData(queryObject);
    var end = new Date().getTime();
    return { data, queryObject, time: end - start, length: data.length };
  };
};
