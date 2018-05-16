var parseQuery = require('./parser');
var stdin = process.openStdin();

console.log('\tSQL client initiated.\n');

stdin.addListener("data", function(d) {
  var q = d.toString().trim();
  if (q.toLowerCase() === 'exit') {
    console.log("\tHave a nice day :D");
    process.exit(0);
  }
  console.log("\n\tParsing query: ");
  console.log("\t\t" + q);
  try {
    var results = parseQuery(q)
    console.log("\n\tResults: ");
    console.log("\t\t" + JSON.stringify(results.data));
    console.log('\n\tTime: ' + results.time.toString() + 'ms\n');
  } catch(err) {
    console.error("\tQuery has errors\n");
  }
});
