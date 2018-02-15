'use strict';

const RESERVED_WORDS = require('./reservedWords');
//const STOPPERS = RESERVED_WORDS.SEPARATORS.concat(['(', ,')', '\r', '\n']);
const STOPPERS = RESERVED_WORDS.SEPARATORS.concat([' ', '\r', '\n']);

const isStopper = c => STOPPERS.indexOf(c) !== -1;
const isOperator = t => RESERVED_WORDS.OPERATORS.indexOf(t) !== -1;
const isExtraOperator = t => RESERVED_WORDS.EXTRA_OPERATORS.indexOf(t) !== -1;
const isAggregator = t => RESERVED_WORDS.AGGREGATORS.indexOf(t) !== -1;
const isConditioner = t => RESERVED_WORDS.CONDITIONERS.indexOf(t) !== -1;
const isSeparator = t => RESERVED_WORDS.SEPARATORS.indexOf(t) !== -1;
const isNumber = t => !isNaN(parseFloat(t));
const isString = t => t.charAt(0) === '"';

const SEPARATORS_MAPPER = {
  ",": "COMMA",
  "AND": "AND",
  "OR": "OR"
};

function* tokenGenerator (str) {
  var c = '';

  for (let i=0; i<str.length; i++) {
    let char = str.charAt(i);
    if (!isStopper(char)) {
      c += char;
      if (i===str.length -1) yield classifyToken(c);
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
  if (isOperator(t)) return { value: token, type: t };
  if (isExtraOperator(t)) return { value: token, type: 'EXTRA_OPERATOR__' + t };
  if (isAggregator(t)) return { value: token, type: 'AGGREGATOR'};
  if (isConditioner(t)) return { value: token, type: 'CONDITIONER__' + t };
  if (isSeparator(t)) return { value: token, type: SEPARATORS_MAPPER[t]};
  if (isNumber(t)) return { value: token, type: 'NUMBER' };
  if (isString(t)) return { value: token, type: 'STRING' };
  return { value: token, type: 'NAME' };
}

module.exports = tokenGenerator;
