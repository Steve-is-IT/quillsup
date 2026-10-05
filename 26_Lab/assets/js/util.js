/* Small shared helpers (pure; run in the browser and in Node tests). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.HKUtil = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* Seedable generator for tests (mulberry32). Returns a function giving [0,1). */
  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Random in [0,1) using the browser's crypto when it exists. */
  function secureRandom() {
    try {
      var c = (typeof crypto !== "undefined" && crypto.getRandomValues) ? crypto : null;
      if (c) {
        var b = new Uint32Array(1);
        c.getRandomValues(b);
        return b[0] / 4294967296;
      }
    } catch (e) { /* fall through */ }
    return Math.random();
  }

  function shuffle(arr, rng) {
    rng = rng || secureRandom;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function randInt(n, rng) { return Math.floor((rng || secureRandom)() * n); }

  /* Group separators for integers given as Number or BigInt or digit string. */
  function commas(x) {
    var s = (typeof x === "bigint") ? x.toString() : String(x);
    var neg = s[0] === "-";
    if (neg) s = s.slice(1);
    s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-" : "") + s;
  }

  return { seeded: seeded, secureRandom: secureRandom, shuffle: shuffle, randInt: randInt, commas: commas };
});
