'use strict';
// Pure route geometry for the blade pass: how deep a route sits, and which way
// the cut should travel. No DOM.
const Route = (() => {
  const DEPTHS = [
    [/^\/$/, 0],
    [/^\/new$/, 1],
    [/^\/knife\/[A-Za-z0-9-]+$/, 1],
    [/^\/knife\/[A-Za-z0-9-]+\/edit$/, 2],
    [/^\/knife\/[A-Za-z0-9-]+\/log$/, 2],
    [/^\/knife\/[A-Za-z0-9-]+\/log\/[A-Za-z0-9-]+$/, 2],
    [/^\/knife\/[A-Za-z0-9-]+\/photo$/, 2]
  ];
  function depth(path) {
    for (const [re, d] of DEPTHS) if (re.test(String(path || ''))) return d;
    return 0;
  }
  function direction(fromPath, toPath) {
    return depth(toPath) >= depth(fromPath) ? 'in' : 'out';
  }
  return { depth, direction };
})();
if (typeof module !== 'undefined') module.exports = Route;
