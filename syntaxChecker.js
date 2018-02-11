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
}


// A container of templates
class ConditionalTemplate {
  constructor(nodes) {
    this._template = new Template();
    this._template.buildFromRaw(nodes);
  }

  test(template) {
    return true;
  }
}

// A container of templates
class RepeatableTemplate {
  constructor(nodes, sep) {
    this._template = new Template();
    this._template.buildFromRaw(nodes);
    this._sep = new Template();
    this._sep.buildFromRaw(sep);
  }

  test(template) {
    return true;
  }
}

class Template {
  constructor() {
    this._nodes = [];
  }

  append(node) {
    this._nodes.push(node);
  }

  buildFromRaw(nodes) {
    console.log(nodes);
    nodes.forEach(node => {
      if (node.type === 'conditional')
        this.append(new ConditionalTemplate(node.values));
      else if (node.type === 'repeatable')
        this.append(new RepeatableTemplate(node.value, node.sep));
      else if (node.type === 'node' && Array.isArray(node.value)) {
        let t = new Template();
        t.buildFromRaw(node.value)
        this.append(t);
      } else
        this.append(new Node(node));
    });
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
}


function buildTemplate (template) {
  return template.split('|').map(w => {
    return w.split('=').map(j => {
      return j.split(',').map(e => {
        let a = e.split('#')[1];
        if (a) {
          let b = a.split(';')[0]
          if (b) {
            let x = buildTemplate(TEMPLATES[b]);
            return e.replace('#' + b + ';', x);
          }
        }
        return e;
      }).join(',')
    }).join('=')
  }).join('|');
}

var hasOpenedBracket = e => e.split('[').length !== e.split(']').length
                            || e.split('{').length !== e.split('}').length;

function createTemplate (rawTemplate, nodeSeparator = '|') {
  var nodes = [];
  var c = '';

  for (let i=0; i<rawTemplate.length; i++) {
    let char = rawTemplate.charAt(i);
    switch (char) {
      case nodeSeparator:
        if (!hasOpenedBracket(c)) {
          nodes.push(c);
          c = '';
        } else c += char;
        break;
      default:
        c += char;
        if (i === rawTemplate.length - 1 && !hasOpenedBracket(c)) {
          nodes.push(c);
          c = '';
        };
        break;
    }
  }
  return nodes.map(n => {
    switch (n.charAt(0)) {
      case '[':
        let sn = n.split('=');
        return { 
          type: 'repeatable',
          value: createTemplate(sn[0].substring(1))[0],
          sep: createTemplate(sn[1].substring(0, sn[1].length - 1))[0]
        };
      case '{':
        if (n.charAt(n.length - 1) === '}')
          return { 
            type: 'conditional',
            values: createTemplate(n.substring(1, n.length - 1), ',')
          };
        else 
          return {
            type: 'node',
            value: createTemplate(n)
          };
      default:
        return {
          type: 'node',
          value: n.indexOf('|') !== -1 ? createTemplate(n) : n
        };
    }
  });
}

function printTemplate (t) {
  console.log(JSON.stringify(t));
}

module.exports = function checker(statement) {
  console.log('Checking: ' + statement);
  var ts = statement.split('|');

  var template = buildTemplate(TEMPLATES[ts[0]]);
  console.log(template);
  var tt = createTemplate(template)
  printTemplate(tt);
  var t = new Template();
  t.buildFromRaw(tt)
  //printTemplate(t);

  //return t.test(statement);
};
