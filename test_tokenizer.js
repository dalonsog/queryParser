const tokenize = require('./tokenizer');

const QUERY = 'select C1 as num, C2 as text, C3\n' +
              'from my_table1\n' +
              'where ( C1 < 4 and C1 > 1) or C2>3\n' +
              'order by C4 desc\n' +
              'limit 5';

const QUERY2 = 'select min(C1), max(C1), sum(C1), avg(C1), count(C1), C5\n' +
               'from my_table1\n' +
               'group by C5';

const QUERY3 = 'select max a';

[QUERY, QUERY2, QUERY3].forEach(query => {
  var tokens = tokenize(query);
  var statements = [];
  var temp = [];

  var next = tokens.next();
  while (!next.done) {
    if (next.value.type.indexOf('OPERATOR') === 0) {
      if (temp.length) statements.push(temp);
      temp = [];
    }
    //console.log(next.value);
    temp.push(next.value.type);
    next = tokens.next();
  }
  statements.push(temp);
  //console.log(statements);
  statements.forEach(st => { console.log(st.join('|')); });
  console.log('---');
});
