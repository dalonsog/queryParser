class QueryNodes {
  constructor(query) {
    this.rawQuery = query;
    this.SELECT = [];
    this.ORDER = [];
    this.GROUP = [];
    this.AGGREGATION = [];
  }

  _isNodeArray(node) {
    var arrayNodes = ['SELECT', 'ORDER', 'GROUP', 'AGGREGATION'];
    return arrayNodes.indexOf(node) !== -1
  }

  addValue(node, value) {
    if (this._isNodeArray(node)) this[node].push(value);
    else this[node] = value;
  }
};

module.exports = QueryNodes;
