var QueryOptions = module.exports = function (query) {
  this.rawQuery = query;
  this.SELECT = [];
  this.WHERE = [];
  this.ORDER = [];
  this.GROUP = [];
  this.AGGREGATION = [];
};

QueryOptions.prototype.addOption = function (option, value) {
  if (option === 'SELECT') this.SELECT.push(value);
  else if (option === 'WHERE') this.WHERE.push(value);
  else if (option === 'ORDER') this.ORDER.push(value);
  else if (option === 'GROUP') this.GROUP.push(value);
  else if (option === 'AGGREGATION') this.AGGREGATION.push(value);
  else this[option] = value;
};
