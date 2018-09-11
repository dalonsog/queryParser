const fs = require('fs');
const Table = require('./Table');

const PATH = './Data/';

var tables = module.exports = {};

var int = val => parseInt(val);
var float = val => parseFloat(val);
var str = val => val.toString();

fs.readdir(PATH, (err, files) => {
  if (err) throw new Error(`Unable to read data files: ${err}`);

  files.forEach(file => {
    let extension = file.slice(-3);
    if (extension === '.tb') {
      let name = file.replace(extension, '');
      tables[name] = new Table(name);
      fs.readFile(PATH + file, 'utf8', (err, data) => {
        if (err)
          throw new Error(`Unable to read data from table "${name}": ${err}`);

        data.split('||').forEach((row, idx) => {
          if (!row.length) return;
          var d = {};
          if (idx === 0) tables[name].setHeaders(row.split(',').map(h => {
            var hf = h.split(':');
            return { name: hf[0], type: hf[1] };
          }));
          else {
            row.replace('\n', '').split(',').forEach((val, i) =>
              d[tables[name].headers[i].name] = val
                ? eval(tables[name].headers[i].type)(val)
                : null
            );
            tables[name].addRow(d);
          }
        });
      });
    }
  });
});
