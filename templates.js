/*
* DSL definition
*
* | => Node separator
* [a=COMMA] => one or more a, separated by ","
* {a,b,c} => one of [a, b, c]
* #e; => template of e
*
* Example:
*
* Template "OPERATOR|[NAME|EXTRA_OPERATOR__AS|NAME=COMMA]"
* results in a statement that must be formed by "OPERATOR" followed by a
* blank space and one or more NAME AS NAME substatements, separated by a comma.
*
* "OPERATOR C1 AS A, C2 AS B"
*/

// TODO
// Change separators keychar in repeatables, '=' already in use by conditioners

module.exports = {
  // Select templates
  SELECT: 'SELECT|[#COLUMN;=COMMA]',
  COLUMN: '{#ALIAS;,#AGGR;,NAME}',
  AGGR: 'AGGREGATOR|NAME',
  ALIAS: '{#AGGR;,NUMBER,STRING,NAME}|EXTRA_OPERATOR__AS|NAME',

  // From template
  FROM: 'FROM|NAME',

  // Where templates
  WHERE: 'WHERE|[#CONDITION;=#ALL_SEP;]',
  CONDITION: 'NAME|#CONDITIONER;|{NAME,NUMBER,STRING}',
  CONDITIONER: '{CONDITIONER__>, CONDITIONER__<, CONDITIONER__=,' +
               ' CONDITIONER__<>, CONDITIONER__>=, CONDITIONER__<=}',

  // Group template
  GROUP: 'GROUP|EXTRA_OPERATOR_BY|[NAME=COMMA]',

  // Order templates
  ORDER: 'ORDER|EXTRA_OPERATOR_BY|[#ORDERER;=COMMA]',
  ORDERER: '{NAME,NAME|#ORDER_MODE;}',
  ORDER_MODE: '{EXTRA_OPERATOR_ASC,EXTRA_OPERATOR_DESC}',

  // Limit template
  LIMIT: 'LIMIT|NUMBER',

  // Extra templates

  // Separators
  ALL_SEP: '{COMMA,AND,OR}',
  AND_OR_SEP: '{AND,OR}'
};
