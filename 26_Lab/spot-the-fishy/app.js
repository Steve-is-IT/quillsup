/* Spot the Fishy: the game screen. No storage, no network. */
(function () {
  "use strict";
  var D = window.HK_DATA.spot, L = window.SpotLogic, U = window.HKUtil;
  var T = HK.t, E = HK.el;
  var APP = document.getElementById("app");
  var CREW = ["Latch Locks", "Peeper Pals", "Pip Pods", "Buddy Bunch", "Ember Krew", "Fixit Fixers"];
  var SORTNAME = { F: "fishy", R: "real", P: "pause" };

  var cfg = { deck: "k5", stars: false, who: "solo", teams: 4, length: "quick", timer: 0, clues: true };
  var S = null;       // game state
  var timerId = null;

  var SHAPES = {
    F: '<svg class="shape" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M6 32C14 14 40 12 50 32C40 52 14 50 6 32Z" fill="#FF8A7A" stroke="currentColor" stroke-width="3"/><path d="M50 32L62 20V44Z" fill="#FF8A7A" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="29" r="3" fill="currentColor"/><path d="M8 38C5 44 8 50 13 49" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
    R: '<svg class="shape" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M32 5L39 24L59 25L43 38L49 58L32 46L15 58L21 38L5 25L25 24Z" fill="#FFC93C" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
    P: '<svg class="shape" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M18 58V30a3.5 3.5 0 0 1 7 0V14a3.5 3.5 0 0 1 7 0V11a3.5 3.5 0 0 1 7 0V15a3.5 3.5 0 0 1 7 0V40l5-7a3.5 3.5 0 0 1 6 3.5L50 52C47 57 43 58 38 58Z" fill="#8FD0F0" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>'
  };

  function card() { return S.cards[S.idx]; }
  function deckCards() { return L.deckFor(D, cfg.deck, cfg.stars); }
  function goal() { return L.MODES[cfg.length].pondCircles; }
  function cardText(c, field) { return c[HK.lang][field]; }

  /* ---------------- setup ---------------- */
  function radio(name, value, labelKey, checked, onchange) {
    var id = "r-" + name + "-" + value;
    var input = E("input", { type: "radio", name: name, value: value, id: id, checked: checked ? "checked" : null, onchange: function () { onchange(value); } });
    if (!checked) input.removeAttribute("checked");
    input.checked = !!checked;
    return E("label", { class: "opt", for: id }, [input, E("span", { text: T(labelKey) })]);
  }

  function renderSetup() {
    stopTimer();
    APP.textContent = "";
    var head = E("div", null, [
      E("p", { class: "kicker", text: T("spot.kicker") }),
      E("h1", { id: "h-main", tabindex: "-1", text: T("spot.title") }),
      E("span", { class: "tick", "aria-hidden": "true" }),
      E("p", { class: "lead", text: T("spot.lead") })
    ]);
    var hero = E("div", { class: "row" }, [E("span", { "data-art": "fishy.hero", "data-decorative": "", "data-h": "6rem" })]);
    var how = E("div", { class: "note" }, [
      E("span", { class: "label", text: T("spot.how") }),
      E("ol", null, [E("li", { text: T("spot.how1") }), E("li", { text: T("spot.how2") }), E("li", { text: T("spot.how3") })])
    ]);
    var promise = E("p", { class: "promise", text: T("common.promise") });

    var fsDeck = E("fieldset", null, [E("legend", { text: T("spot.deck") }),
      radio("deck", "k5", "spot.deck.k5", cfg.deck === "k5", function (v) { cfg.deck = v; renderSetup(); focusAfter("deck-k5"); }),
      radio("deck", "t", "spot.deck.t", cfg.deck === "t", function (v) { cfg.deck = v; renderSetup(); focusAfter("deck-t"); })
    ]);
    if (cfg.deck === "k5") {
      var cb = E("label", { class: "opt", for: "c-stars" }, [
        E("input", { type: "checkbox", id: "c-stars", onchange: function (e) { cfg.stars = e.target.checked; } }),
        E("span", { text: T("spot.stars") })
      ]);
      cb.querySelector("input").checked = cfg.stars;
      fsDeck.appendChild(cb);
    }
    var fsWho = E("fieldset", null, [E("legend", { text: T("spot.who") }),
      radio("who", "solo", "spot.who.solo", cfg.who === "solo", function (v) { cfg.who = v; renderSetup(); focusAfter("who-solo"); }),
      radio("who", "team", "spot.who.team", cfg.who === "team", function (v) { cfg.who = v; renderSetup(); focusAfter("who-team"); })
    ]);
    if (cfg.who === "team") {
      var sel = E("select", { id: "sel-teams", onchange: function (e) { cfg.teams = parseInt(e.target.value, 10); renderSetup(); focusAfter("sel-teams", true); } });
      [2, 3, 4, 5, 6].forEach(function (n) { var o = E("option", { value: String(n), text: String(n) }); if (n === cfg.teams) o.selected = true; sel.appendChild(o); });
      fsWho.appendChild(E("p", null, [E("label", { for: "sel-teams", text: T("spot.teams") + " " }), sel]));
      fsWho.appendChild(E("p", { class: "fine", text: CREW.slice(0, cfg.teams).join(", ") + ". " + T("spot.teamsNote") }));
    }
    var fsLen = E("fieldset", null, [E("legend", { text: T("spot.length") }),
      radio("length", "quick", "spot.len.quick", cfg.length === "quick", function (v) { cfg.length = v; }),
      radio("length", "full", "spot.len.full", cfg.length === "full", function (v) { cfg.length = v; })
    ]);
    var tsel = E("select", { id: "sel-timer", onchange: function (e) { cfg.timer = parseInt(e.target.value, 10); } });
    [[0, "spot.timer.off"], [10, "spot.timer.10"], [20, "spot.timer.20"], [30, "spot.timer.30"]].forEach(function (p) {
      var o = E("option", { value: String(p[0]), text: T(p[1]) }); if (cfg.timer === p[0]) o.selected = true; tsel.appendChild(o);
    });
    var csel = E("select", { id: "sel-clues", onchange: function (e) { cfg.clues = e.target.value === "on"; } }, [
      E("option", { value: "on", text: T("spot.clues.on") }), E("option", { value: "off", text: T("spot.clues.off") })
    ]);
    csel.value = cfg.clues ? "on" : "off";
    var det = E("details", { class: "plate plain" }, [
      E("summary", { text: T("spot.teacher") }),
      E("p", null, [E("label", { for: "sel-timer", text: T("spot.timer") + ": " }), tsel]),
      E("p", { class: "fine", text: T("spot.timerNote") }),
      E("p", null, [E("label", { for: "sel-clues", text: T("spot.clues") + ": " }), csel])
    ]);
    var start = E("button", { type: "button", class: "btn primary", id: "btn-start", onclick: startGame, text: T("spot.start") });
    var priv = E("p", { class: "fine", text: T("spot.privacyNote") });
    APP.appendChild(head); APP.appendChild(hero); APP.appendChild(how); APP.appendChild(promise);
    APP.appendChild(fsDeck); APP.appendChild(fsWho); APP.appendChild(fsLen); APP.appendChild(det);
    APP.appendChild(E("div", { class: "row" }, [start])); APP.appendChild(priv);
    HK.refreshArt();
  }

  function focusAfter(id, byId) {
    var el = byId ? document.getElementById(id) : document.getElementById("r-" + id.replace("-", "-"));
    if (el) el.focus();
  }

  /* ---------------- game ---------------- */
  function startGame() {
    var cards = L.pickCards(D, cfg.deck, cfg.length, cfg.stars, null);
    S = { screen: "play", cards: cards, idx: 0, phase: "answering", answers: [], picks: [], teamEdit: {}, clueTried: {}, earnedBefore: 0,
          cheers: {}, askUsed: false, buddyShown: false, clueCount: 0, remembered: null, timeLeft: cfg.timer, timerPaused: false, cheerNow: 0, twinOpen: false };
    resetPicks();
    HK.say(T("spot.liveStart", { deck: T(cfg.deck === "k5" ? "spot.deck.k5" : "spot.deck.t") }));
    render("card");
  }

  function resetPicks() {
    var n = cfg.who === "team" ? cfg.teams : 1;
    S.picks = []; S.teamEdit = {};
    for (var i = 0; i < n; i++) S.picks.push(null);
    S.answers = []; S.clueTried = {}; S.phase = "answering"; S.buddyShown = false; S.twinOpen = false;
    S.timeLeft = cfg.timer; S.timerPaused = false; S.cheerNow = 0;
  }

  function curResult() { return L.cardCircles(card(), S.answers, rightClues()); }
  function rightClues() { var c = card(), n = 0; Object.keys(S.clueTried).forEach(function (k) { if (S.clueTried[k] && L.clueIsRight(c, k)) n++; }); return n; }
  function earnedNow() { return S.earnedBefore + (S.phase === "revealed" ? curResult().circles : 0); }

  function pondEl() {
    var earned = earnedNow(), g = goal(), filled = Math.min(earned, g), idx = 0;
    var wrap = E("div", { class: "plate" });
    wrap.appendChild(E("h2", { text: T(cfg.length === "full" ? "spot.pond" : "spot.pondMini") }));
    wrap.appendChild(E("p", { class: "big-num", id: "pond-count", text: T("spot.pondCount", { n: filled, goal: g }) }));
    L.pondRows(cfg.length).forEach(function (row) {
      if (row.key !== "mini") wrap.appendChild(E("p", { class: "fine", "aria-hidden": "true", style: "margin:0.3rem 0 0", text: T("spot.row." + row.key) }));
      var ul = E("ul", { class: "pond", "aria-hidden": "true" });
      for (var i = 0; i < row.size; i++) {
        idx++;
        var li = E("li", { class: (idx <= filled ? "on " : "") + ((cfg.length === "full" && (idx === 10 || idx === 20 || idx === 30)) || (cfg.length === "quick" && idx === 12) ? "star" : "") });
        ul.appendChild(li);
      }
      wrap.appendChild(ul);
    });
    wrap.appendChild(E("div", { class: "progress", "aria-hidden": "true" }, [E("span", { style: "width:" + Math.round(100 * filled / g) + "%" })]));
    return wrap;
  }

  function bucketBtn(sort, disabled, state) {
    var cls = "bucket " + SORTNAME[sort] + (state.answer ? " is-answer" : "") + (state.dim ? " dim" : "");
    var btn = E("button", { type: "button", class: cls, "data-sort": sort, "aria-keyshortcuts": sort === "F" ? "1" : sort === "R" ? "2" : "3",
      "aria-pressed": state.chosen ? "true" : (disabled ? "false" : null), disabled: disabled ? "disabled" : null,
      onclick: function () { solo(sort); } });
    btn.innerHTML = SHAPES[sort];
    btn.appendChild(E("span", { class: "word", text: T("spot.bucket." + sort) }));
    btn.appendChild(E("span", { class: "what", text: T("spot.what." + sort) }));
    if (state.chosen) btn.appendChild(E("span", { class: "what", style: "font-weight:700", text: "(" + T("spot.yourPick") + ")" }));
    return btn;
  }

  function render(focus) {
    stopTimer();
    if (!S) return renderSetup();
    if (S.screen === "end") return renderEnd(focus);
    APP.textContent = "";
    var c = card(), total = S.cards.length, round = L.roundOf(cfg.length, S.idx), revealed = S.phase === "revealed";
    var grid = E("div", { class: "playgrid" });
    var main = E("div", { class: "playmain" }), side = E("div", { class: "playside" });

    var roundName = cfg.length === "full" ? T("spot.round", { r: round, name: T("spot.round." + round) }) : T("spot.round.quick");
    main.appendChild(E("p", { class: "kicker", text: roundName }));
    main.appendChild(E("h1", { id: "h-main", tabindex: "-1", style: "font-size:1.5rem; display:flex; flex-wrap:wrap; gap:0 1.2rem; align-items:baseline" }, [
      E("span", { text: T("spot.card", { n: S.idx + 1, total: total }) }),
      E("span", { class: "fine", style: "font-weight:400; font-family:var(--serif)", text: T("spot.pond") + ": " + T("spot.pondCount", { n: Math.min(earnedNow(), goal()), goal: goal() }) })
    ]));
    if (cfg.length === "full") main.appendChild(E("p", { class: "fine", text: T("spot.roundHint." + round) }));

    var cardBox = E("div", { class: "sortcard" + (S.fresh ? " enter" : ""), id: "the-card", role: "group", "aria-label": T("spot.reading") });
    cardBox.appendChild(E("span", { class: "cardno", "aria-hidden": "true", text: c.id }));
    cardBox.appendChild(E("span", { text: cardText(c, "front") }));
    main.appendChild(cardBox);
    S.fresh = false;

    if (!revealed) {
      if (cfg.who === "solo") {
        main.appendChild(E("p", { class: "fine", text: T("spot.pickPrompt") }));
        var b = E("div", { class: "buckets", role: "group", "aria-label": T("spot.pickPrompt") });
        ["F", "R", "P"].forEach(function (s) { b.appendChild(bucketBtn(s, false, {})); });
        main.appendChild(b);
        main.appendChild(E("div", { class: "row" }, [
          E("button", { type: "button", class: "btn small", id: "btn-pass", onclick: function () { solo("X"); }, text: T("spot.pass") }),
          E("span", { class: "fine", text: T("spot.passNote") })
        ]));
      } else {
        main.appendChild(E("p", { class: "fine", text: T("spot.teamPick") }));
        main.appendChild(teamRows());
        var allReady = S.picks.every(function (p) { return p !== null; });
        main.appendChild(E("div", { class: "row" }, [
          E("button", { type: "button", class: "btn primary", id: "btn-peek", onclick: peek, disabled: allReady ? null : "disabled", "aria-describedby": "peek-help", text: T("spot.peek") }),
          E("span", { class: "fine", id: "peek-help", text: allReady ? T("spot.peekHelp") : T("spot.waiting") })
        ]));
      }
      var tools = E("div", { class: "row" });
      tools.appendChild(E("button", { type: "button", class: "btn small", id: "btn-buddy", disabled: S.askUsed && !S.buddyShown ? "disabled" : null, onclick: askBuddy, text: S.askUsed && !S.buddyShown ? T("spot.askBuddyUsed") : T("spot.askBuddy") }));
      main.appendChild(tools);
      if (S.buddyShown) main.appendChild(E("p", { class: "note", role: "note", text: buddyText(c) }));
      if (cfg.timer > 0) main.appendChild(timerBox());
      if (cfg.who === "solo") main.appendChild(E("p", { class: "fine", text: T("spot.keys") }));
    } else {
      main.appendChild(revealBlock(c, round));
    }

    side.appendChild(pondEl());
    if (S.cheerNow) side.appendChild(E("p", { class: "promise", role: "note", text: T("spot.cheer." + S.cheerNow) }));
    side.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "fishy.think", "data-decorative": "", "data-h": "5rem" })]));
    grid.appendChild(main); grid.appendChild(side);
    APP.appendChild(grid);
    HK.refreshArt();
    if (!revealed) {
      if (cfg.timer > 0 && !S.timerPaused) startTimer();
    }
    if (focus === "card") { HK.focus(document.getElementById("h-main")); HK.say(T("spot.liveCard", { n: S.idx + 1, total: total, text: cardText(c, "front") })); }
    else if (focus === "reveal") { HK.focus(document.getElementById("h-reveal")); }
  }

  function teamRows() {
    var box = E("div", { class: "plate plain" });
    S.picks.forEach(function (p, i) {
      var name = CREW[i];
      var row = E("div", { class: "row", style: "justify-content:space-between" });
      row.appendChild(E("span", { style: "font-weight:700", text: T("spot.team", { name: name }) }));
      if (p !== null && !S.teamEdit[i]) {
        row.appendChild(E("span", null, [
          E("span", { text: "✓ " + T("spot.teamReady") + "  " }),
          E("button", { type: "button", class: "btn small", onclick: function () { S.teamEdit[i] = true; render(); document.getElementById("t" + i + "-F").focus(); }, "aria-label": T("spot.team", { name: name }) + ": " + T("spot.teamReady") + ". " + T("spot.change"), text: T("spot.change") })
        ]));
      } else {
        var seg = E("span", { class: "seg", role: "group", "aria-label": T("spot.team", { name: name }) });
        ["F", "R", "P", "X"].forEach(function (a) {
          seg.appendChild(E("button", { type: "button", id: "t" + i + "-" + a, onclick: function () { S.picks[i] = a; S.teamEdit[i] = false; render(); HK.say(T("spot.team", { name: name }) + ": " + T("spot.teamReady")); var nb = document.querySelector("#btn-peek"); }, text: a === "X" ? T("spot.pass") : T("spot.s." + a) }));
        });
        row.appendChild(seg);
      }
      box.appendChild(row);
    });
    return box;
  }

  function buddyText(c) {
    if (!c.flags.length) return T("spot.buddyHintNone");
    var key = cfg.deck === "k5" ? "spot.spot." : "spot.flags.";
    return T("spot.buddyHint") + " " + c.flags.map(function (f) { return T(key + f); }).join(", ") + ".";
  }
  function askBuddy() { S.askUsed = true; S.buddyShown = true; render(); HK.say(buddyText(card())); var n = document.querySelector("[role=note]"); }

  function solo(a) { if (S.phase !== "answering") return; S.picks = [a]; S.answers = [a]; doReveal(); }
  function peek() { if (!S.picks.every(function (p) { return p !== null; })) return; S.answers = S.picks.slice(); doReveal(); }

  function doReveal() {
    var before = S.earnedBefore;
    S.phase = "revealed";
    var after = earnedNow();
    S.cheerNow = L.cheerAt(cfg.length, before, Math.min(after, 999));
    var c = card();
    var outs = outcomesOf(c);
    var res = curResult();
    HK.say(T("spot.liveReveal", { sort: T("spot.revealIs", { sort: T("spot.s." + c.sort) }), out: T("spot.out." + outs[0]), have: Math.min(after, goal()), goal: goal() }));
    render("reveal");
  }

  function outcomesOf(c) {
    var seen = [], list = [];
    S.answers.forEach(function (a) { var o = L.outcome(c, a); if (seen.indexOf(o) < 0) { seen.push(o); list.push(o); } });
    return list;
  }

  function revealBlock(c, round) {
    var box = E("div");
    var res = curResult();
    var fb = E("div", { class: "feedback good", role: "region", "aria-labelledby": "h-reveal" });
    var head = E("div", { class: "head" });
    head.appendChild(E("span", { "data-art": "fishy.good", "data-decorative": "", "data-h": "2.6rem" }));
    head.appendChild(E("span", { id: "h-reveal", tabindex: "-1", text: T("spot.revealIs", { sort: T("spot.s." + c.sort) }) }));
    fb.appendChild(head);
    fb.appendChild(E("p", { style: "font-weight:700", text: T("spot.nice") }));
    outcomesOf(c).forEach(function (o) {
      var prefix = "";
      fb.appendChild(E("p", { text: prefix + T("spot.out." + o) }));
      if (o === "pause_safe") fb.appendChild(E("p", { class: "fine", text: T("spot.checkIdeas") }));
    });
    if (cfg.who === "team") {
      var cnt = { F: 0, R: 0, P: 0, X: 0 };
      S.answers.forEach(function (a) { cnt[a]++; });
      fb.appendChild(E("p", { class: "fine", text: T("spot.revealCounts", cnt) }));
      fb.appendChild(E("p", { class: "fine", text: T("spot.revealTeams", { best: res.bestCount, teams: res.teams }) }));
    }
    var says = E("div", { class: "note" }, [E("span", { class: "label", text: T("spot.deckSays") }), E("p", { html: HK.md(cardText(c, "back")), style: "margin:0" })]);
    fb.appendChild(says);
    box.appendChild(fb);

    // twin
    if (cfg.deck === "t") {
      var tw = D.twins.filter(function (t) { return t.fishy === c.id || t.real === c.id; })[0];
      if (tw) {
        var otherId = tw.fishy === c.id ? tw.real : tw.fishy;
        var other = D.t.filter(function (x) { return x.id === otherId; })[0];
        var tbox = E("div", { class: "note" }, [E("span", { class: "label", text: T("spot.twin") }), E("p", { text: T("spot.twinSays", { id: otherId }) })]);
        var btn = E("button", { type: "button", class: "btn small", "aria-expanded": S.twinOpen ? "true" : "false", onclick: function () { S.twinOpen = !S.twinOpen; render(); document.getElementById("btn-twin").focus(); }, id: "btn-twin", text: T(S.twinOpen ? "spot.twinHide" : "spot.twinShow") });
        tbox.appendChild(btn);
        if (S.twinOpen && other) {
          tbox.appendChild(E("p", { class: "sortcard", style: "font-size:1.05rem", text: other[HK.lang].front }));
          tbox.appendChild(E("p", { html: HK.md(other[HK.lang].back) }));
          tbox.appendChild(E("p", { text: T("spot.twinDiff") + (HK.lang === "en" ? tw.diff : tw.diffEs) }));
        }
        box.appendChild(tbox);
      }
    }

    // clue naming (only when this card has clue letters)
    if (cfg.clues && c.flags.length) {
      var cl = E("div", { class: "plate plain" });
      cl.appendChild(E("h2", { style: "font-size:1.15rem", text: T("spot.nameFlag") }));
      cl.appendChild(E("p", { class: "fine", text: T(cfg.who === "team" ? "spot.nameFlagTeam" : "spot.nameFlagHelp") }));
      var letters = cfg.deck === "k5" ? ["S", "P", "O", "T"] : ["F", "L", "A", "G", "S"];
      var key = cfg.deck === "k5" ? "spot.spot." : "spot.flags.";
      var chips = E("div", { class: "chips", role: "group", "aria-label": T(cfg.deck === "k5" ? "spot.legend.k5" : "spot.legend.t") });
      letters.forEach(function (ltr) {
        var tried = !!S.clueTried[ltr], right = tried && L.clueIsRight(c, ltr);
        var chip = E("button", { type: "button", class: "chip" + (right ? " right" : ""), "aria-pressed": tried ? "true" : "false", id: "chip-" + ltr, onclick: function () { tryClue(ltr); } });
        chip.appendChild(E("span", { class: "ltr", text: ltr }));
        chip.appendChild(document.createTextNode(T(key + ltr)));
        chips.appendChild(chip);
      });
      cl.appendChild(chips);
      if (S.lastClue && S.clueTried[S.lastClue]) cl.appendChild(E("p", { role: "status", style: "margin:0", text: L.clueIsRight(c, S.lastClue) ? T("spot.clueYes") : T("spot.clueNo") }));
      box.appendChild(cl);
    }

    // earned (one compact line) and the Hackles move
    var parts = res.parts, bits = [T("spot.pe.always")];
    if (parts.half) bits.push(cfg.who === "team" ? T("spot.pe.half") : T("spot.pe.soloHalf"));
    if (parts.clues) bits.push(T("spot.pe.clues", { n: parts.clues }));
    box.appendChild(E("p", { style: "margin:0.6rem 0", text: T("spot.pondEarned", { n: res.circles }) + " (" + bits.join("; ") + ")" }));
    var mv = E("p", { class: "promise", style: "margin:0.6rem 0" }, [E("strong", { text: T("spot.move") + ": " }), document.createTextNode(T("spot.move.body"))]);
    box.appendChild(mv);
    if (cfg.length === "full" && round === 3) box.appendChild(E("p", { text: T(cfg.deck === "k5" ? "spot.move3.k5" : "spot.move3.t") }));

    var last = S.idx === S.cards.length - 1;
    box.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-next", "aria-keyshortcuts": "N", onclick: next, text: T(last ? "spot.finish" : "spot.next") })]));
    return box;
  }

  function tryClue(ltr) {
    if (S.clueTried[ltr]) return;
    var before = earnedNow();
    S.clueTried[ltr] = true; S.lastClue = ltr;
    var right = L.clueIsRight(card(), ltr);
    var counted = rightClues() <= L.MAX_CLUES;
    var after = earnedNow();
    var ch = L.cheerAt(cfg.length, before, after);
    if (ch) S.cheerNow = ch;
    render();
    var el = document.getElementById("chip-" + ltr); if (el) el.focus();
    HK.say((right ? T("spot.clueYes") : T("spot.clueNo")) + " " + T("spot.pondCount", { n: Math.min(after, goal()), goal: goal() }));
  }

  function next() {
    var res = curResult();
    S.earnedBefore += res.circles;
    S.clueCount += rightClues();
    if (S.idx >= S.cards.length - 1) { S.screen = "end"; render("end"); return; }
    S.idx++; resetPicks(); S.fresh = true;
    render("card");
  }

  /* ---------------- timer (optional, calm) ---------------- */
  function timerBox() {
    var box = E("div", { class: "plate plain", id: "timer-box" });
    box.appendChild(E("p", { style: "margin:0", id: "timer-text", text: T("spot.timerLabel") + ": " + T("spot.timerSec", { n: S.timeLeft }) }));
    box.appendChild(E("div", { class: "progress", "aria-hidden": "true" }, [E("span", { id: "timer-bar", style: "width:" + Math.round(100 * S.timeLeft / cfg.timer) + "%" })]));
    box.appendChild(E("button", { type: "button", class: "btn small", id: "btn-tpause", onclick: function () { S.timerPaused = !S.timerPaused; if (S.timerPaused) stopTimer(); else startTimer(); document.getElementById("btn-tpause").textContent = T(S.timerPaused ? "spot.resume" : "spot.pause"); }, text: T(S.timerPaused ? "spot.resume" : "spot.pause") }));
    return box;
  }
  function startTimer() {
    stopTimer();
    if (S.timeLeft <= 0) return;
    timerId = setInterval(function () {
      S.timeLeft--;
      var t = document.getElementById("timer-text"), b = document.getElementById("timer-bar");
      if (S.timeLeft <= 0) {
        stopTimer();
        if (t) t.textContent = T("spot.timerLabel") + ": " + T("spot.timerDone");
        if (b) b.style.width = "0%";
        HK.say(T("spot.liveTimer"));
        return;
      }
      if (t) t.textContent = T("spot.timerLabel") + ": " + T("spot.timerSec", { n: S.timeLeft });
      if (b) b.style.width = Math.round(100 * S.timeLeft / cfg.timer) + "%";
    }, 1000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  /* ---------------- end ---------------- */
  function renderEnd(focus) {
    APP.textContent = "";
    var g = goal(), earned = S.earnedBefore, add = L.boost(earned, g);
    var box = E("div");
    box.appendChild(E("h1", { id: "h-main", tabindex: "-1", text: T("spot.end.title") }));
    box.appendChild(E("span", { class: "tick", "aria-hidden": "true" }));
    box.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "fishy.done", "data-decorative": "", "data-h": "7rem" })]));
    box.appendChild(E("p", { class: "lead", text: T("spot.end.sub", { n: S.cards.length, c: S.clueCount }) }));
    box.appendChild(E("p", { class: "promise", text: add > 0 ? T("spot.end.boost", { n: add }) : T("spot.end.full") }));
    var full = pondFull();
    box.appendChild(full);
    var pick = E("div", { class: "plate" });
    pick.appendChild(E("h2", { text: T("spot.end.pause") }));
    var chips = E("div", { class: "chips", role: "group", "aria-label": T("spot.end.pause") });
    [1, 2, 3, 4].forEach(function (n) {
      chips.appendChild(E("button", { type: "button", class: "chip", "aria-pressed": S.remembered === n ? "true" : "false", onclick: function () { S.remembered = n; renderEnd(); var el = chips; document.querySelectorAll(".chips .chip")[n - 1].focus(); HK.say(T("spot.rem.picked", { t: T("spot.rem." + n) })); }, text: T("spot.rem." + n) }));
    });
    pick.appendChild(chips);
    if (S.remembered) pick.appendChild(E("p", { role: "status", style: "font-weight:700", text: T("spot.rem.picked", { t: T("spot.rem." + S.remembered) }) }));
    pick.appendChild(E("p", { class: "mono", text: T("spot.chant") }));
    box.appendChild(pick);
    box.appendChild(E("p", { class: "fine", text: T("spot.teacherNote") }));
    box.appendChild(E("div", { class: "row" }, [
      E("button", { type: "button", class: "btn primary", id: "btn-again", onclick: function () { S = null; renderSetup(); HK.focus(document.getElementById("h-main")); }, text: T("spot.again") }),
      E("a", { class: "btn", "data-keep": "../index.html", href: HK.href("../index.html"), text: T("spot.lab") })
    ]));
    APP.appendChild(box);
    HK.refreshArt();
    if (focus === "end") { HK.focus(document.getElementById("h-main")); HK.say(T("spot.end.title") + ". " + (add > 0 ? T("spot.end.boost", { n: add }) : T("spot.end.full"))); }
  }
  function pondFull() {
    var g = goal(), wrap = E("div", { class: "plate" });
    wrap.appendChild(E("p", { class: "big-num", text: T("spot.pondCount", { n: g, goal: g }) }));
    var idx = 0;
    L.pondRows(cfg.length).forEach(function (row) {
      var ul = E("ul", { class: "pond", "aria-hidden": "true" });
      for (var i = 0; i < row.size; i++) { idx++; ul.appendChild(E("li", { class: "on" })); }
      wrap.appendChild(ul);
    });
    return wrap;
  }

  /* ---------------- keys and language ---------------- */
  document.addEventListener("keydown", function (e) {
    if (!S || S.screen !== "play" || e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
    if (S.phase === "answering" && cfg.who === "solo") {
      if (e.key === "1") solo("F"); else if (e.key === "2") solo("R"); else if (e.key === "3") solo("P");
    }
    if (S.phase === "revealed" && (e.key === "n" || e.key === "N")) { next(); }
  });

  HK.onLang(function () { if (S && S.screen === "play") render(); else if (S && S.screen === "end") renderEnd(); else renderSetup(); });

  HK.boot();
  renderSetup();
})();
