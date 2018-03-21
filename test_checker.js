const tokenize = require('./tokenizer');
const checker = require('./syntaxChecker');
const OPERATORS = require('./reservedWords').OPERATORS;

const QUERY = 'select C1 as num, C2 as text, C3\n' +
              'from my_table1\n' +
              'where (C1 < 4) and (C1 > 1)\n' +
              'order by C4 desc\n' +
              'limit 5';

const QUERY2 = 'select min(C1), max(C1), sum(C1), avg(C1), count(C1), C5\n' +
               'from my_table1\n' +
               'where C1 < 10\n' +
               'group by C5';

const QUERY3 = 'select C1 + 15 as C15 from my_table1';

const statements = [QUERY, QUERY2, QUERY3];

statements.forEach(st => {
  var tg = tokenize(st);
  var t = [];
  var ts = [];
  var n = tg.next();
  while(!n.done) {
    if (OPERATORS.indexOf(n.value.type) !== -1) {
      ts.push(t.slice());
      t.splice(0, t.length);
    }
    t.push(n.value);
    n = tg.next();
  }
  ts.push(t.slice());
  ts.forEach(x => {
    if (x.length) {
      var statement = x.map(e => e.type);
      console.log('Testing: ' + statement.join('|'));
      console.log(checker(statement));
    }
  });
});
