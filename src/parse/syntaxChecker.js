'use strict';

const ALLOWED_SELECT = {
  INIT: ['NAME', 'NUMBER', 'STRING', 'AGGREGATOR', 'SELECT_ALL'],
  SELECT_ALL: ['END'],
  NAME: ['INIT', 'MATH', 'AS', 'AGGREGATOR', 'COMMA', 'END', 'CLOSE_BRACKET'],
  NUMBER: ['INIT', 'MATH', 'AS', 'COMMA'],
  STRING: ['INIT', 'MATH', 'AS', 'COMMA'],
  OPEN_BRACKET: ['NAME'],
  CLOSE_BRACKET: ['AS', 'COMMA', 'END'],
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

const ALLOWED_CONVERT = {
  INIT: ['FORMAT'],
  FORMAT: ['END']
};

const ALLOWED_NODES = {
  SELECT: ALLOWED_SELECT,
  FROM: ALLOWED_FROM,
  WHERE: ALLOWED_WHERE,
  GROUP: ALLOWED_GROUP,
  ORDER: ALLOWED_ORDER,
  LIMIT: ALLOWED_LIMIT,
  CONVERT: ALLOWED_CONVERT
};

function buildError (base, idx, current, allowed) {
  return 'Error at ' + idx + ' in '+ base + '. Expecting one of "'
    + allowed.join(', ') + '", got "' + current[0] + '".';
}

function isNodeAllowed (node, allowed) {
  /**
   * Add several types to the node so it can be allowed in
   * multiple contexts (e.g., * as math operator and SELECT ALL alias)
   */
  return allowed.indexOf(node) !== -1;
}

module.exports = function (nodes) {
  var base = nodes.splice(0, 1)[0].type,
      prev = 'INIT',
      allowed = ALLOWED_NODES[base];

  for (let i = 0; i <= nodes.length; i++) {
    let current = nodes[i] || { type: ['END'] };
    let t = 0, error = true;
    while (t < current.type.length && error) {
      let type = current.type[t];
      if (isNodeAllowed(type, allowed[prev])) {
        prev = type;
        error = false;
      }
      t++;
    }
    if (error)
      return {
        check: false,
        error: buildError(base, i, current.type, allowed[prev])
      };
  }

  return { check: true, error: null };
};
