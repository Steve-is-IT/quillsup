/* Data Detective: how small clues combine. Pure functions (browser and Node tests). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../assets/js/util.js"));
  else root.DetectiveLogic = factory(root.HKUtil);
})(typeof self !== "undefined" ? self : this, function (U) {
  "use strict";
  var CATS = ["name", "age", "school", "home", "schedule", "password"];

  /* Set of clue categories known from the cards that are shown (and kept). */
  function known(cards) {
    var set = {};
    cards.forEach(function (c) { c.clues.forEach(function (k) { set[k] = true; }); });
    return set;
  }
  function count(set) { return CATS.filter(function (c) { return set[c]; }).length; }

  /* What a stranger could work out. "trail" = a place AND a time, "home" = a place, "who" = a name or school, else "crumb". */
  function level(set) {
    if (set.home && set.schedule) return "trail";
    if (set.home) return "home";
    if (set.name || set.school) return "who";
    return "crumb";
  }

  /* After revealing the first n cards of an order, what is known. */
  function afterReveal(order, n) { return known(order.slice(0, n)); }

  /* 1-based index of the first revealed card that gives away a category (0 if none). */
  function firstIndex(order, cat) {
    for (var i = 0; i < order.length; i++) if (order[i].clues.indexOf(cat) >= 0) return i + 1;
    return 0;
  }

  /* Cards left after the player's decisions: keep stays, change and remove take the clues away. */
  function afterChanges(cards, decisions) {
    return cards.filter(function (c) { return (decisions[c.n] || "keep") === "keep"; });
  }

  /* A shuffled order that starts with a card that gives away little. */
  function revealOrder(cards, rng) {
    var s = U.shuffle(cards, rng);
    var i = s.findIndex(function (c) { return c.clues.length === 1 && c.clues[0] !== "home" && c.clues[0] !== "password"; });
    if (i > 0) { var t = s[0]; s[0] = s[i]; s[i] = t; }
    return s;
  }

  return { CATS: CATS, known: known, count: count, level: level, afterReveal: afterReveal, firstIndex: firstIndex, afterChanges: afterChanges, revealOrder: revealOrder };
});
