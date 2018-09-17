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

module.exports = {
  // Select templates
  SELECT: 'SELECT|[#COLUMN;::COMMA]',
  COLUMN: '{#ALIAS;,#AGGR;,NAME}',
  MATH_COLUMN: '{NUMBER,STRING,NAME}|MATH|{NUMBER,STRING,NAME}',
  ALIAS: '{#MATH_COLUMN;,#AGGR;,NUMBER,STRING,NAME}|AS|NAME',
  AGGR: 'AGGREGATOR|NAME',

  // From template
  FROM: 'FROM|NAME',

  // Where templates
  WHERE: 'WHERE|[#CONDITION;::#AND_OR_SEP;]',
  CONDITION: '{NAME,NUMBER,STRING}|#CONDITIONER;|{NAME,NUMBER,STRING}',
  CONDITIONER: '{CONDITIONER__<|CONDITIONER__>,CONDITIONER__>|CONDITIONER__=,' +
               'CONDITIONER__<|CONDITIONER__=,CONDITIONER__>,CONDITIONER__<,' +
               'CONDITIONER__=}',

  // Group template
  GROUP: 'GROUP|BY|[NAME::COMMA]',

  // Order templates
  ORDER: 'ORDER|BY|[#ORDERER;::COMMA]',
  ORDERER: '{NAME|#ORDER_MODE;,NAME}',
  ORDER_MODE: '{ASC,DESC}',

  // Limit template
  LIMIT: 'LIMIT|NUMBER',

  // Extra templates

  // Separators
  AND_OR_SEP: '{AND,OR}'
};
