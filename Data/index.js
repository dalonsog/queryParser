var Table = require('./Table');
var myTable1Raw = require('./my_table1').split('\n');
var GGBServicesCNSORaw = require('./GGBServicesCNSO').split('\n');

var tables = module.exports = {
  'my_table1': new Table('my_table1'),
  'GGBServicesCNSO': new Table('GGBServicesCNSO')
};

var int = val => parseInt(val);
var float = val => parseFloat(val);
var str = val => val.toString();

myTable1Raw.forEach((row, idx) => {
  var d = {};
  if (idx === 0) tables.my_table1.setHeaders(row.split(',').map(h => {
    var hf = h.split(':');
    return { name: hf[0], type: hf[1] };
  }));
  else {
    row.split(',').forEach((val, i) =>
      d[tables.my_table1.headers[i].name] =
        eval(tables.my_table1.headers[i].type)(val)
    );
    tables.my_table1.addRow(d);
  }
});

GGBServicesCNSORaw.forEach((row, idx) => {
  var d = {};
  if (idx === 0) tables.GGBServicesCNSO.setHeaders(row.split(',').map(h => {
    var hf = h.split(':');
    return { name: hf[0], type: hf[1] };
  }));
  else {
    row.split(',').forEach((val, i) =>
      d[tables.GGBServicesCNSO.headers[i].name] =
        eval(tables.GGBServicesCNSO.headers[i].type)(val)
    );
    tables.GGBServicesCNSO.addRow(d);
  }
});
