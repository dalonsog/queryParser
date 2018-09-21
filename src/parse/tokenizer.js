const RESERVED_WORDS = require('../config/reservedWords');
const SEPARATORS = RESERVED_WORDS.SEPARATORS
                     .concat(RESERVED_WORDS.MATH_OPERATORS)
                     .concat(RESERVED_WORDS.CONDITIONERS);
const STOPPERS = SEPARATORS.concat([' ', '\r', '\n']);

const isStopper = c => STOPPERS.indexOf(c) !== -1;
const isOperator = t => RESERVED_WORDS.OPERATORS.indexOf(t) !== -1;
const isExtraOperator = t => RESERVED_WORDS.EXTRA_OPERATORS.indexOf(t) !== -1;
const isMathOperator = t => RESERVED_WORDS.MATH_OPERATORS.indexOf(t) !== -1;
const isAggregator = t => RESERVED_WORDS.AGGREGATORS.indexOf(t) !== -1;
const isConditioner = t => RESERVED_WORDS.CONDITIONERS.indexOf(t) !== -1;
const isFormat = t => RESERVED_WORDS.FORMATS.indexOf(t) !== -1;
const isSeparator = t => SEPARATORS.indexOf(t) !== -1;
const isNumber = t => !isNaN(parseFloat(t));
const isString = t => t.charAt(0) === '"';
const isSelectAll = t => t === '*';

const SEPARATORS_MAPPER = {
  ",": "COMMA",
  "AND": "AND",
  "OR": "OR",
  "(": "OPEN_BRACKET",
  ")": "CLOSE_BRACKET"
};

function* tokenGenerator (str) {
  var c = '';

  for (let i=0; i<str.length; i++) {
    let char = str.charAt(i);
    if (!isStopper(char)) {
      c += char;
      if (i === str.length -1) {
        yield classifyToken(c);
      }
    } else {
      if (c !== '') {
        yield classifyToken(c);
        c = '';
      }
      if (isSeparator(char)) yield classifyToken(char);
    }
  }
}

function classifyToken (token) {
  var t = token.toUpperCase();
  if (isOperator(t) || isExtraOperator(t)) return { value: token, type: [t] };
  if (isSelectAll(t)) return { value: token, type: ['SELECT_ALL', 'MATH'] };
  if (isAggregator(t)) return { value: token.toUpperCase(), type: ['AGGREGATOR'] };
  if (isMathOperator(t)) return { value: token.toUpperCase(), type: ['MATH'] };
  if (isConditioner(t)) return { value: token, type: ['CONDITIONER'] };
  if (isFormat(t)) return { value: token, type: ['FORMAT'] };
  if (isSeparator(t)) return { value: token, type: [SEPARATORS_MAPPER[t]] };
  if (isNumber(t)) return { value: token, type: ['NUMBER'] };
  if (isString(t)) return { value: token, type: ['STRING'] };
  return { value: token, type: ['NAME'] };
}

module.exports = tokenGenerator;
