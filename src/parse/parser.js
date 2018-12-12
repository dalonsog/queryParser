const _CHECK_SYNTAX_ = true;

var dataController;

const QueryNodes = require('./queryNodes');
const tokenize = require('./tokenizer');
const checker = require('../lang/sql/checker');
const RESERVED_WORDS = require('../config/reservedWords');
const UPPERCASED_TOKENS = RESERVED_WORDS.EXTRA_OPERATORS
                            .concat(RESERVED_WORDS.AGGREGATORS)
                            .concat(['AND', 'OR']);

const COLUMN_EXTRACT_REGEX = /elem\.(?:[A-Z]+\_\_)?(\w+)/g;

function createQueryObject (query, nodes) {
  if (nodes.SELECT[0] === '*')
    nodes.SELECT = [dataController.getTableHeaders(nodes.FROM)
                                 .map(e => `elem.${[e.name]}`)];
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
      AS: splittedElem[1] || splittedElem[0].replace('elem.', '')
    };
    splittedElem[0] = splittedElem[0].replace(/\(|\)/g, '');

    var agg = findKeywordInElement(RESERVED_WORDS.AGGREGATORS, splittedElem[0]);
    if (agg) {
      let col = splittedElem[0].replace(agg, '').replace('elem.', '');
      selectObj.AGG = { COLUMN: col, FUNCTION: agg };
      selectObj.SELECTOR = `elem.${agg}__${col}`;
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

function mapElems (elems) {
  elems.forEach((e, idx) => {
    e.value = e.type[0] === 'NAME' && elems[idx - 1] && elems[idx - 1].type[0] !== 'AS'
              ? `elem.${e.value}`
              : `${e.value}`
  });
  return elems;
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
      //TODO: Improve FROM, GROUP, ORDER clauses skipping mapElems
      nodes[node] =
        getStatementByKey((['FROM', 'GROUP', 'ORDER'].indexOf(node) === -1
                          ? mapElems(nodes[node])
                          : nodes[node]).slice(1), 'value')
          .map(reservedWordsMapper);
  });

  return nodes;
}

// TODO
function checkColumnsExist (queryObject) {
  var selectors = queryObject.SELECT.map(e=>e.SELECTOR);
  var tableHeaders = dataController
                       .getTableHeaders(queryObject.FROM)
                       .reduce((acc, val) => {
                         acc[val.name] = val.type;
                         return acc;
                       }, {});

  for (var i = 0; i < selectors.length; i++) {
    var fields = [];
    var field, elem = selectors[i];
    while (field = COLUMN_EXTRACT_REGEX.exec(elem)) fields.push(field[1]);
    //TODO: Check wether all extracted field names are in 'tableHeaders' and
    //      their type matches. If so, add the ALIAS to 'tableHeaders'
    for (field of fields)
      if (!(field in tableHeaders))
        throw new Error(`Column ${field} does not exist`);
    tableHeaders[queryObject.SELECT[i].AS] = 'str';
  }

  return true;
}

module.exports = controller => {
  dataController = controller;
  return query => {
    var start = new Date().getTime();
    var nodes = getQueryNodes(query);
    var queryObject = createQueryObject(query, nodes);
    if (!checkColumnsExist(queryObject)) return {};
    var { data, length } = dataController.getData(queryObject);
    var end = new Date().getTime();
    return { data, length, queryObject, time: end - start };
  };
};
