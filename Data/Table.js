var Table = module.exports = function (name) {
  this.headers = [];
  this.data = [];
  this.name = name;
};

Table.prototype.setHeaders = function (headers) {
  headers.forEach(header => this.headers.push(header));
};

Table.prototype.addRow = function (row) {
  this.data.push(row);
};
