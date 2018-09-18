const ALLOWED_NODES = require('./allowed');

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
