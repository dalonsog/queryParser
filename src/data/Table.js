class Table {
  constructor(name) {
    this.headers = [];
    this.data = [];
    this.name = name;
  }

  setHeaders(headers) {
    headers.forEach(header => this.headers.push(header));
  }

  addRow(row) {
    this.data.push(row);
  }
}

module.exports = Table;