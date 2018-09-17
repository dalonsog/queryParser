const QUERY = 'select C1 as num, C2 as text, C3\n' +
              'from my_table1\n' +
              'where (C1 < 4) and (C1 > 1)\n' +
              'order by C4 desc\n' +
              'limit 5';

const QUERY2 = 'select mode(C1), median(C1), first(C1), last(C1), min(C1), max(C1), sum(C1), avg(C1), count(C1), dc(C1), values(C1), C5\n' +
               'from my_table1\n' +
               'where C1 < 10\n' +
               'group by C5';

const QUERY3 = 'select C1, C1+100+1+1+1-1-1-1 as CPLUS, C1-100 as CMINUS,\n' +
               '       C1*100 as CTIMES, C1/100 as CDIVISION,\n' +
               '       C1%2 as CMODULE\n' +
               'from my_table1 limit 1';

const QUERY_BASE = 'select * from my_table1';

var queries = [QUERY_BASE, QUERY, QUERY2, QUERY3];

require('./src').then(obj => {
  queries.forEach(q => {
    console.log("\nParsing query: ");
    console.log(q);
    console.log("\nResults: ");
    var results = obj.parser(q)
    console.log(results.data);
    console.log('Length: ' + results.length.toString());
    console.log('Time: ' + results.time.toString() + 'ms');
  });
});
