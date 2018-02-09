/*
* [a=COMMA,COMMA|BLANK] => one or more a, separated by "," or ", "
* {a,b,c} => one of [a, b, c]
* #e; => template of e
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

function createTemplate (rawTemplate) {
  var nodes = [];
  var c = '';

  for (let i=0; i<rawTemplate.length; i++) {
    let char = rawTemplate.charAt(i);
    if (char === '|' && !hasOpenedBracket(c)) {
      if (c.charAt(0) === '{' && c.charAt(c.length - 1) === '}')
        c = {
          type: 'conditional',
          value: createTemplate(c.substring(1, c.length - 1))
        };
      else if (c.charAt(0) === '[' && c.charAt(c.length - 1) === ']')
        c = {
          type: 'oneormore',
          value: createTemplate(c.substring(1, c.length - 1))
        };
      nodes.push(c);
      c = '';
    } else
      c += char;
  }
  if (c.charAt(0) === '{' && c.charAt(c.length - 1) === '}')
    c = {
      type: 'conditional',
      value: createTemplate(c.substring(1, c.length - 1))
    };
  else if (c.charAt(0) === '[' && c.charAt(c.length - 1) === ']')
    c = {
      type: 'oneormore',
      value: createTemplate(c.substring(1, c.length - 1))
    };
  nodes.push(c);
  return nodes;
}

function printTemplate (t) {
  console.log(JSON.stringify(t));
}

module.exports = function checker(statement) {
  console.log('Checking: ' + statement);
  var ts = statement.split('|');

  var template = buildTemplate(TEMPLATES[ts[0]]);
  console.log(template);
  printTemplate(createTemplate(template));

  var t = new Template();
  t.append(new Node('OPERATOR__LIMIT'));
  t.append(new Node('SEPARATOR__ '));
  t.append(new Node('NUMBER'));

  return t.test(statement);
};
