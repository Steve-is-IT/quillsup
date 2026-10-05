/* Hackles or Not?: comparing a player's moves with what the kit recommends. Pure functions. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../assets/js/util.js"));
  else root.OrNotLogic = factory(root.HKUtil);
})(typeof self !== "undefined" ? self : this, function (U) {
  "use strict";
  var MOVES = ["pause", "check", "tell"];

  /* What the kit suggests for the first answer. Never "wrong": every answer gets a kind reply. */
  function hacklesReply(card, answer) {
    if (answer === card.hackles) return "match";
    if (answer === "up" && card.hackles === "down") return "false_alarm";     // false alarms are fine
    if (answer === "unsure") return "unsure_ok";                                 // not sure is a smart answer
    if (answer === "down" && card.hackles === "up") return "missed";           // gentle: here is the clue
    if (answer === "down" && card.hackles === "unsure") return "cant_tell";
    if (answer === "up" && card.hackles === "unsure") return "up_for_unsure";  // good caution
    return "match";
  }

  /* Compare chosen moves with recommended moves. */
  function compareMoves(chosen, rec) {
    var matched = rec.filter(function (m) { return chosen.indexOf(m) >= 0; });
    var missing = rec.filter(function (m) { return chosen.indexOf(m) < 0; });
    var extra = chosen.filter(function (m) { return rec.indexOf(m) < 0; });
    var status = missing.length === 0 ? (extra.length === 0 ? "exact" : "extra") : (matched.length ? "partial" : "none");
    return { matched: matched, missing: missing, extra: extra, status: status };
  }

  /* Ladder practice: three next-step options, exactly one of them climbs. */
  function ladderOptions(ladderCard, lang, rng) {
    var climb = { id: "climb", text: ladderCard[lang].next };
    var stop = { id: "stop", text: lang === "es" ? "Parar aquí y esperar que se pase solo." : "Stop here and hope it goes away." };
    var hide = { id: "hide", text: lang === "es" ? "Guardármelo y no decírselo a nadie más." : "Keep it to myself and tell nobody else." };
    return U.shuffle([climb, stop, hide], rng);
  }
  function ladderCheck(id) { return id === "climb"; }

  function order(cards, rng) { return U.shuffle(cards, rng); }

  return { MOVES: MOVES, hacklesReply: hacklesReply, compareMoves: compareMoves, ladderOptions: ladderOptions, ladderCheck: ladderCheck, order: order };
});
