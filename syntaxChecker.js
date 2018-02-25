const TEMPLATES = require('./templates');

class Node {
  constructor(value) {
    this._value = value;
  }

  test(nodesList) {
    var x = this._value !== nodesList.slice(0, 1)[0]
    if (x) return { check: false };
    nodesList.splice(0, 1);
    return { check: true };
  }

  getRaw() {
    return { object: 'node', value: this._value };
  }

  toString() {
    return JSON.stringify(this.getRaw());
  }
}

class ConditionalTemplate {
  constructor(nodes) {
    this._nodes = nodes.map(Template._nodeFactory);
  }

  test(nodesList) {
    var passes = { check: false };
    var myNodes = this._nodes.slice();
    var nodesAux;
    while (myNodes.length && !passes.check) {
      nodesAux = nodesList.slice();
      passes = myNodes.splice(0, 1)[0].test(nodesAux);
    }
    if (passes.check) {
      nodesList.splice(0);
      nodesList.push(...nodesAux);
    }
    return passes;
  }

  getRaw() {
    return { object: 'conditional', nodes: this._nodes.map(n => n.getRaw()) };
  }

  toString() {
    return JSON.stringify(this.getRaw());
  }
}

class RepeatableTemplate {
  constructor(value, sep) {
    this._value = Template._nodeFactory(value);
    this._sep = Template._nodeFactory(sep);
  }

  test(nodesList) {
    var nodesAux = nodesList.slice();
    var passes = this._value.test(nodesAux);
    while (nodesAux.length && passes.check) {
      passes = this._sep.test(nodesAux);
      if (passes.check) {
        nodesList.splice(0);
        nodesList.push(...nodesAux);
        passes = this._value.test(nodesAux);
        if (passes.check) {
          nodesList.splice(0);
          nodesList.push(...nodesAux);
        }
      }
    }
    //if (passes.check) {
    nodesList.splice(0);
    nodesList.push(...nodesAux);
    //}
    return { check: true };
  }

  getRaw() {
    return {
      object: 'repeatable',
      value: this._value.getRaw(),
      sep: this._sep.getRaw()
    };
  }

  toString() {
    return JSON.stringify(this.getRaw());
  }
}

class Template {
  constructor() {
    this._nodes = [];
  }

  append(node) {
    this._nodes.push(node);
  }

  static buildFromRaw(nodes) {
    var t = new Template();
    nodes.forEach(n => { t.append(Template._nodeFactory(n)); });
    return t;
  }

  static _nodeFactory(node) {
    if (node.object === 'conditional')
      return new ConditionalTemplate(node.values);
    else if (node.object === 'repeatable')
      return new RepeatableTemplate(node.value, node.sep);
    else if (node.object === 'node' && Array.isArray(node.value))
      return Template.buildFromRaw(node.value);
    else
      return new Node(node.value);
  }

  test(nodesList) {
    var myNodes = this._nodes.slice();
    var nodesAux = nodesList.slice();
    while (myNodes.length) {
      if (!nodesAux.length)
        return { check: false, error: nodesAux };
      let myNode = myNodes.splice(0, 1)[0];
      if (!myNode.test(nodesAux).check) {
        return { check: false, error: nodesAux };
      }
    }
    nodesList.splice(0);
    nodesList.push(...nodesAux);
    return { check: true, error: null };
  }

  testStatement(nodesList) {
    if (typeof nodesList === 'string') nodesList = nodesList.split('|');
    var passes = this.test(nodesList);
    if (nodesList.length) return { check: false, error: nodesList };
    return passes;
  }

  getRaw() {
    return {
      object: 'template',
      nodes: this._nodes.map(n => n.getRaw())
    };
  }

  toString() {
    return JSON.stringify(this.getRaw());
  }
}

function buildBase (template) {
  var idx = template.indexOf('#');
  while (idx !== -1) {
    let templateAlias = template.substring(idx, template.indexOf(';', idx) + 1);
    template = template.replace(
      templateAlias,
      TEMPLATES[templateAlias.substring(1, templateAlias.length - 1)]
    );
    idx = template.indexOf('#');
  }
  return template;
}

var hasOpenedBracket = e => {
  let b = [0, 0];
  for (let i=0; i<e.length; i++) {
    let c = e.charAt(i);
    if (c==='[') b[0] += 1;
    if (c===']') b[0] -= 1;
    if (c==='{') b[1] += 1;
    if (c==='}') b[1] -= 1;
  }
  return !!b[0] || !!b[1];
};

var isConditional = e => {
  var opened = 0;
  let i = 1;
  while (opened >= 0 && i < e.length - 1) {
    if (e.charAt(i) === '{') opened += 1;
    if (e.charAt(i) === '}') opened -= 1;
    i++;
  }
  return !opened;
};

var handleRepeatable = e => ({
  object: 'repeatable',
  value: handleDefault(e[0].substring(1)),
  sep: parseBase(e[1].substring(0, e[1].length - 1))[0]
});

var handleConditional = e => ({
  object: 'conditional',
  values: parseBase(e.substring(1, e.length - 1), ',')
});

var handleDefault = e => ({
  object: 'node',
  value: e.indexOf('|') !== -1 ? parseBase(e) : e
});

function handleNode (n) {
  let char0 = n.charAt(0);
  if (char0 === '[') {
    let tmp = n.split('::');
    if (tmp.length > 2) {
      let sep = tmp.pop();
      tmp = [tmp.join('::'), sep];
    }
    return handleRepeatable(tmp);
  }
  else if (char0 === '{' && isConditional(n))
    return handleConditional(n);
  else return handleDefault(n);
}

function parseBase (rawTemplate, nodeSeparator = '|') {
  var nodes = [], c = '';

  for (let i=0; i<rawTemplate.length; i++) {
    let char = rawTemplate.charAt(i);
    if (char === nodeSeparator) {
      if (!hasOpenedBracket(c)) {
        nodes.push(handleNode(c));
        c = '';
      } else c += char;
    } else {
      c += char;
      if (i === rawTemplate.length - 1 && !hasOpenedBracket(c)) {
        nodes.push(handleNode(c));
        c = '';
      }
    }
  }

  return nodes;
}

function checkParenthesis (nodes) {
  var balance = 0;
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    balance += node === 'OPEN_BRACKET' ? 1 : node === 'CLOSE_BRACKET' ? -1 : 0;
    if (balance < 0) return false;
  }
  return balance === 0;
}

function cleanParenthesis (nodes) {
  return nodes.reduce((acc, val) => {
    if (val !== 'OPEN_BRACKET' && val !== 'CLOSE_BRACKET') acc.push(val);
    return acc;
  }, []);
}

function checkAggrParenthesis(nodes) {
  var isPreviousNodeAggr = false;
  for (let i = 0; i < nodes.length - 1; i++)
    if (nodes[i] === 'AGGREGATOR' && nodes[i + 1] !== 'OPEN_BRACKET')
      return false;
  
  return true;
}

module.exports = function checker(statement) {
  var nodes = statement.split('|')
  var base = nodes[0];
  var template = buildBase(TEMPLATES[base]);
  
  if (!checkParenthesis(nodes))
    return { check: false, error: 'bad parenthesis' };
  if (!checkAggrParenthesis(nodes))
    return { check: false, error: 'bad aggr parenthesis' };
  
  statement = cleanParenthesis(nodes).join('|');
  console.log('Checking: ' + statement);
  console.log('Against: ' + template);
  var tt = parseBase(template);
  var t = Template.buildFromRaw(tt);

  return t.testStatement(statement);
};
