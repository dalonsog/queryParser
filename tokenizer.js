'use strict';

const STOPPERS = [' ', ',', '\r', '\n'];
const KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'BY',
                  'LIMIT', 'AS'];

const isStopper = c => STOPPERS.indexOf(c) !== -1;
const isKeyword = t => KEYWORDS.indexOf(t) !== -1;
const isNumber = t => !isNaN(parseFloat(t));
const isString = t => t.charAt(0) === '"';

function* tokenGenerator (str) {
  var c = '';

  for (let i=0; i<str.length; i++) {
    if (!isStopper(str.charAt(i))) {
      c += str.charAt(i);
      if (i===str.length -1) yield c;
    } else if (c !== '') {
      yield c;
      c = '';
    }
  }
}

function classifyToken (token) {
  var t = token.toUpperCase();
  if (isKeyword(t)) return { value: token, type: 'KEYWORD' };
  if (isNumber(t)) return { value: token, type: 'NUMBER' };
  if (isString(t)) return { value: token, type: 'STRING' };
  return { value: token, type: 'COLUMN' };
}

module.exports = function* (query) {
  var t = tokenGenerator(query);
  var n = t.next();

  while (!n.done) {
    yield classifyToken(n.value);
    n = t.next();
  }
};
