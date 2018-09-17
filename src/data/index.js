const fs = require('fs');
const Table = require('./Table');
const PATH = require('../config/constants').dir.PATH;

const int = val => parseInt(val);
const float = val => parseFloat(val);
const str = val => val.toString();

module.exports = callback => {
  var tables = {};
  fs.readdir(PATH, (err, files) => {
    if (err) {
      callback(new Error(`Unable to read data files: ${err}`), null);
      return;
    }

    files.forEach((file, fileIdx) => {
      let extension = file.slice(-3);
      if (extension === '.tb') {
        let name = file.replace(extension, '');
        tables[name] = new Table(name);
        fs.readFile(PATH + file, 'utf8', (err, data) => {
          if (err) {
            callback(new Error(`Unable to read data from table "${name}": ${err}`));
            return;
          }

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
          if (fileIdx === files.length - 1) callback(null, tables);
        });
      }
    });
  });
};
