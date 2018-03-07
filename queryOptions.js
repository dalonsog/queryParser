class QueryOptions {
  constructor(query) {
    this.rawQuery = query;
    this.SELECT = [];
    this.WHERE = [];
    this.ORDER = [];
    this.GROUP = [];
    this.AGGREGATION = [];
  }

  _isNodeArray(node) {
    var arrayNodes = ['SELECT', 'ORDER', 'GROUP', 'AGGREGATION'];
    return arrayNodes.indexOf(node) !== -1
  }

  addOption(option, value) {
    if (this._isNodeArray(option)) this[option].push(value);
    else this[option] = value;
  }
};

module.exports = QueryOptions;
