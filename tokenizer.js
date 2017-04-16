var tokenize = string => string.split(/,| |\n|\r/).reduce((acc, value) =>
    value !== '' ? acc.concat(value) : acc, []);


exports.tokenize = function (string) {
  var tokens = tokenize(string);
  var pointer = 0;
  var hasNext = () => pointer < tokens.length;
  var next = () => hasNext() ? tokens[pointer++] : null;

  return { next: next, hasNext: hasNext };
};
