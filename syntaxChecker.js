'use strict';

const ALLOWED_SELECT = {
  INIT: ['NAME', 'NUMBER', 'STRING', 'AGGREGATOR'],
  NAME: ['INIT', 'MATH', 'AS', 'AGGREGATOR', 'COMMA', 'END', 'CLOSE_BRACKET'],
  NUMBER: ['INIT', 'MATH', 'AS', 'COMMA'],
  STRING: ['INIT', 'MATH', 'AS', 'COMMA'],
  OPEN_BRACKET: ['NAME'],
  CLOSE_BRACKET: ['AS', 'COMMA'],
  AS: ['NAME', 'NUMBER', 'STRING', 'AGGREGATOR'],
  AGGREGATOR: ['INIT', 'COMMA', 'END', 'OPEN_BRACKET'],
  MATH: ['NAME', 'NUMBER', 'STRING'],
  COMMA: ['NAME', 'AGGREGATOR', 'NUMBER', 'STRING']
};

const ALLOWED_FROM = {
  INIT: ['NAME'],
  NAME: ['END']
};

const ALLOWED_WHERE = {
  INIT: ['OPEN_BRACKET', 'NAME', 'NUMBER'],
  NAME: ['OPEN_BRACKET', 'CLOSE_BRACKET', 'CONDITIONER', 'AND', 'OR', 'END'],
  NUMBER: ['OPEN_BRACKET', 'CLOSE_BRACKET', 'CONDITIONER', 'AND', 'OR', 'END'],
  OPEN_BRACKET: ['NAME', 'NUMBER'],
  CLOSE_BRACKET: ['AND', 'OR', 'END'],
  CONDITIONER: ['NAME', 'NUMBER'],
  AND: ['OPEN_BRACKET', 'NUMBER', 'NAME'],
  OR: ['OPEN_BRACKET', 'NUMBER', 'NAME']
};

const ALLOWED_GROUP = {
  INIT: ['BY'],
  BY: ['NAME'],
  NAME: ['COMMA', 'END'],
  COMMA: ['NAME']
};

const ALLOWED_ORDER = {
  INIT: ['BY'],
  BY: ['NAME', 'ASC', 'DESC'],
  NAME: ['ASC', 'DESC', 'COMMA', 'END'],
  COMMA: ['NAME'],
  ASC: ['COMMA', 'END'],
  DESC: ['COMMA', 'END']
};

const ALLOWED_LIMIT = {
  INIT: ['NUMBER'],
  NUMBER: ['END']
};

const ALLOWED_NODES = {
  SELECT: ALLOWED_SELECT,
  FROM: ALLOWED_FROM,
  WHERE: ALLOWED_WHERE,
  GROUP: ALLOWED_GROUP,
  ORDER: ALLOWED_ORDER,
  LIMIT: ALLOWED_LIMIT
};

function buildError (base, idx, current, allowed) {
  return 'Error at ' + idx + ' in '+ base
    + '. Expecting one of "' + allowed.join(', ') + '", got "' + current + '".';
}

module.exports = function (nodes) {
  var base = nodes.splice(0, 1),
      prev = 'INIT',
      allowed = ALLOWED_NODES[base];
  
  for (let i = 0; i <= nodes.length; i++) {
    let current = nodes[i] || 'END';
    
    if (allowed[prev].indexOf(current) === -1)
      return {
        check: false,
        error: buildError(base, i, current, allowed[prev])
      };
    else
      prev = current;
  }
  return { check: true, error: null };
};
