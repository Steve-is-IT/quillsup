/* Hackles or Not? screen. Choices only. No storage, no network. */
(function () {
  "use strict";
  var DATA = window.HK_DATA.ornot, LAD = window.HK_DATA.trail.ladders, L = window.OrNotLogic;
  var T = HK.t, E = HK.el;
  var APP = document.getElementById("app");
  var TOTAL = 8;
  var S = { tab: "gut", phase: "intro", cards: [], i: 0, answer: null, moves: [], shown: false, lad: { phase: "intro", cards: [], i: 0, picked: null, opts: [] } };

  function head() {
    var h = E("div");
    h.appendChild(E("p", { class: "kicker", text: T("ornot.kicker") }));
    h.appendChild(E("h1", { id: "h-main", tabindex: "-1", text: T("ornot.title") }));
    h.appendChild(E("span", { class: "tick", "aria-hidden": "true" }));
    return h;
  }
  function tabs() {
    var bar = E("div", { class: "tabs", role: "tablist" });
    ["gut", "ladder"].forEach(function (k) {
      bar.appendChild(E("button", { type: "button", role: "tab", id: "tab-" + k, "aria-selected": S.tab === k ? "true" : "false", "aria-controls": "panel", tabindex: S.tab === k ? "0" : "-1",
        onclick: function () { S.tab = k; render(); document.getElementById("tab-" + k).focus(); },
        onkeydown: function (e) { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { S.tab = S.tab === "gut" ? "ladder" : "gut"; render(); document.getElementById("tab-" + S.tab).focus(); } },
        text: T("ornot.tab." + k) }));
    });
    return bar;
  }

  function movesBox() {
    var box = E("div", { class: "note" }, [E("span", { class: "label", text: T("ornot.moves.h") })]);
    ["pause", "check", "tell"].forEach(function (m) { box.appendChild(E("p", { style: "margin:0 0 0.3rem" }, [E("strong", { text: T("ornot.m." + m) + ": " }), document.createTextNode(T("ornot.m." + m + ".d"))])); });
    return box;
  }

  /* ---------- gut check ---------- */
  function gut() {
    var p = E("div");
    if (S.phase === "intro") {
      p.appendChild(E("p", { class: "lead", text: T("ornot.lead") }));
      p.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "ornot.hero", "data-decorative": "", "data-h": "6rem" })]));
      p.appendChild(movesBox());
      p.appendChild(E("p", { class: "promise", text: T("common.promise") }));
      p.appendChild(E("button", { type: "button", class: "btn primary", id: "btn-start", onclick: startGut, text: T("ornot.start") }));
      return p;
    }
    if (S.phase === "end") {
      p.appendChild(E("h2", { id: "h-end", tabindex: "-1", text: T("ornot.end.h") }));
      p.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "ornot.good", "data-decorative": "", "data-h": "6rem" })]));
      p.appendChild(E("p", { class: "lead", text: T("ornot.end.b", { n: TOTAL }) }));
      p.appendChild(E("p", { class: "promise", text: T("ornot.end.k") }));
      p.appendChild(E("div", { class: "row" }, [
        E("button", { type: "button", class: "btn primary", onclick: startGut, text: T("ornot.again") }),
        E("button", { type: "button", class: "btn", onclick: function () { S.tab = "ladder"; render(); HK.focus(document.getElementById("h-lad")); }, text: T("ornot.ladder") }),
        E("a", { class: "btn", "data-keep": "../index.html", href: HK.href("../index.html"), text: T("ornot.lab") })
      ]));
      return p;
    }
    var c = S.cards[S.i], t = c[HK.lang];
    p.appendChild(E("h2", { id: "h-card", tabindex: "-1", style: "font-size:1.2rem", text: T("ornot.card", { n: S.i + 1, total: TOTAL }) }));
    p.appendChild(E("div", { class: "sortcard" }, [E("span", { text: t.text })]));
    var answered = S.answer !== null;
    var q = E("div", { class: "buckets", role: "group", "aria-label": T("ornot.q") });
    [["up", "ornot.up", "ornot.up.d"], ["down", "ornot.down", "ornot.down.d"], ["unsure", "ornot.unsure", "ornot.unsure.d"]].forEach(function (a) {
      var b = E("button", { type: "button", class: "bucket " + (a[0] === "up" ? "fishy" : a[0] === "down" ? "real" : "pause"), "aria-pressed": answered ? (S.answer === a[0] ? "true" : "false") : null, disabled: answered ? "disabled" : null, onclick: function () { S.answer = a[0]; render(); HK.focus(document.getElementById("h-after")); HK.say(T("ornot.r." + L.hacklesReply(c, a[0]))); } });
      b.innerHTML = (a[0] === "up" ? '<svg class="shape" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4L40 26L60 20L46 36L60 52L38 46L32 62L26 46L4 52L18 36L4 20L24 26Z" fill="#FF8A3D" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>'
        : a[0] === "down" ? '<svg class="shape" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 40Q32 56 56 40" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="28" r="18" fill="#FFC93C" stroke="currentColor" stroke-width="3"/></svg>'
        : '<svg class="shape" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="#8FD0F0" stroke="currentColor" stroke-width="3"/><text x="32" y="44" text-anchor="middle" font-size="36" font-weight="700" fill="currentColor">?</text></svg>');
      b.appendChild(E("span", { class: "word", text: T(a[1]) })); b.appendChild(E("span", { class: "what", text: T(a[2]) }));
      if (answered && S.answer === a[0]) b.appendChild(E("span", { class: "what", style: "font-weight:700", text: "(" + T("ornot.chosen") + ")" }));
      q.appendChild(b);
    });
    p.appendChild(E("p", { class: "fine", id: "q-label", text: T("ornot.q") }));
    p.appendChild(q);
    if (answered) {
      var fb = E("div", { class: "feedback good", role: "region", "aria-labelledby": "h-after" });
      fb.appendChild(E("div", { class: "head" }, [E("span", { id: "h-after", tabindex: "-1", text: T("ornot.kit", { v: T("ornot.v." + c.hackles) }) })]));
      fb.appendChild(E("p", { text: T("ornot.r." + L.hacklesReply(c, S.answer)) }));
      fb.appendChild(E("p", { text: T("ornot.why") + ": " + t.why }));
      p.appendChild(fb);
      p.appendChild(E("p", { style: "font-weight:700; margin-bottom:0.3rem", text: T("ornot.pick") }));
      var chips = E("div", { class: "chips", role: "group", "aria-label": T("ornot.pick") });
      ["pause", "check", "tell"].forEach(function (m) {
        chips.appendChild(E("button", { type: "button", class: "chip", id: "mv-" + m, "aria-pressed": S.moves.indexOf(m) >= 0 ? "true" : "false", disabled: S.shown ? "disabled" : null,
          onclick: function () { var k = S.moves.indexOf(m); if (k >= 0) S.moves.splice(k, 1); else S.moves.push(m); render(); document.getElementById("mv-" + m).focus(); }, text: T("ornot.m." + m) }));
      });
      p.appendChild(chips);
      if (!S.shown) p.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-show", onclick: function () { S.shown = true; render(); HK.focus(document.getElementById("h-rec")); var cmp = L.compareMoves(S.moves, c.moves); HK.say(T("ornot.rec") + ": " + (c.moves.length ? c.moves.map(function (m) { return T("ornot.m." + m); }).join(", ") : T("ornot.recNone")) + ". " + cmpText(cmp, c)); }, text: T("ornot.show") })]));
      else {
        var cmp = L.compareMoves(S.moves, c.moves);
        var rec = E("div", { class: "feedback good", role: "region", "aria-labelledby": "h-rec" });
        rec.appendChild(E("div", { class: "head" }, [E("span", { id: "h-rec", tabindex: "-1", text: T("ornot.rec") })]));
        if (c.moves.length) rec.appendChild(E("ul", null, c.moves.map(function (m) { return E("li", { text: T("ornot.m." + m) + (S.moves.indexOf(m) >= 0 ? " ✓ (" + T("ornot.chosen") + ")" : "") }); })));
        else rec.appendChild(E("p", { text: T("ornot.recNone") }));
        rec.appendChild(E("p", { style: "font-weight:700", text: cmpText(cmp, c) }));
        rec.appendChild(E("p", { text: T("ornot.how") + ": " + t.check }));
        p.appendChild(rec);
        var last = S.i === TOTAL - 1;
        p.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-next", onclick: nextGut, text: T(last ? "ornot.finish" : "ornot.next") })]));
      }
    }
    return p;
  }
  function cmpText(cmp, c) {
    if (!c.moves.length) return T(S.moves.length ? "ornot.cmp.noneNeededExtra" : "ornot.cmp.noneNeeded");
    if (cmp.status === "exact") return T("ornot.cmp.exact");
    if (cmp.status === "extra") return T("ornot.cmp.extra");
    if (cmp.status === "partial") return T("ornot.cmp.partial", { m: cmp.missing.map(function (m) { return T("ornot.m." + m); }).join(", ") });
    return T("ornot.cmp.none");
  }
  function startGut() { S.cards = L.order(DATA).slice(0, TOTAL); S.i = 0; S.answer = null; S.moves = []; S.shown = false; S.phase = "play"; render(); HK.focus(document.getElementById("h-card")); HK.say(T("ornot.live.card", { n: 1, total: TOTAL, t: S.cards[0][HK.lang].text })); }
  function nextGut() {
    if (S.i >= TOTAL - 1) { S.phase = "end"; render(); HK.focus(document.getElementById("h-end")); return; }
    S.i++; S.answer = null; S.moves = []; S.shown = false; render(); HK.focus(document.getElementById("h-card"));
    HK.say(T("ornot.live.card", { n: S.i + 1, total: TOTAL, t: S.cards[S.i][HK.lang].text }));
  }

  /* ---------- ladder practice ---------- */
  function ladder() {
    var p = E("div"), l = S.lad;
    p.appendChild(E("h2", { id: "h-lad", tabindex: "-1", text: T("ornot.lad.h") }));
    if (l.phase === "intro") {
      p.appendChild(E("p", { text: T("ornot.lad.b") }));
      p.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "ornot.ladder", "data-decorative": "", "data-h": "6rem" })]));
      p.appendChild(E("h3", { text: T("ornot.lad.rungs") }));
      p.appendChild(E("ol", { class: "ladder" }, [1, 2, 3, 4].map(function (n) { return E("li", null, [E("span", { class: "n", text: String(n) }), E("span", { text: T("ornot.lad.r" + n) })]); })));
      p.appendChild(E("button", { type: "button", class: "btn primary", id: "btn-lstart", onclick: startLad, text: T("ornot.lad.start") }));
      return p;
    }
    if (l.phase === "end") {
      p.appendChild(E("p", { class: "promise", text: T("ornot.lad.done") }));
      p.appendChild(E("p", { text: T("ornot.lad.reply") }));
      p.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", onclick: startLad, text: T("ornot.again") }), E("a", { class: "btn", "data-keep": "../index.html", href: HK.href("../index.html"), text: T("ornot.lab") })]));
      return p;
    }
    var c = l.cards[l.i], t = c[HK.lang];
    p.appendChild(E("h3", { style: "font-size:1.1rem", text: T("ornot.lad.card", { n: l.i + 1, total: l.cards.length }) }));
    p.appendChild(E("div", { class: "sortcard", style: "font-size:1.1rem" }, [E("p", { style: "margin:0 0 0.4rem" }, [E("strong", { text: T("ornot.lad.scene") + ": " }), document.createTextNode(t.scenario)]), E("p", { style: "margin:0" }, [E("strong", { text: T("ornot.lad.first") + ": " }), document.createTextNode(t.first)])]));
    p.appendChild(E("p", { style: "font-weight:700", text: T("ornot.lad.q") }));
    var g = E("div", { role: "group", "aria-label": T("ornot.lad.q"), style: "display:grid; gap:0.6rem" });
    l.opts.forEach(function (o, k) {
      g.appendChild(E("button", { type: "button", class: "btn", style: "justify-content:flex-start; text-align:left", id: "lo-" + k, "aria-pressed": l.picked === o.id ? "true" : null, disabled: l.picked ? "disabled" : null,
        onclick: function () { l.picked = o.id; render(); HK.focus(document.getElementById("h-lfb")); HK.say(T(L.ladderCheck(o.id) ? "ornot.lad.good" : "ornot.lad.try")); }, text: o.text }));
    });
    p.appendChild(g);
    if (l.picked) {
      var good = L.ladderCheck(l.picked);
      var fb = E("div", { class: "feedback " + (good ? "good" : "try"), role: "region", "aria-labelledby": "h-lfb" });
      fb.appendChild(E("div", { class: "head" }, [E("span", { id: "h-lfb", tabindex: "-1", text: T(good ? "ornot.lad.good" : "ornot.lad.try") })]));
      fb.appendChild(E("p", { style: "margin:0 0 0.3rem", text: T("ornot.lad.say") }));
      fb.appendChild(E("ul", null, [1, 2, 3].map(function (n) { return E("li", { text: "\"" + T("ornot.lad.s" + n) + "\"" }); })));
      fb.appendChild(E("p", { class: "fine", text: T("ornot.lad.reply") }));
      p.appendChild(fb);
      var last = l.i === l.cards.length - 1;
      p.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-lnext", onclick: function () { if (last) { l.phase = "end"; } else { l.i++; l.picked = null; l.opts = L.ladderOptions(l.cards[l.i], HK.lang); } render(); HK.focus(document.getElementById("h-lad")); }, text: last ? T("ornot.finish") : T("ornot.lad.nextq") })]));
    }
    return p;
  }
  function startLad() { var l = S.lad; l.cards = L.order(LAD).slice(0, 5); l.i = 0; l.picked = null; l.opts = L.ladderOptions(l.cards[0], HK.lang); l.phase = "play"; render(); HK.focus(document.getElementById("h-lad")); }

  function render() {
    APP.textContent = "";
    APP.appendChild(head());
    APP.appendChild(tabs());
    var panel = E("div", { id: "panel", role: "tabpanel", "aria-labelledby": "tab-" + S.tab, class: "plate plain", style: "margin-top:0; border-top:0" });
    panel.appendChild(S.tab === "gut" ? gut() : ladder());
    APP.appendChild(panel);
    HK.refreshArt();
  }
  HK.onLang(function () { if (S.lad.phase === "play") S.lad.opts = L.ladderOptions(S.lad.cards[S.lad.i], HK.lang); render(); });
  HK.boot();
  render();
})();
