const tokenize = require('./tokenizer');
const checker = require('./syntaxChecker');
const OPERATORS = require('./reservedWords').OPERATORS;
const statements = [
  'select max(c1)'
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
