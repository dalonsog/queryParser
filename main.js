var parseQuery = require('./parser');

const QUERY = 'select C1 as num, C2 as text, C3\n' +
              'from my_table1\n' +
              'where (C1 < 4) and (C1 > 1)\n' +
              'order by C4 desc\n' +
              'limit 5';

const QUERY2 = 'select min(C1), max(C1), sum(C1), avg(C1), count(C1), C5\n' +
               'from my_table1\n' +
               'where C1 < 10\n' +
               'group by C5';

const QUERY3 = 'select C1, C2 from my_table1 where C1 <= 4';

var queries = [QUERY, QUERY2, QUERY3];

queries.forEach(q => {
  console.log("\nParsing query: ");
  console.log(q);
  console.log("\nResults: ");
  console.log(parseQuery(q));
});
