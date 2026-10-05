/* Passphrase Lab: the honest math, as pure functions (browser and Node tests).
   Models (teaching assumptions, not measurements), from kit/13_Concepts_Lab/Demo_01_Long_Passphrases.md:
     classroom model  : 1,000 guesses per second (3-5 Teacher Guide, Lesson 2)
     attacker model   : 10,000,000,000 guesses per second against a stolen file with a fast hash
   "Longest" means trying every possibility. "Average" means finding it after about half of them. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../assets/js/util.js"));
  else root.PassLogic = factory(root.HKUtil);
})(typeof self !== "undefined" ? self : this, function (U) {
  "use strict";

  var RATES = { classroom: 1000, attacker: 1e10 };
  var YEAR = 365.25 * 86400;                 // seconds in a year
  var UNIVERSE_YEARS = 13.8e9;               // about 13.8 billion years
  var WORD_LISTS = { classroom: 36, real: 7776 };
  var ALPHABETS = { digits: 10, lower: 26, mixed: 52, alnum: 62, keyboard: 94 };

  var SCALES = [   // name key, size
    ["million", 1e6], ["billion", 1e9], ["trillion", 1e12], ["quadrillion", 1e15],
    ["quintillion", 1e18], ["sextillion", 1e21], ["septillion", 1e24]
  ];

  function combos(options, length) {
    if (!(options >= 1) || !(length >= 0)) throw new Error("bad arguments");
    return BigInt(options) ** BigInt(length);
  }

  function bits(options, length) { return length * Math.log2(options); }

  function toNumber(big) { return Number(big); }

  /* seconds to try. kind "avg" = half of the possibilities, "all" = every one. */
  function seconds(big, rate, kind) {
    var n = toNumber(big);
    return (kind === "avg" ? n / 2 : n) / rate;
  }

  /* Rounding for display: >= 100 gives two significant digits, 10 to 99 a whole number, under 10 one decimal. */
  function roundDisplay(v) {
    if (v >= 100) {
      var mag = Math.pow(10, Math.floor(Math.log10(v)) - 1);
      return Math.round(v / mag) * mag;
    }
    if (v >= 10) return Math.round(v);
    return Math.round(v * 10) / 10;
  }

  /* Format a count with a scale word: returns {text digits, scale}. scale is null below one million. */
  function scaleNumber(v) {
    var scale = null, x = v;
    for (var i = SCALES.length - 1; i >= 0; i--) {
      if (v >= SCALES[i][1]) { scale = SCALES[i][0]; x = v / SCALES[i][1]; break; }
    }
    if (!scale) return { value: roundDisplay(v), scale: null, sci: null };
    if (scale === "septillion" && x >= 1000) return { value: null, scale: null, sci: sci(v) };
    return { value: roundDisplay(x), scale: scale, sci: null };
  }

  function sci(v) {
    var e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e);
    return { mantissa: Math.round(m * 10) / 10, exp: e };
  }

  /* Humanise a time in seconds. Returns {unit, value, scale, sci}. */
  function duration(s) {
    if (s < 0.001) return { unit: "instant", value: 0, scale: null, sci: null };
    if (s < 1) return { unit: "milliseconds", value: Math.max(1, Math.round(s * 1000)), scale: null, sci: null };
    if (s < 60) return { unit: "seconds", value: roundDisplay(s), scale: null, sci: null };
    if (s < 3600) return { unit: "minutes", value: roundDisplay(s / 60), scale: null, sci: null };
    if (s < 86400) return { unit: "hours", value: roundDisplay(s / 3600), scale: null, sci: null };
    if (s < YEAR) return { unit: "days", value: roundDisplay(s / 86400), scale: null, sci: null };
    var y = s / YEAR, sn = scaleNumber(y);
    return { unit: "years", value: sn.value, scale: sn.scale, sci: sn.sci };
  }

  function universeRatio(s) { return (s / YEAR) / UNIVERSE_YEARS; }

  /* "about 3.7 quadrillion" style for big counts: returns {exact, short}. */
  function describeCount(big) {
    var v = toNumber(big), sn = scaleNumber(v);
    return { exact: U.commas(big), short: v >= 1e6 ? sn : null };
  }

  /* How many times bigger is a than b (as a Number, may be huge or tiny). */
  function ratio(a, b) {
    var l = Math.log10(toNumber(a)) - Math.log10(toNumber(b));
    return l;     // log10 of the ratio; callers turn it into words
  }

  /* One secret from a description. kind: "words" | "chars". */
  function secretSpace(spec) {
    if (spec.kind === "words") return { options: WORD_LISTS[spec.list], length: spec.count };
    return { options: ALPHABETS[spec.alphabet], length: spec.count };
  }

  /* Dice needed: classroom list = 2 dice per word (6x6 = 36); real list = 5 dice per word (6^5 = 7776). */
  function diceFor(list, count) { return (list === "real" ? 5 : 2) * count; }

  /* Roll n dice (1..6). */
  function rollDice(n, rng) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(1 + U.randInt(6, rng));
    return out;
  }

  /* Map two dice (row, column) to an index 0..35 and to a word from a 6x6 list. */
  function wordFromDice(list36, d1, d2) { return list36[(d1 - 1) * 6 + (d2 - 1)]; }

  /* The Demo 01 honest table rows (so UI and tests share one definition). */
  var HONEST_ROWS = [
    { id: "pin4",   kind: "chars", alphabet: "digits",   count: 4 },
    { id: "low8",   kind: "chars", alphabet: "lower",    count: 8 },
    { id: "w3",     kind: "words", list: "real",        count: 3 },
    { id: "w4",     kind: "words", list: "real",        count: 4 },
    { id: "key8",   kind: "chars", alphabet: "keyboard", count: 8 },
    { id: "w5",     kind: "words", list: "real",        count: 5 },
    { id: "w6",     kind: "words", list: "real",        count: 6 },
    { id: "key12",  kind: "chars", alphabet: "keyboard", count: 12 }
  ];
  var CLASS_ROWS = [3, 4, 5, 6, 7].map(function (n) { return { id: "c" + n, kind: "words", list: "classroom", count: n }; });

  return { RATES: RATES, YEAR: YEAR, UNIVERSE_YEARS: UNIVERSE_YEARS, WORD_LISTS: WORD_LISTS, ALPHABETS: ALPHABETS,
           combos: combos, bits: bits, seconds: seconds, duration: duration, roundDisplay: roundDisplay, scaleNumber: scaleNumber,
           describeCount: describeCount, ratio: ratio, secretSpace: secretSpace, diceFor: diceFor, rollDice: rollDice,
           wordFromDice: wordFromDice, universeRatio: universeRatio, HONEST_ROWS: HONEST_ROWS, CLASS_ROWS: CLASS_ROWS };
});
