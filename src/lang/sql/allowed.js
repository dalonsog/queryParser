const ALLOWED_SELECT = {
  INIT: ['NAME', 'NUMBER', 'STRING', 'AGGREGATOR', 'SELECT_ALL'],
  SELECT_ALL: ['END'],
  NAME: ['MATH', 'AS', 'AGGREGATOR', 'COMMA', 'END', 'CLOSE_BRACKET'],
  NUMBER: ['MATH', 'AS', 'COMMA'],
  STRING: ['MATH', 'AS', 'COMMA'],
  OPEN_BRACKET: ['NAME'],
  CLOSE_BRACKET: ['AS', 'COMMA', 'END'],
  AS: ['NAME', 'NUMBER', 'STRING', 'AGGREGATOR'],
  AGGREGATOR: ['COMMA', 'END', 'OPEN_BRACKET'],
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

module.exports = {
  SELECT: ALLOWED_SELECT,
  FROM: ALLOWED_FROM,
  WHERE: ALLOWED_WHERE,
  GROUP: ALLOWED_GROUP,
  ORDER: ALLOWED_ORDER,
  LIMIT: ALLOWED_LIMIT,
  CONVERT: ALLOWED_CONVERT
};
