/* Help Ladder Trail: the cooperative rules as pure functions (browser and Node tests).
   Source: kit/14_Games_and_Fun/02_The_Hackles_Trail_Board_Game.md (sections 2 to 4, 6, 10, 11).
   Simplified for one screen: the class cannot lose, nobody moves backward for an answer. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../assets/js/util.js"));
  else root.TrailLogic = factory(root.HKUtil);
})(typeof self !== "undefined" ? self : this, function (U) {
  "use strict";

  /* Space codes: E trail, L ladder, H helper, B breathe, G Gifty's gift stop, F finish. Spaces 1..40. */
  var FULL_MAP = "E E H E L  E E B E G  E L E H G  E E L E B  E L E L G  E H E B E  E L E L G  E H L B F".split(/\s+/);
  /* Mini Trail: Fishy Pond (11-15), Share Meadow (16-20), Fix-It Bridge (31-35), with the H on 14 treated as B. */
  var MINI_MAP = [FULL_MAP[10], FULL_MAP[11], FULL_MAP[12], "B", FULL_MAP[14],
                  FULL_MAP[15], FULL_MAP[16], FULL_MAP[17], FULL_MAP[18], FULL_MAP[19],
                  FULL_MAP[30], FULL_MAP[31], FULL_MAP[32], FULL_MAP[33], FULL_MAP[34]];
  var MOVES = { best: 5, ok: 4, oops: 3 };
  var DETOUR = 2;
  var JAR_MAX = 2;
  var LADDER_RUNGS = 3;
  var CONFIG = {
    full: { map: FULL_MAP, finish: 40, giftyEvery: 3, zones: 8, sunriseTarget: 36, sunriseThreshold: 32 },
    mini: { map: MINI_MAP, finish: 15, giftyEvery: 2, zones: 3, sunriseTarget: 13, sunriseThreshold: 12 }
  };

  function spaceType(state, pos) {
    if (pos >= state.cfg.finish) return "F";
    if (pos <= 0) return "S";
    return state.cfg.map[pos - 1] === "F" ? "F" : state.cfg.map[pos - 1];
  }
  function zoneOf(state, pos) {
    if (state.mode === "mini") return [3, 4, 7][Math.min(2, Math.max(0, Math.ceil(Math.max(pos, 1) / 5) - 1))];
    return Math.min(8, Math.max(1, Math.ceil(Math.max(pos, 1) / 5)));
  }

  function newGame(data, opts) {
    opts = opts || {};
    var mode = opts.mode === "mini" ? "mini" : "full", rng = opts.rng || U.secureRandom;
    var cfg = CONFIG[mode];
    var s = {
      mode: mode, cfg: cfg, rng: rng, teams: Math.max(2, Math.min(6, opts.teams || 4)),
      pos: 0, turns: 0, team: 0, jar: 0, storms: 0, slips: 0, firstSlipUsed: false, rungs: 0, ladderFill: 0, wishes: 0,
      flags: { blockSlip: false, skipG: false, removeOops: false, nextPlus: 0, undoDetour: false, buddyHint: false },
      usedEvents: {}, decks: {
        lures: U.shuffle(data.lures, rng), ladders: U.shuffle(data.ladders, rng), helpers: U.shuffle(data.helpers, rng), fixits: U.shuffle(data.fixits, rng)
      }, data: data, finished: false, lastDetour: null, log: []
    };
    return s;
  }

  function draw(state, name) {
    var d = state.decks[name];
    if (!d.length) state.decks[name] = U.shuffle(state.data[name], state.rng);
    return state.decks[name].shift();
  }

  /* Event card for the zone the token is in; any unused card if that zone is used up. */
  function drawEvent(state) {
    var z = zoneOf(state, state.pos), all = state.data.events;
    var unused = all.filter(function (e) { return !state.usedEvents[e.id]; });
    if (!unused.length) { state.usedEvents = {}; unused = all.slice(); }
    var inZone = unused.filter(function (e) { return e.zone === z; });
    var pool = inZone.length ? inZone : unused;
    var ev = pool[U.randInt(pool.length, state.rng)];
    state.usedEvents[ev.id] = true;
    return ev;
  }

  /* Options visible to the team (H2 Peeper's Peek removes one Oops-path choice). */
  function visibleOptions(state, ev) {
    var letters = ["A", "B", "C"];
    if (state.flags.removeOops) return letters.filter(function (l) { return l !== ev.oops; });
    return letters;
  }

  function categoryOf(ev, choice) {
    if (choice === "pass") return "ok";            // Pass to the Guides counts as OK
    if (choice === ev.best) return "best";
    if (choice === ev.ok) return "ok";
    return "oops";
  }
  function bestIsTell(ev) { return /\btell\b|\bask\b/i.test(ev.en.opts ? ev.en.opts[ev.best] : ev.en[ev.best]); }

  function moveTo(state, steps) {
    state.pos = Math.min(state.cfg.finish, state.pos + steps);
    if (state.pos >= state.cfg.finish) state.finished = true;
  }

  /* Answer an event. Nobody ever moves backward for an answer. */
  function answerEvent(state, ev, choice) {
    var cat = categoryOf(ev, choice), steps = MOVES[cat];
    var bonus = state.flags.nextPlus; state.flags.nextPlus = 0;
    var fixit = null, token = false;
    state.flags.removeOops = false; state.flags.buddyHint = false;
    moveTo(state, steps + bonus);
    if (cat === "best" && choice !== "pass" && bestIsTell(ev)) { state.rungs++; token = true; }
    if (cat === "oops") fixit = takeFixit(state);
    return { category: cat, steps: steps, bonus: bonus, fixit: fixit, token: token, pos: state.pos, landed: spaceType(state, state.pos), finished: state.finished };
  }

  function takeFixit(state) {
    var c = draw(state, "fixits");
    if (c.id === "X7") state.rungs++;      // Fixit pays a Rung Token
    return c;
  }

  /* Ladder space: one scenario; climbing fills a rung and earns a Rung Token. */
  function drawLadder(state) { return draw(state, "ladders"); }
  function completeLadder(state) {
    state.rungs++; state.ladderFill++;
    var wish = false;
    if (state.ladderFill >= LADDER_RUNGS) { state.ladderFill = 0; state.wishes++; wish = true; }
    return { wish: wish, fill: state.ladderFill, rungs: state.rungs };
  }
  /* Ladder Wish: "jar" empties the jar, "skip" moves 3 spaces, "helpers" draws 2 helper cards. */
  function ladderWish(state, choice) {
    if (choice === "jar") { state.jar = 0; return { choice: choice }; }
    if (choice === "skip") { moveTo(state, 3); return { choice: choice, finished: state.finished }; }
    var h1 = drawHelper(state), h2 = drawHelper(state);
    return { choice: "helpers", helpers: [h1, h2] };
  }

  function breathe(state) { state.jar = Math.max(0, state.jar - 1); }

  /* Helper cards (the effects in section 10 of the board game). */
  function drawHelper(state) {
    var c = draw(state, "helpers");
    switch (c.id) {
      case "H1": state.flags.blockSlip = true; break;
      case "H2": state.flags.removeOops = true; break;
      case "H3": state.flags.skipG = true; break;
      case "H4": case "H9": state.rungs++; break;
      case "H5": state.flags.nextPlus += 1; break;
      case "H6": state.flags.undoDetour = true; break;
      case "H7": case "H8": state.jar = Math.max(0, state.jar - 1); break;
      case "H10": state.flags.buddyHint = true; break;
    }
    return c;
  }

  /* Gifty's turn. The coin: hook side = Glitter Slip, star side = Gifty is beaten. */
  function giftyTurn(state, forcedHook) {
    var lure = draw(state, "lures");
    var hook = forcedHook === undefined ? state.rng() < 0.5 : !!forcedHook;
    var res = { lure: lure, hook: hook, slip: null };
    if (!hook) return res;
    var slip = { blocked: false, free: false, detour: 0, storm: false, fixit: null };
    if (state.flags.blockSlip) { state.flags.blockSlip = false; slip.blocked = true; res.slip = slip; return res; }
    state.slips++;
    state.jar++;
    if (!state.firstSlipUsed) { state.firstSlipUsed = true; slip.free = true; }
    else {
      if (state.flags.undoDetour) { state.flags.undoDetour = false; slip.undone = true; }
      else { var before = state.pos; state.pos = Math.max(0, state.pos - DETOUR); slip.detour = before - state.pos; state.lastDetour = { amount: slip.detour }; }
    }
    slip.fixit = takeFixit(state);
    if (state.jar >= JAR_MAX) { state.jar = 0; state.storms++; slip.storm = true; }
    res.slip = slip;
    return res;
  }

  /* Spend a Rung Token and say a Tell sentence aloud to cancel the last Detour. */
  function cancelDetour(state) {
    if (!state.lastDetour || state.rungs < 1) return false;
    state.rungs--; state.pos = Math.min(state.cfg.finish - 1, state.pos + state.lastDetour.amount); state.lastDetour = null;
    return true;
  }

  /* End of a team turn. Returns whether Gifty's regular turn is due. */
  function endTurn(state) {
    state.turns++;
    state.team = (state.team + 1) % state.teams;
    state.lastDetour = state.lastDetour;     // kept until the next answer
    return { giftyDue: state.turns % state.cfg.giftyEvery === 0 };
  }
  function clearDetour(state) { state.lastDetour = null; }

  /* A G space: Gifty turn unless H3 (Pip's Shell) skips it. */
  function gSpace(state) { if (state.flags.skipG) { state.flags.skipG = false; return false; } return true; }

  /* Sunrise Wind: keeps a long game on time. Teacher tool. */
  function sunrise(state) {
    if (state.pos > state.cfg.sunriseThreshold) return false;
    state.pos = state.cfg.sunriseTarget; return true;
  }

  function tier(state) { return state.storms === 0 ? "gold" : state.storms === 1 ? "silver" : "bronze"; }

  /* Play a whole game with random choices (for tests and for checking that the class cannot lose). */
  function simulate(data, opts) {
    var s = newGame(data, opts), guard = 0;
    var rng = s.rng;
    while (!s.finished && guard++ < 500) {
      var ev = drawEvent(s);
      var vis = visibleOptions(s, ev), choice = vis[U.randInt(vis.length, rng)];
      if (rng() < 0.1) choice = "pass";
      var r = answerEvent(s, ev, choice);
      if (s.finished) break;
      var t = r.landed, gifty = false;
      if (t === "L") { drawLadder(s); completeLadder(s); }
      if (t === "H") drawHelper(s);
      if (t === "B") breathe(s);
      if (t === "G") gifty = gSpace(s);
      var e = endTurn(s);
      if (gifty || e.giftyDue) { var g = giftyTurn(s); if (g.slip && g.slip.detour && s.rungs > 0 && rng() < 0.5) cancelDetour(s); }
      if (s.ladderFill === 0 && s.wishes > 0 && rng() < 0.3) { ladderWish(s, "jar"); s.wishes--; }
    }
    return { state: s, turns: s.turns, tier: tier(s), finished: s.finished };
  }

  return { FULL_MAP: FULL_MAP, MINI_MAP: MINI_MAP, MOVES: MOVES, DETOUR: DETOUR, JAR_MAX: JAR_MAX, CONFIG: CONFIG, spaceType: spaceType, zoneOf: zoneOf,
           newGame: newGame, drawEvent: drawEvent, visibleOptions: visibleOptions, categoryOf: categoryOf, answerEvent: answerEvent, drawLadder: drawLadder,
           completeLadder: completeLadder, ladderWish: ladderWish, breathe: breathe, drawHelper: drawHelper, giftyTurn: giftyTurn, cancelDetour: cancelDetour,
           endTurn: endTurn, clearDetour: clearDetour, gSpace: gSpace, sunrise: sunrise, tier: tier, simulate: simulate, moveTo: moveTo, bestIsTell: bestIsTell };
});
