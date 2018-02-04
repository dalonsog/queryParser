const tokenize = require('./tokenizer');
const checker = require('./syntaxChecker');
const statements = [
  'select a, b from table where a>1, b<4 order by a limit 5'
];

statements.forEach(st => { 
  var tg = tokenize(st);
  var t = [];
  var ts = [];
  var n = tg.next();
  while(!n.done) {
    if (n.value.type.indexOf('OPERATOR__') === 0) {
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
