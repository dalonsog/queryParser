const tokenize = require('./tokenizer');
const checker = require('./syntaxChecker');
const OPERATORS = require('./reservedWords').OPERATORS;
const statements = [
  'select a, b as Alias, "s" as String, 5 as number, max c as Max_C',
  'from table',
  'where a > b, b <> 5',
  'order by a',
  'limit 10'
];

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
    if (x.length) console.log(checker(x.map(e => e.type).join('|')));
  });
});
