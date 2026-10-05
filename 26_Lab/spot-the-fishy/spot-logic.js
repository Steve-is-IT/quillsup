/* Spot the Fishy: rules as pure functions (browser and Node tests).
   Rules come from kit/14_Games_and_Fun/01_Spot_the_Fishy_Card_Game.md sections 3 to 6. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../assets/js/util.js"));
  else root.SpotLogic = factory(root.HKUtil);
})(typeof self !== "undefined" ? self : this, function (U) {
  "use strict";

  var SORTS = ["F", "R", "P"];            // Fishy, Real, Pause and Ask
  var MAX_CLUES = 2;                      // bonus clue circles per card

  var MODES = {
    quick: { cards: 8,  pondCircles: 12, rounds: 1, minutes: 10 },
    full:  { cards: 24, pondCircles: 54, rounds: 3, minutes: 30 }   // Pond 30 + Lagoon 24
  };

  /* Circles the class earns for one card.
     answers: array with one entry per team: "F" | "R" | "P" | "X" (X = pass). cluesNamed: number of new, correct clues. */
  function cardCircles(card, answers, cluesNamed) {
    var teams = answers.length || 1;
    var best = 0, i;
    for (i = 0; i < answers.length; i++) if (answers[i] === card.sort) best++;
    var halfBest = best * 2 >= teams && best > 0;
    var clues = Math.max(0, Math.min(MAX_CLUES, cluesNamed || 0));
    var parts = { always: 1, half: halfBest ? 1 : 0, clues: clues };
    return { circles: parts.always + parts.half + parts.clues, parts: parts, bestCount: best, teams: teams };
  }

  /* Which kind of kind message to show for one answer. */
  function outcome(card, answer) {
    if (answer === "X") return "pass";
    if (answer === card.sort) return "match_" + card.sort;
    if (answer === "P") return "pause_safe";                       // paused on a card that could be sorted
    if (card.sort === "P") return "cant_tell";                      // sorted a "cannot tell" card
    if (answer === "F" && card.sort === "R") return "false_alarm";  // hackles up on a real one
    return "looked_real";                                            // showed REAL on a fishy one
  }

  /* Which clue letters are right for this card (SPOT for K-5, FLAGS for 6-12). */
  function clueIsRight(card, letter) { return card.flags.indexOf(letter) >= 0; }

  function deckFor(data, deckKey, starsOnly) {
    var cards = data[deckKey];
    if (deckKey === "k5" && starsOnly) cards = cards.filter(function (c) { return c.star; });
    return cards;
  }

  /* Choose the cards for a session.
     quick: the deck's own Quick Catch list (3 FISHY, 3 REAL, 2 PAUSE AND ASK).
     full : 24 cards, 8 per round, each round mixing the three sorts, shuffled. */
  function pickCards(data, deckKey, mode, starsOnly, rng) {
    var pool = deckFor(data, deckKey, starsOnly);
    var byId = {};
    pool.forEach(function (c) { byId[c.id] = c; });
    if (mode === "quick") {
      var ids = data.quick[deckKey];
      var picked = ids.map(function (i) { return byId[i]; }).filter(Boolean);
      if (picked.length === ids.length) return U.shuffle(picked, rng);
      // star subset might miss a card: top up from the pool with the same mix
      return topUp(pool, picked, [3, 3, 2], rng);
    }
    var mixes = [[3, 3, 2], [3, 2, 3], [2, 3, 3]];   // F,R,P per round; totals 8, 8, 8
    var used = {}, out = [];
    mixes.forEach(function (mix) {
      var round = [];
      SORTS.forEach(function (s, si) {
        var avail = U.shuffle(pool.filter(function (c) { return c.sort === s && !used[c.id]; }), rng);
        for (var n = 0; n < mix[si] && n < avail.length; n++) { used[avail[n].id] = true; round.push(avail[n]); }
      });
      out = out.concat(U.shuffle(round, rng));
    });
    return out;
  }

  function topUp(pool, picked, mix, rng) {
    var have = { F: 0, R: 0, P: 0 }, used = {};
    picked.forEach(function (c) { have[c.sort]++; used[c.id] = true; });
    SORTS.forEach(function (s, i) {
      var need = mix[i] - have[s];
      if (need <= 0) return;
      U.shuffle(pool.filter(function (c) { return c.sort === s && !used[c.id]; }), rng).slice(0, need).forEach(function (c) { picked.push(c); used[c.id] = true; });
    });
    return U.shuffle(picked, rng);
  }

  /* Round number (1-based) for a card index in a session. */
  function roundOf(mode, index) { return mode === "full" ? Math.floor(index / 8) + 1 : 1; }

  /* Peeper's Boost: the class cannot lose. Returns circles added at the end. */
  function boost(earned, goal) { return earned >= goal ? 0 : goal - earned; }

  /* Pond layout for a mode: rows of circles with names. */
  function pondRows(mode) {
    if (mode === "quick") return [{ key: "mini", size: 12 }];
    return [{ key: "shore", size: 10 }, { key: "shallows", size: 10 }, { key: "deep", size: 10 },
            { key: "lagoon1", size: 12 }, { key: "lagoon2", size: 12 }];
  }

  /* Cheers happen at circles 10, 20, 30 of the Pond (full mode) and at the end of the Mini Pond. */
  function cheerAt(mode, before, after) {
    var marks = mode === "full" ? [10, 20, 30] : [12];
    for (var i = 0; i < marks.length; i++) if (before < marks[i] && after >= marks[i]) return marks[i];
    return 0;
  }

  return { SORTS: SORTS, MODES: MODES, MAX_CLUES: MAX_CLUES, cardCircles: cardCircles, outcome: outcome, clueIsRight: clueIsRight,
           deckFor: deckFor, pickCards: pickCards, roundOf: roundOf, boost: boost, pondRows: pondRows, cheerAt: cheerAt };
});
