const TEMPLATES = require('./templates');

class Node {
  constructor(value) {
    this._value = value;
  }

  test(nodesList) {
    if (this._value !== nodesList.slice(0, 1)[0]) return false;
    nodesList.splice(0, 1);
    return true;
  }

  getRaw() {
    return { object: 'node', value: this._value };
  }

  toString() {
    return JSON.stringify(this.getRaw());
  }
}

// A container of templates
class ConditionalTemplate {
  constructor(nodes) {
    this._nodes = nodes.map(Template._nodeFactory);
  }

  test(nodesList) {
    var passes = false;
    var myNodes = this._nodes.slice();
    var nodesAux;
    while (myNodes.length && !passes) {
      nodesAux = nodesList.slice();
      passes = myNodes.splice(0, 1)[0].test(nodesAux);
    }
    if (passes) {
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

// A container of templates
class RepeatableTemplate {
  constructor(value, sep) {
    this._value = Template._nodeFactory(value);
    this._sep = Template._nodeFactory(sep);
  }

  test(nodesList) {
    var passes = true;
    this._value.test(nodesList);
    while (nodesList.length && passes)
      passes = this._sep.test(nodesList) && this._value.test(nodesList);
    return passes;
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

  test(nodes) {
    if (typeof nodes === 'string') nodes = nodes.split('|');
    var myNodes = this._nodes.slice();
    while (myNodes.length) {
      if (!nodes.length) return false;
      let myNode = myNodes.splice(0, 1)[0];
      if (!myNode.test(nodes)) return false;
    }
    return true;
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

var hasOpenedBracket = e => e.split('[').length !== e.split(']').length
                            || e.split('{').length !== e.split('}').length;

var handleRepeatable = e => ({
  object: 'repeatable',
  value: parseBase(e[0].substring(1))[0],
  sep: parseBase(e[1].substring(0, e[1].length - 1))[0]
});

var handleConditional = e => {
  if (e.charAt(e.length - 1) === '}')
    return {
      object: 'conditional',
      values: parseBase(e.substring(1, e.length - 1), ',')
    };
  else
    return { object: 'node', value: parseBase(e) };
}

var handleDefault = e => ({
  object: 'node',
  value: e.indexOf('|') !== -1 ? parseBase(e) : e
});

function handleNode (n) {
  let char0 = n.charAt(0);
  if (char0 === '[') return handleRepeatable(n.split('='));
  else if (char0 === '{') return handleConditional(n);
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

module.exports = function checker(statement) {
  var base = statement.split('|')[0];
  var template = buildBase(TEMPLATES[base]);
  console.log('Checking: ' + statement);
  console.log('Against: ' + template);
  var tt = parseBase(template)
  var t = Template.buildFromRaw(tt);

  return t.test(statement);
};
