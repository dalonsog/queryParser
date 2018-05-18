module.exports = {
  OPERATORS: ['SELECT', 'FROM', 'WHERE', 'LIMIT', 'GROUP', 'ORDER'],
  EXTRA_OPERATORS: ['AS', 'BY', 'NOT', 'ASC', 'DESC'],
  AGGREGATORS: ['MIN', 'MAX', 'COUNT', 'SUM', 'AVG', 'VALUES', 'DC', 'FIRST', 'LAST', 'MEDIAN', 'MODE'],
  MATH_OPERATORS: ['+', '-', '*', '/', '%'],
  CONDITIONERS: ['>', '<', '=', '<>', '>=', '<='],
  SEPARATORS: [',', 'AND', 'OR', '(', ')']
};
