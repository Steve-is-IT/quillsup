/* Help Ladder Trail screen: a step machine over TrailLogic. No storage, no network. */
(function () {
  "use strict";
  var D = window.HK_DATA.trail, L = window.TrailLogic, U = window.HKUtil;
  var T = HK.t, E = HK.el;
  var APP = document.getElementById("app");
  var CREW = ["Latch Locks", "Peeper Pals", "Pip Pods", "Buddy Bunch", "Ember Krew", "Fixit Fixers"];
  var cfg = { mode: "mini", teams: 4 };
  var G = null;                 // logic state
  var S = { step: "setup" };    // UI step: setup, event, result, landing, ladder, helper, breathe, gifty, coin, storm, wish, end

  function ev(x) { return x[HK.lang]; }
  function mapTotal() { return G.cfg.finish; }

  function head() {
    var h = E("div");
    h.appendChild(E("p", { class: "kicker", text: T("trail.kicker") }));
    h.appendChild(E("h1", { id: "h-main", tabindex: "-1", text: T("trail.title") }));
    h.appendChild(E("span", { class: "tick", "aria-hidden": "true" }));
    return h;
  }

  function radio(name, value, key, checked, fn) {
    var id = "r-" + name + "-" + value, inp = E("input", { type: "radio", name: name, id: id, onchange: function () { fn(value); } });
    inp.checked = checked;
    return E("label", { class: "opt", for: id }, [inp, E("span", { text: T(key) })]);
  }

  function renderSetup() {
    APP.textContent = "";
    APP.appendChild(head());
    APP.appendChild(E("p", { class: "lead", text: T("trail.lead") }));
    APP.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "trail.hero", "data-decorative": "", "data-h": "8rem" })]));
    APP.appendChild(E("p", { class: "note", text: T("trail.story") }));
    APP.appendChild(E("p", { class: "promise", text: T("trail.promises") }));
    APP.appendChild(E("fieldset", null, [E("legend", { text: T("trail.mode") }),
      radio("mode", "mini", "trail.mode.mini", cfg.mode === "mini", function (v) { cfg.mode = v; }),
      radio("mode", "full", "trail.mode.full", cfg.mode === "full", function (v) { cfg.mode = v; })]));
    var sel = E("select", { id: "sel-teams", onchange: function (e) { cfg.teams = parseInt(e.target.value, 10); renderSetup(); document.getElementById("sel-teams").focus(); } });
    [2, 3, 4, 5, 6].forEach(function (n) { var o = E("option", { value: String(n), text: String(n) }); if (n === cfg.teams) o.selected = true; sel.appendChild(o); });
    APP.appendChild(E("p", null, [E("label", { for: "sel-teams", text: T("trail.teams") + " " }), sel]));
    APP.appendChild(E("p", { class: "fine", text: CREW.slice(0, cfg.teams).join(", ") + ". " + T("trail.teamsNote") }));
    APP.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-start", onclick: start, text: T("trail.start") })]));
    HK.refreshArt();
  }

  function start() {
    G = L.newGame(D, { mode: cfg.mode, teams: cfg.teams });
    nextEvent(true);
  }

  /* ---------- the always-visible frame: map and status ---------- */
  function mapBar() {
    var box = E("div", { class: "plate plain", style: "margin-top:0" });
    var zone = L.zoneOf(G, G.pos);
    box.appendChild(E("h2", { style: "font-size:1.1rem; margin-top:0", text: T("trail.map") + ": " + T("trail.zone", { n: zone, name: T("trail.zone." + zone) }) }));
    var ol = E("ol", { class: "trailbar", "aria-label": T("trail.map") });
    for (var i = 1; i <= G.cfg.finish; i++) {
      var type = L.spaceType(G, i), cls = (i === G.pos ? "here " : "") + (i < G.pos ? "passed " : "") + (i === G.cfg.finish ? "finish" : "");
      var li = E("li", { class: cls.trim(), "aria-current": i === G.pos ? "step" : null, "aria-label": i + ", " + T("trail.sp." + type) + (i === G.pos ? ", Crew Token" : "") });
      li.appendChild(E("span", { "aria-hidden": "true", text: String(i) }));
      li.appendChild(E("span", { class: "t", "aria-hidden": "true", text: type === "F" ? "★" : type }));
      ol.appendChild(li);
    }
    box.appendChild(ol);
    box.appendChild(E("p", { class: "fine", style: "margin:0", text: G.pos ? T("trail.mapAt", { n: G.pos, total: G.cfg.finish }) : T("trail.mapStart") }));
    box.appendChild(E("p", { class: "fine", style: "margin:0", text: T("trail.legend") }));
    return box;
  }
  function statusBar() {
    var ul = E("ul", { style: "display:flex; flex-wrap:wrap; gap:0.4rem 1.2rem; list-style:none; padding:0; margin:0.4rem 0; max-width:none" });
    [T("trail.jar", { n: G.jar }), T("trail.rungs", { n: G.rungs }), T("trail.ladderFill", { n: G.ladderFill }), T("trail.ribbons", { n: G.storms })].forEach(function (x) { ul.appendChild(E("li", { style: "margin:0; font-weight:600", text: x })); });
    return E("div", { "aria-label": T("trail.status"), role: "group" }, [ul]);
  }
  function frame(body, focusId) {
    APP.textContent = "";
    APP.appendChild(head());
    APP.appendChild(mapBar());
    APP.appendChild(statusBar());
    var teacher = E("details", { class: "fine" }, [E("summary", { text: T("trail.sunrise") }), E("p", { text: T("trail.sunrise.help") }),
      E("button", { type: "button", class: "btn small", onclick: function () { var ok = L.sunrise(G); HK.say(ok ? T("trail.sunrise.done") : T("trail.sunrise.no")); if (ok) { S.step = "event"; S.ev = null; nextEvent(false); } else { var p = document.getElementById("sun-msg"); if (p) p.textContent = T("trail.sunrise.no"); } }, text: T("trail.sunrise") }),
      E("p", { id: "sun-msg", role: "status", class: "fine" })]);
    APP.appendChild(body);
    APP.appendChild(teacher);
    HK.refreshArt();
    if (focusId) HK.focus(document.getElementById(focusId));
  }

  /* ---------- event ---------- */
  function nextEvent(first) {
    S.step = "event"; S.ev = L.drawEvent(G); S.picked = null;
    S.hint = G.flags.buddyHint;
    var r = renderEvent();
    HK.say(T("trail.live.event", { n: G.turns + 1, team: CREW[G.team], t: ev(S.ev).situation }));
  }
  function renderEvent() {
    S.render = renderEvent;
    var e = S.ev, t = ev(e), box = E("div");
    var teamBox = E("div", { class: "row" }, [
      E("span", { "data-art": "trail.team." + (G.team + 1), "data-decorative": "", "data-h": "3.5rem" }),
      E("div", null, [E("h2", { id: "h-event", tabindex: "-1", style: "margin:0", text: T("trail.turn", { n: G.turns + 1 }) + ": " + T("trail.active", { name: CREW[G.team] }) }), E("p", { class: "fine", style: "margin:0", text: T("trail.activeSub") })])
    ]);
    box.appendChild(teamBox);
    box.appendChild(E("div", { class: "sortcard" }, [E("span", { text: t.situation })]));
    var vis = L.visibleOptions(G, e), shapes = { A: "○", B: "△", C: "□" };
    if (S.hint) box.appendChild(E("p", { class: "note", role: "note", text: T("trail.hintBuddy", { t: t[e.best].split(" ").slice(0, 3).join(" ") }) }));
    var g = E("div", { role: "group", "aria-label": T("trail.choose"), style: "display:grid; gap:0.6rem" });
    vis.forEach(function (l) {
      g.appendChild(E("button", { type: "button", class: "btn", style: "justify-content:flex-start; text-align:left; font-weight:400; gap:0.8rem", id: "opt-" + l, onclick: function () { answer(l); } }, [
        E("strong", { "aria-hidden": "true", style: "font-size:1.4rem", text: shapes[l] }), E("span", null, [E("strong", { text: T("trail.opt" + l) + ": " }), document.createTextNode(t[l])])
      ]));
    });
    box.appendChild(E("p", { style: "font-weight:700; margin-bottom:0.3rem", text: T("trail.choose") }));
    box.appendChild(g);
    box.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn small", id: "opt-pass", onclick: function () { answer("pass"); }, text: T("trail.pass") }), E("span", { class: "fine", text: T("trail.passNote") })]));
    frame(box, "h-event");
  }

  function answer(choice) {
    var e = S.ev;
    S.picked = choice;
    S.res = L.answerEvent(G, e, choice);
    S.step = "result";
    renderResult();
    HK.say(T("trail.live.result", { c: T("trail." + S.res.category), n: S.res.steps + S.res.bonus, p: G.pos }));
  }

  function renderResult() {
    S.render = renderResult;
    var e = S.ev, t = ev(e), r = S.res, box = E("div");
    box.appendChild(E("h2", { id: "h-result", tabindex: "-1", text: T("trail.result") }));
    box.appendChild(E("p", { class: "sortcard", style: "font-size:1.1rem" }, [E("span", { text: t.situation })]));
    [["best", e.best], ["ok", e.ok], ["oops", e.oops]].forEach(function (p) {
      var cat = p[0], l = p[1], mine = S.picked === l || (S.picked === "pass" && cat === "ok");
      var reason = t.reasons && t.reasons[cat] ? t.reasons[cat] : T("trail.reason." + cat);
      box.appendChild(E("div", { class: "feedback " + (cat === "best" ? "good" : "try"), style: mine ? "outline:4px double var(--ink); outline-offset:2px" : "" }, [
        E("p", { style: "margin:0; font-weight:700", text: T("trail." + cat) + " (" + l + ")" + (mine ? " - " + T("trail.youChose") : "") }),
        E("p", { style: "margin:0.3rem 0 0", text: t[l] }),
        E("p", { class: "fine", style: "margin:0.3rem 0 0", text: reason.charAt(0).toUpperCase() + reason.slice(1) + (/[.!?]$/.test(reason) ? "" : ".") })
      ]));
    });
    box.appendChild(E("p", { style: "font-weight:700", text: r.bonus ? T("trail.movedBonus", { n: r.steps + r.bonus, b: r.bonus }) : T("trail.moved", { n: r.steps }) }));
    if (r.token) box.appendChild(E("p", { text: T("trail.tokenEarned") }));
    if (r.fixit) box.appendChild(fixitBox(r.fixit));
    box.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-go", onclick: afterMove, text: T("trail.continue") })]));
    frame(box, "h-result");
  }
  function fixitBox(c) {
    return E("div", { class: "feedback good" }, [E("div", { class: "head" }, [E("span", { "data-art": "trail.fixit", "data-decorative": "", "data-h": "2.6rem" }), E("span", { text: T("trail.fixit") })]), E("p", { style: "margin:0", text: ev(c).says })]);
  }

  function afterMove() {
    if (G.finished) return renderEnd();
    S.landing = S.res.landed; S.giftyFromG = false; S.helper = null;
    var t = S.landing;
    if (t === "L") { S.lad = L.drawLadder(G); S.ladPick = null; S.opts = null; S.wishDone = false; S.wishRes = null; return renderLadder(); }
    if (t === "H") S.helper = L.drawHelper(G);
    if (t === "B") L.breathe(G);
    if (t === "G") S.giftyFromG = L.gSpace(G);
    renderLanding();
  }

  /* ---------- landing ---------- */
  function renderLanding() {
    var t = S.landing, box = E("div");
    box.appendChild(E("h2", { id: "h-land", tabindex: "-1", text: T("trail.land." + t) }));
    S.render = renderLanding;
    if (t === "H" && S.helper) {
      var h = S.helper;
      box.appendChild(E("div", { class: "feedback good" }, [E("p", { style: "font-weight:700; margin:0", text: T("trail.helper", { name: ev(h).name }) }), E("p", { style: "margin:0.3rem 0 0", text: ev(h).effect })]));
    }
    if (t === "B") {
      box.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "trail.breathe", "data-decorative": "", "data-h": "5rem" })]));
      box.appendChild(E("p", { text: T("trail.breathe.jar") }));
    }
    box.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-go", onclick: endOfTurn, text: t === "B" ? T("trail.breathe.done") : T("trail.continue") })]));
    frame(box, "h-land");
  }

  function renderLadder() {
    S.render = renderLadder;
    var c = S.lad, t = ev(c), box = E("div");
    box.appendChild(E("h2", { id: "h-land", tabindex: "-1", text: T("trail.land.L") }));
    box.appendChild(E("div", { class: "sortcard", style: "font-size:1.1rem" }, [E("p", { style: "margin:0 0 0.4rem" }, [E("strong", { text: T("trail.ladder.scene") + ": " }), document.createTextNode(t.scenario)]), E("p", { style: "margin:0" }, [E("strong", { text: T("trail.ladder.first") + ": " }), document.createTextNode(t.first)])]));
    box.appendChild(E("p", { style: "font-weight:700", text: T("trail.ladder.q") }));
    if (!S.opts) S.opts = U.shuffle([{ id: "climb", k: "next" }, { id: "stop", k: "stop" }, { id: "hide", k: "hide" }]);
    var g = E("div", { role: "group", "aria-label": T("trail.ladder.q"), style: "display:grid; gap:0.6rem" });
    S.opts.forEach(function (o, i) {
      var label = o.id === "climb" ? t.next : T("trail.ladder." + o.id);
      g.appendChild(E("button", { type: "button", class: "btn", style: "justify-content:flex-start; text-align:left", id: "lo-" + i, disabled: S.ladPick ? "disabled" : null, "aria-pressed": S.ladPick === o.id ? "true" : null, text: label,
        onclick: function () { S.ladPick = o.id; var r = L.completeLadder(G); S.ladRes = r; renderLadder(); HK.focus(document.getElementById("h-lfb")); HK.say(T(o.id === "climb" ? "trail.ladder.good" : "trail.ladder.try")); } }));
    });
    box.appendChild(g);
    if (S.ladPick) {
      var good = S.ladPick === "climb";
      box.appendChild(E("div", { class: "feedback " + (good ? "good" : "try"), role: "region", "aria-labelledby": "h-lfb" }, [
        E("p", { id: "h-lfb", tabindex: "-1", style: "font-weight:700; margin:0", text: T(good ? "trail.ladder.good" : "trail.ladder.try") }),
        E("p", { style: "margin:0.4rem 0 0", text: T("trail.ladder.say") }),
        E("p", { class: "fine", style: "margin:0.3rem 0 0", text: T("trail.ladder.reply") })]));
      if (S.ladRes.wish && !S.wishDone) {
        var wish = E("div", { class: "plate" }, [E("h3", { text: T("trail.wish") })]);
        var row = E("div", { class: "row" });
        ["jar", "skip", "helpers"].forEach(function (w) { row.appendChild(E("button", { type: "button", class: "btn", id: "w-" + w, onclick: function () { var r = L.ladderWish(G, w); S.wishDone = true; S.wishRes = r; if (G.finished) return renderEnd(); renderLadder(); HK.focus(document.getElementById("btn-go")); HK.say(T("trail.wish.done")); }, text: T("trail.wish." + w) })); });
        wish.appendChild(row); box.appendChild(wish);
      } else {
        if (S.wishDone && S.wishRes) {
          box.appendChild(E("p", { class: "promise", text: T("trail.wish.done") }));
          if (S.wishRes.helpers) S.wishRes.helpers.forEach(function (h) { box.appendChild(E("p", { class: "note", text: T("trail.helper", { name: ev(h).name }) + ": " + ev(h).effect })); });
        }
        box.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-go", onclick: function () { S.opts = null; S.wishDone = false; S.wishRes = null; S.ladPick = null; endOfTurn(); }, text: T("trail.continue") })]));
      }
    }
    frame(box);
  }

  /* ---------- end of turn, Gifty ---------- */
  function endOfTurn() {
    var due = L.endTurn(G).giftyDue;
    L.clearDetour(G);
    if (S.giftyFromG || due) { S.giftyFromG = false; return startGifty(); }
    nextEvent(false);
  }

  function startGifty() { S.gift = L.giftyTurn(G); S.cancelled = false; renderGifty(); }
  function renderGifty() {
    S.render = renderGifty;
    var lure = S.gift.lure, t = ev(lure), box = E("div");
    box.appendChild(E("h2", { id: "h-gifty", tabindex: "-1", text: T("trail.gifty") }));
    box.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "trail.gifty", "data-decorative": "", "data-h": "5.5rem" })]));
    box.appendChild(E("p", { class: "sortcard", style: "font-size:1.15rem" }, [E("strong", { text: T("trail.gifty.says") + ": " }), document.createTextNode(t.says)]));
    box.appendChild(E("p", { text: T("trail.gifty.resist") }));
    box.appendChild(E("p", { class: "promise" }, [E("strong", { text: T("trail.gifty.how") + ": " }), document.createTextNode(t.resist)]));
    box.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-coin", onclick: showCoin, text: T("trail.gifty.resisted") })]));
    frame(box, "h-gifty");
  }
  function showCoin() {
    S.render = showCoin;
    var g = S.gift, t = ev(g.lure), box = E("div");
    box.appendChild(E("h2", { id: "h-gifty", tabindex: "-1", text: T("trail.gifty") }));
    box.appendChild(E("p", { class: "sortcard", style: "font-size:1.05rem" }, [E("strong", { text: T("trail.gifty.says") + ": " }), document.createTextNode(t.says)]));
    if (!g.hook) {
      box.appendChild(E("p", { class: "feedback good", role: "status", text: T("trail.coin.star") }));
      box.appendChild(E("p", { text: T("trail.coin.beaten", { t: t.beaten }) }));
      HK.say(T("trail.live.beaten"));
    } else {
      var s = g.slip, lines = [T("trail.coin.hook")];
      if (s.blocked) lines.push(T("trail.slip.blocked"));
      else {
        if (s.free) { lines.push(T("trail.slip.free")); lines.push(T("trail.slip.jar")); }
        else if (s.undone) { lines.push(T("trail.slip.undone")); lines.push(T("trail.slip.jar")); }
        else lines.push(T("trail.slip.detour", { n: s.detour }));
      }
      box.appendChild(E("div", { class: "feedback try", role: "status" }, lines.map(function (x) { return E("p", { style: "margin:0 0 0.3rem", text: x }); })));
      if (s.fixit) box.appendChild(fixitBox(s.fixit));
      if (s.detour && G.rungs > 0 && !S.cancelled) box.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn", id: "btn-cancel", onclick: function () { if (L.cancelDetour(G)) { S.cancelled = true; showCoin(); HK.say(T("trail.cancelled")); } }, text: T("trail.cancel") })]));
      if (S.cancelled) box.appendChild(E("p", { class: "promise", text: T("trail.cancelled") }));
      if (s.storm) {
        box.appendChild(E("div", { class: "plate" }, [E("h3", { text: T("trail.storm") }), E("p", { text: T("trail.storm.b") })]));
      }
      HK.say(T("trail.live.slip", { j: G.jar }));
    }
    box.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-go", onclick: function () { nextEvent(false); }, text: g.hook && g.slip && g.slip.storm ? T("trail.storm.done") : T("trail.continue") })]));
    frame(box, "h-gifty");
  }

  /* ---------- end ---------- */
  function renderEnd() {
    S.step = "end"; S.render = renderEnd;
    var tier = L.tier(G), box = E("div");
    box.appendChild(E("h2", { id: "h-end", tabindex: "-1", text: T("trail.end.h") }));
    box.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "trail.peak", "data-decorative": "", "data-h": "8rem" })]));
    box.appendChild(E("p", { class: "lead", text: T("trail.end.sub") }));
    box.appendChild(E("div", { class: "badge", role: "status" }, [E("span", { class: "big", text: T("trail.tier." + tier) }), E("span", { text: T("trail.tier.b." + tier) + " " + T("trail.ribbons", { n: G.storms }) })]));
    box.appendChild(E("p", { class: "note", text: T("trail.tier.note") }));
    box.appendChild(E("h3", { text: T("trail.bigpause") })); box.appendChild(E("p", { text: T("trail.bigpause.b") }));
    box.appendChild(E("p", { class: "promise", text: T("trail.gifty.final") }));
    box.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", onclick: function () { G = null; S.step = "setup"; renderSetup(); HK.focus(document.getElementById("h-main")); }, text: T("trail.again") }), E("a", { class: "btn", "data-keep": "../index.html", href: HK.href("../index.html"), text: T("trail.lab") })]));
    frame(box, "h-end");
    HK.say(T("trail.end.h") + " " + T("trail.tier." + tier));
  }

  HK.onLang(function () { if (!G || S.step === "setup") return renderSetup(); if (S.render) S.render(); });
  HK.boot();
  renderSetup();
})();
