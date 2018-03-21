const TEMPLATES = require('./templates');

function checkParenthesis (nodes) {
  var balance = 0;
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    balance += node === 'OPEN_BRACKET' ? 1 : node === 'CLOSE_BRACKET' ? -1 : 0;
    if (balance < 0) return false;
  }

  return balance === 0;
}

function checkAggrParenthesis(nodes) {
  var isPreviousNodeAggr = false;
  for (let i = 0; i < nodes.length - 1; i++)
    if (nodes[i] === 'AGGREGATOR' && nodes[i + 1] !== 'OPEN_BRACKET')
      return false;

  return true;
}

function checkTemplates (elem, templateList) {
  for (let i = 0; i < templateList.length; i++){
    if (templateList[i] === elem) return true;
  }
  return false;
}

function checkSelect (nodes) {
  if (!checkParenthesis(nodes))
    return { check: false, error: 'bad parenthesis' };
  if (!checkAggrParenthesis(nodes))
    return { check: false, error: 'bad aggr parenthesis' };

  nodes = nodes.reduce((acc, val) => {
    if (val === 'COMMA')
      acc.push([]);
    else if (val !== 'OPEN_BRACKET' && val !== 'CLOSE_BRACKET')
      acc[acc.length - 1].push(val);
    return acc;
  }, [[]]).map(e => e.join('|'));

  for (let i = 0; i < nodes.length; i++)
    if (!checkTemplates(nodes[i], TEMPLATES.column))
      return { check: false, error: nodes[i] };

  return { check: true, error: null };
}

function checkFrom (nodes) {
  for (let i = 0; i < nodes.length; i++)
    if (!checkTemplates(nodes[i], TEMPLATES.table))
      return { check: false, error: nodes[i] };

  return { check: true, error: null };
}

function checkWhere (nodes) {
  if (!checkParenthesis(nodes))
    return { check: false, error: 'bad parenthesis' };

  nodes = nodes.reduce((acc, val) => {
    if (val === 'AND' || val === 'OR')
      acc.push([]);
    else if (val !== 'OPEN_BRACKET' && val !== 'CLOSE_BRACKET')
      acc[acc.length - 1].push(val);
    return acc;
  }, [[]]).map(e => e.join('|'));

  for (let i = 0; i < nodes.length; i++)
    if (!checkTemplates(nodes[i], TEMPLATES.condition))
      return { check: false, error: nodes[i] };

  return { check: true, error: null };
}

function checkGroup (nodes) {
  if (nodes.splice(0, 1)[0] !== 'BY')
    return { check: false, error: 'needed "by" after "group"' };

  nodes = nodes.reduce((acc, val) => {
    if (val === 'COMMA') acc.push([]);
    else acc[acc.length - 1].push(val);
    return acc;
  }, [[]]).map(e => e.join('|'));

  for (let i = 0; i < nodes.length; i++)
    if (!checkTemplates(nodes[i], TEMPLATES.grouper))
      return { check: false, error: nodes[i] };

  return { check: true, error: null };
}

function checkOrder (nodes) {
  if (nodes.splice(0, 1)[0] !== 'BY')
    return { check: false, error: 'needed "by" after "order"' };

  nodes = nodes.reduce((acc, val) => {
    if (val === 'COMMA') acc.push([]);
    else acc[acc.length - 1].push(val);
    return acc;
  }, [[]]).map(e => e.join('|'));

  for (let i = 0; i < nodes.length; i++)
    if (!checkTemplates(nodes[i], TEMPLATES.orderer))
      return { check: false, error: nodes[i] };

  return { check: true, error: null };
}

function checkLimit (nodes) {
  if (nodes.length > 1)
    return { check: false, error: 'unexpected token: ' + nodes.slice(1) };
  if (nodes[0] !== 'NUMBER')
    return { check: false, error: 'expected number after "limit" ' };
  return { check: true, error: null };
}

var defaultChecker = () => ({ check: true, error: null });

var checkerFactory = {
  SELECT: checkSelect,
  FROM: checkFrom,
  WHERE: checkWhere,
  GROUP: checkGroup,
  ORDER: checkOrder,
  LIMIT: checkLimit
};

module.exports = function (nodes) {
  var base = nodes.splice(0, 1);
  return checkerFactory[base](nodes);
};
