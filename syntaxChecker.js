/*
* DSL definition
*
* | => Node separator
* [a=COMMA,COMMA|BLANK] => one or more a, separated by "," or ", "
* {a,b,c} => one of [a, b, c]
* #e; => template of e
*
* Example:
*
* Template "OPERATOR|BLANK|[NAME|EXTRA_OPERATOR__AS|NAME={COMMA,COMMA|BLANK}]"
* results in a statement that must be formed by "OPERATOR" followed by a
* blank space and one or more NAME AS NAME substatements, separated by either
* a comma or a comma followed by a blank space.
*
* "OPERATOR C1 AS A, C2 AS B"
*/

const TEMPLATES = {
  // Select templates
  SELECT: 'SELECT|BLANK|[#COLUMN;=#COMMA_BLANK_SEP;]',
  COLUMN: '{NAME,#AGGR;,#ALIAS;}',
  AGGR: 'AGGREGATOR|NAME',
  ALIAS: '{NAME,NUMBER,STRING,#AGGR;}|EXTRA_OPERATOR__AS|NAME',

  // From template
  FROM: 'FROM|BLANK|NAME',

  // Where templates
  WHERE: 'WHERE|BLANK|[#CONDITION;=#ALL_SEP;]',
  CONDITION: 'NAME|#CONDITIONER;|{NAME,NUMBER,STRING}',
  CONDITIONER: '{CONDITIONER__>, CONDITIONER__<, CONDITIONER__=,' +
               ' CONDITIONER__<>, CONDITIONER__>=, CONDITIONER__<=}',

  // Group template
  GROUP: 'GROUP|EXTRA_OPERATOR_BY|BLANK|[NAME=#COMMA_BLANK_SEP;]',

  // Order templates
  ORDER: 'ORDER|EXTRA_OPERATOR_BY|BLANK|[#ORDERER;=#COMMA_BLANK_SEP;]',
  ORDERER: '{NAME,NAME|#ORDER_MODE;}',
  ORDER_MODE: '{EXTRA_OPERATOR_ASC,EXTRA_OPERATOR_DESC}',

  // Limit template
  LIMIT: 'LIMIT|BLANK|NUMBER',

  // Extra templates

  // Separators
  ALL_SEP: '{#COMMA_BLANK_SEP;,#AND_OR_SEP;}',
  COMMA_BLANK_SEP: '{COMMA,COMMA|BLANK}',
  AND_OR_SEP: '{BLANK|AND|BLANK,BLANK|OR|BLANK}'
};

class Node {
  constructor(value) {
    this._value = value;
  }

  test(nodeList) {
    return this._value === nodeList.splice(0, 1)[0];
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

  test(template) {
    return true;
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

  test(template) {
    return true;
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

  test(statement) {
    var nodes = statement.split('|'), error = false;
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
  console.log(t.toString());

  return t.test(statement);
};
