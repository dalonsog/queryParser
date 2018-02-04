/*
* [] => one or more
* {} => one of
* <e> => template of e
*/

const TEMPLATES = {
  SELECT: 'OPERATOR__SELECT|SEPARATOR__ |[#COLUMN;]',
  COLUMN: '{NAME, #AGGR;, #ALIAS;}',
  AGGR: 'AGGREGATOR|NAME',
  ALIAS: '{NAME, NUMBER, STRING, #AGGR;}|EXTRA_OPERATOR__AS|NAME',

  FROM: 'OPERATOR__FROM|SEPARATOR__ |NAME',

  WHERE: 'OPERATOR__WHERE|SEPARATOR__ |[#CONDITION;]',
  CONDITION: 'NAME|#CONDITIONER;|{NAME, NUMBER, STRING}',
  CONDITIONER: '{CONDITIONER__>, CONDITIONER__<, CONDITIONER__=,' + 
               ' CONDITIONER__<>, CONDITIONER__>=, CONDITIONER__<=}',

  GROUP: 'OPERATOR__GROUP|EXTRA_OPERATOR_BY|SEPARATOR__ |[NAME]',

  ORDER: 'OPERATOR__ORDER|EXTRA_OPERATOR_BY|SEPARATOR__ |[#ORDERER;]',
  ORDERER: '{NAME,NAME|#ORDER_MODE;}',
  ORDER_MODE: '{EXTRA_OPERATOR_ASC, EXTRA_OPERATOR_DESC}',

  LIMIT: 'OPERATOR__LIMIT|SEPARATOR__ |NUMBER'
};

function buildTemplate (template) {
  return template.split('|').map(w => {
    return w.split(',').map(e => {
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
  }).join('|');
}

module.exports = function checker(statement) {
  console.log('Checking: ' + statement);
  var ts = statement.split('|');

  console.log(buildTemplate(TEMPLATES[ts[0].replace('OPERATOR__', '')]));
  return true;
};
