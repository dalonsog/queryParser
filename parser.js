// TODO:
// * Aggregations - done
// * GROUP - done
// * Syntax checking - REFACTOR NEEDED: Check nodes instead of templates
// * Functions' order - not sure if necessary
// * Operations - basic implementation

const dataController = require('./dataController');
const QueryNodes = require('./queryNodes');
const tokenize = require('./tokenizer');
const checker = require('./syntaxChecker');
const RESERVED_WORDS = require('./reservedWords');
const UPPERCASED_TOKENS = RESERVED_WORDS.EXTRA_OPERATORS
                            .concat(RESERVED_WORDS.AGGREGATORS)
                            .concat(['AND', 'OR']);

function addQueryNodes (query, nodes) {
  var options = new QueryNodes(query);

  nodes.SELECT = mapSelect(nodes.SELECT);
  nodes.AGGREGATION = mapAggregation(nodes.SELECT);
  if (nodes.WHERE) nodes.WHERE = mapWhere(nodes.WHERE);
  if (nodes.ORDER) nodes.ORDER = mapOrder(nodes.ORDER);
  if (nodes.GROUP) nodes.GROUP = mapGroup(nodes.GROUP);

  Object.keys(nodes).forEach(node => {
    nodes[node].forEach(value => options.addValue(node, value));
  });

  return options;
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

function getQueryNodes (query) {
  var currentNode, nodes = {};

  var tokenizedQuery = tokenize(query);
  var nextToken = tokenizedQuery.next();

  while (!nextToken.done) {
    var token = nextToken.value;
    // If new node
    if (RESERVED_WORDS.OPERATORS.indexOf(token.type) !== -1) {
      currentNode = token.type;
      nodes[currentNode] = [];
    }
    // Add new value
    nodes[currentNode].push(token);
    nextToken = tokenizedQuery.next();
  }

  Object.keys(nodes).forEach(function (node) {
    let statement = getStatementByKey(nodes[node], 'type').join('|');
    let check = checker(statement);
    //if (!check.check)
      //throw new Error("Parsing failed. Query has errors: " + check.error);
    //else
      nodes[node] = getStatementByKey(nodes[node].slice(1), 'value')
                      .map(reservedWordsMapper);
  });

  return nodes;
}

module.exports = query => {
  var start = new Date().getTime();
  var nodes = getQueryNodes(query);
  // Add all nodes to queryOptions
  var options = addQueryNodes(query, nodes);
  console.log(options)
  var data = dataController.getData(options);
  var end = new Date().getTime();
  return { data, options, time: end - start };
};
