var parseQuery = require('./parser');
var getTables = require('./dataController').getTables;
var stdin = process.openStdin();

const CLIENT_COMMANDS = ['EXIT', 'TABLES', 'FIRST', 'LAST', 'TOP10', 'TOP100',
                         'TOP1000', 'TAIL10', 'TAIL100', 'TAIL1000'];

function exitClient() {
  console.log("\tHave a nice day :D");
  process.exit(0);
}

function handleCommand (rawText) {
  var splitted = rawText.split(' ');
  var command = splitted[0].toUpperCase(),
      table = splitted[1];
  if (CLIENT_COMMANDS.indexOf(command) === -1) return rawText;
  switch (command) {
    case 'EXIT':
      exitClient();
      break;
    case 'TABLES':
      var tables = getTables();
      console.log('\n\tTables:');
      tables.forEach(function (table) {
        console.log('\t\t - ' + table);
      });
      break;
    case 'FIRST': case 'LAST': case 'TOP10': case 'TOP100':
    case 'TOP1000': case 'TAIL10': case 'TAIL100': case 'TAIL1000':
      var template = 'select * from {table} limit {l}';
      var l = command === 'FIRST' || command === 'LAST' ? 1 : 10;
      return template.replace('{table}', table).replace('{l}', l);
  }
}

console.log('\tSQL client initiated.\n');

stdin.addListener("data", function(d) {
  var q = d.toString().trim();
  q = handleCommand(q);
  if (q) {
    console.log("\n\tParsing query: ");
    console.log("\t\t" + q);
    try {
      var results = parseQuery(q)
      console.log("\n\tResults: ");
      console.log("\t\t" + JSON.stringify(results.data));
      console.log('\n\tLength: ' + results.length.toString());
      console.log('\n\tTime: ' + results.time.toString() + 'ms\n');
    } catch(err) {
      console.error("\tQuery has errors: \n");
      console.error(err);
    }
  }
});
