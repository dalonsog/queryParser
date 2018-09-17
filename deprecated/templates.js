const ELEMENT = ['NAME', 'NUMBER', 'STRING'],
      AGGR = ['AGGREGATOR|NAME'],
      COLUMN_BASE = ELEMENT.concat(AGGR),
      CONDITIONERS = ['CONDITIONER__<|CONDITIONER__>',
                      'CONDITIONER__>|CONDITIONER__=',
                      'CONDITIONER__<|CONDITIONER__=',
                      'CONDITIONER__>',
                      'CONDITIONER__<',
                      'CONDITIONER__='];

var aliaser = e => e + '|AS|NAME';

function mather () {
  var result = [];
  COLUMN_BASE.forEach(function (x) {
    COLUMN_BASE.forEach(function (y) {
      result.push(aliaser(x + '|MATH|' + y));
    });
  });
  return result;
}

function conditioner () {
  var result = [];
  ELEMENT.forEach(function (x) {
    ELEMENT.forEach(function (y) {
      result = result.concat(CONDITIONERS.map(e => x + '|' + e + '|' + y));
    });
  });
  return result;
}

module.exports = {
  column: COLUMN_BASE.concat(COLUMN_BASE.map(aliaser)).concat(mather()),
  table: ['NAME'],
  condition: conditioner(),
  grouper: ['NAME'],
  orderer: ['NAME', 'NAME|ASC', 'NAME|DESC']
}
