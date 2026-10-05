/* Secret Code Lab screen. Choices only (no free typing). No storage, no network. */
(function () {
  "use strict";
  var C = window.CipherLogic, U = window.HKUtil;
  var T = HK.t, E = HK.el;
  var APP = document.getElementById("app");
  var AZ = C.AZ;

  var st = {
    tab: "wheel", key: 3, mode: "enc", sentence: 0, chips: [],
    mixedKey: C.GUIDE_KEY, mixedOwn: false,
    solved: {}, cur: 0, tries: {}, guess: {}, hints: 0, shiftKey: 0, lastMsg: ""
  };

  function sentences() { return C.SENTENCES[HK.lang]; }
  function message() { return st.chips.length ? st.chips.join(" ") : sentences()[st.sentence]; }
  function puzzles() { return C.PUZZLES[HK.lang]; }

  /* ---------- wheel svg ---------- */
  function wheelSvg(key) {
    var step = 360 / 26, NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 300 300");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", T("secret.wheelAlt", { n: key }));
    function circle(r, fill, sw) { var c = document.createElementNS(NS, "circle"); c.setAttribute("cx", 150); c.setAttribute("cy", 150); c.setAttribute("r", r); c.setAttribute("fill", fill); c.setAttribute("stroke", "currentColor"); c.setAttribute("stroke-width", sw); return c; }
    svg.style.color = "var(--ink)";
    svg.appendChild(circle(146, "var(--wash)", 3));
    svg.appendChild(circle(112, "#FFFFFF", 3));
    svg.appendChild(circle(72, "var(--paper)", 3));
    function ring(r, rotate, big) {
      var g = document.createElementNS(NS, "g");
      g.setAttribute("transform", "rotate(" + rotate + " 150 150)");
      for (var i = 0; i < 26; i++) {
        var t = document.createElementNS(NS, "text");
        t.setAttribute("x", 150); t.setAttribute("y", 150 - r);
        t.setAttribute("text-anchor", "middle"); t.setAttribute("dominant-baseline", "middle");
        t.setAttribute("transform", "rotate(" + (i * step) + " 150 150)");
        t.setAttribute("font-family", "Courier New, monospace"); t.setAttribute("font-weight", "700");
        t.setAttribute("font-size", big ? 17 : 15);
        t.setAttribute("fill", big ? "var(--ink)" : "#2B2D42");
        t.textContent = AZ.charAt(i);
        g.appendChild(t);
      }
      return g;
    }
    svg.appendChild(ring(129, 0, true));
    svg.appendChild(ring(92, -key * step, false));
    var tick = document.createElementNS(NS, "path");
    tick.setAttribute("d", "M150 2 L142 -8 L158 -8 Z"); tick.setAttribute("fill", "#FF8A3D"); tick.setAttribute("stroke", "currentColor");
    tick.setAttribute("transform", "translate(0 12)");
    svg.appendChild(tick);
    var lab1 = document.createElementNS(NS, "text"); lab1.setAttribute("x", 150); lab1.setAttribute("y", 148); lab1.setAttribute("text-anchor", "middle"); lab1.setAttribute("font-size", 11); lab1.setAttribute("fill", "var(--ink)"); lab1.textContent = T("secret.outer") + " / " + T("secret.inner");
    svg.appendChild(lab1);
    var lab2 = document.createElementNS(NS, "text"); lab2.setAttribute("x", 150); lab2.setAttribute("y", 166); lab2.setAttribute("text-anchor", "middle"); lab2.setAttribute("font-size", 14); lab2.setAttribute("font-weight", "700"); lab2.setAttribute("fill", "var(--ink)"); lab2.textContent = T("secret.key", { n: key });
    svg.appendChild(lab2);
    return svg;
  }

  function mapTable(fn, title) {
    var d = E("details", { class: "plate plain" }, [E("summary", { text: title })]);
    d.appendChild(E("p", { class: "fine", text: T("secret.mapSub") }));
    var tw = E("div", { class: "tablewrap" }), tb = E("table");
    var r1 = E("tr", null, [E("th", { scope: "row", text: T("secret.mapPlain") })]), r2 = E("tr", null, [E("th", { scope: "row", text: T("secret.mapCode") })]);
    for (var i = 0; i < 26; i++) { r1.appendChild(E("td", { class: "mono", style: "padding:0.2rem", text: AZ.charAt(i) })); r2.appendChild(E("td", { class: "mono", style: "padding:0.2rem", text: fn(AZ.charAt(i)) })); }
    tb.appendChild(E("tbody", null, [r1, r2])); tw.appendChild(tb); d.appendChild(tw);
    return d;
  }

  /* ---------- message picker (choices only) ---------- */
  function picker(onChange) {
    var box = E("div");
    var sel = E("select", { id: "sel-msg", onchange: function (e) { st.sentence = parseInt(e.target.value, 10); st.chips = []; onChange(); } });
    sentences().forEach(function (s, i) { var o = E("option", { value: String(i), text: s }); if (i === st.sentence) o.selected = true; sel.appendChild(o); });
    box.appendChild(E("p", { class: "row" }, [E("label", { for: "sel-msg", text: T("secret.msg") }), sel]));
    box.appendChild(E("p", { class: "fine", style: "margin:0", text: T("secret.msgOr") }));
    var chips = E("div", { class: "chips", role: "group", "aria-label": T("secret.msgOr") });
    C.CHIPS[HK.lang].forEach(function (w) {
      chips.appendChild(E("button", { type: "button", class: "chip", onclick: function () { if (st.chips.length < 6) st.chips.push(w); onChange(); var el = document.querySelector(".chips .chip[data-w='" + w + "']"); if (el) el.focus(); }, "data-w": w, text: w }));
    });
    box.appendChild(chips);
    box.appendChild(E("p", { class: "row" }, [
      E("span", { text: st.chips.length ? T("secret.built", { t: st.chips.join(" ") }) : T("secret.builtNone") }),
      E("button", { type: "button", class: "btn small", onclick: function () { st.chips = []; onChange(); }, text: T("secret.clear") })
    ]));
    return box;
  }

  /* ---------- tabs ---------- */
  function tabs() {
    var bar = E("div", { class: "tabs", role: "tablist", "aria-label": T("secret.title") });
    ["wheel", "mixed", "crack"].forEach(function (k) {
      bar.appendChild(E("button", { type: "button", role: "tab", id: "tab-" + k, "aria-selected": st.tab === k ? "true" : "false", "aria-controls": "panel", tabindex: st.tab === k ? "0" : "-1",
        onclick: function () { st.tab = k; build(); document.getElementById("tab-" + k).focus(); },
        onkeydown: function (e) {
          var order = ["wheel", "mixed", "crack"], i = order.indexOf(st.tab);
          if (e.key === "ArrowRight") { st.tab = order[(i + 1) % 3]; build(); document.getElementById("tab-" + st.tab).focus(); }
          if (e.key === "ArrowLeft") { st.tab = order[(i + 2) % 3]; build(); document.getElementById("tab-" + st.tab).focus(); }
        }, text: T("secret.tab." + k) }));
    });
    return bar;
  }

  /* ---------- wheel panel ---------- */
  function wheelPanel() {
    var p = E("div");
    p.appendChild(E("h2", { text: T("secret.wheel.h") }));
    p.appendChild(E("p", { text: T("secret.wheel.b") }));
    var box = E("div", { class: "wheelbox" });
    var svgHost = E("div", { id: "wheel-host", style: "flex:1 1 16rem; max-width:24rem" });
    svgHost.appendChild(wheelSvg(st.key));
    var ctl = E("div", { style: "flex:1 1 16rem" });
    var out = E("output", { for: "key-r", id: "key-out", style: "font-weight:700", text: String(st.key) });
    var rng = E("input", { type: "range", id: "key-r", min: "0", max: "25", value: String(st.key), oninput: function (e) { setKey(parseInt(e.target.value, 10)); } });
    ctl.appendChild(E("p", { class: "row" }, [E("label", { for: "key-r", text: T("secret.keyLabel") }), rng, out]));
    ctl.appendChild(E("div", { class: "row" }, [
      E("button", { type: "button", class: "btn small", onclick: function () { setKey((st.key + 25) % 26, true); }, text: "◀ " + T("secret.left") }),
      E("button", { type: "button", class: "btn small", onclick: function () { setKey((st.key + 1) % 26, true); }, text: T("secret.right") + " ▶" })
    ]));
    var fs = E("fieldset", null, [E("legend", { text: T("secret.mode") })]);
    [["enc", "secret.mode.enc"], ["dec", "secret.mode.dec"]].forEach(function (m) {
      var id = "m-" + m[0], inp = E("input", { type: "radio", name: "mode", id: id, onchange: function () { st.mode = m[0]; renderWheelOut(); } });
      inp.checked = st.mode === m[0];
      fs.appendChild(E("label", { class: "opt", for: id }, [inp, E("span", { text: T(m[1]) })]));
    });
    ctl.appendChild(fs);
    box.appendChild(svgHost); box.appendChild(ctl);
    p.appendChild(box);
    p.appendChild(picker(function () { build(); }));
    p.appendChild(E("div", { id: "wheel-out" }));
    p.appendChild(E("div", { id: "wheel-map" }));
    p.appendChild(E("p", { class: "note", text: T("secret.tiny") }));
    return p;
  }
  function setKey(k, focusRange) {
    st.key = k;
    var r = document.getElementById("key-r"); if (r) r.value = String(k);
    var o = document.getElementById("key-out"); if (o) o.textContent = String(k);
    var h = document.getElementById("wheel-host"); if (h) { h.textContent = ""; h.appendChild(wheelSvg(k)); }
    renderWheelOut();
    HK.say(T("secret.live.key", { n: k }) + " " + T("secret.live.out", { t: wheelResult() }));
  }
  function wheelResult() { var m = message(); return st.mode === "enc" ? C.shiftEncode(m, st.key) : C.shiftDecode(m, st.key); }
  function renderWheelOut() {
    var host = document.getElementById("wheel-out"); if (!host) return;
    host.textContent = "";
    host.appendChild(E("p", { class: "fine", style: "margin:0", text: T("secret.in") }));
    host.appendChild(E("div", { class: "cipher", text: message() }));
    host.appendChild(E("p", { class: "fine", style: "margin:0", text: T("secret.out") }));
    host.appendChild(E("div", { class: "cipher", text: wheelResult() }));
    var m = document.getElementById("wheel-map"); m.textContent = "";
    m.appendChild(mapTable(function (c) { return C.shiftEncode(c, st.key); }, T("secret.map", { n: st.key })));
  }

  /* ---------- mixed panel ---------- */
  function mixedPanel() {
    var p = E("div");
    p.appendChild(E("h2", { text: T("secret.mixed.h") }));
    p.appendChild(E("p", { text: T("secret.mixed.b") }));
    p.appendChild(E("div", { class: "row" }, [
      E("button", { type: "button", class: "btn", onclick: function () { st.mixedKey = C.GUIDE_KEY; build(); }, text: T("secret.mixed.guide") }),
      E("button", { type: "button", class: "btn", onclick: function () { st.mixedKey = C.randomKey(); build(); }, text: T("secret.mixed.own") })
    ]));
    p.appendChild(keyTable(st.mixedKey));
    var fs = E("fieldset", null, [E("legend", { text: T("secret.mode") })]);
    [["enc", "secret.mode.enc"], ["dec", "secret.mode.dec"]].forEach(function (m) {
      var id = "mm-" + m[0], inp = E("input", { type: "radio", name: "mmode", id: id, onchange: function () { st.mode = m[0]; renderMixedOut(); } });
      inp.checked = st.mode === m[0];
      fs.appendChild(E("label", { class: "opt", for: id }, [inp, E("span", { text: T(m[1]) })]));
    });
    p.appendChild(fs);
    p.appendChild(picker(function () { build(); }));
    p.appendChild(E("div", { id: "mixed-out" }));
    p.appendChild(E("p", { class: "promise", text: T("secret.mixed.share") }));
    p.appendChild(E("p", { class: "fine", text: T("secret.mixed.count") }));
    return p;
  }
  function keyTable(key) {
    var tw = E("div", { class: "tablewrap" }), tb = E("table");
    tb.appendChild(E("caption", { class: "sr-only", text: T("secret.mixed.keyRow") }));
    var r1 = E("tr", null, [E("th", { scope: "row", text: T("secret.mapPlain") })]), r2 = E("tr", null, [E("th", { scope: "row", text: T("secret.mapCode") })]);
    for (var i = 0; i < 26; i++) { r1.appendChild(E("td", { class: "mono", style: "padding:0.2rem", text: AZ.charAt(i) })); r2.appendChild(E("td", { class: "mono", style: "padding:0.2rem; border-bottom:3px solid var(--ink)", text: key.charAt(i) })); }
    tb.appendChild(E("tbody", null, [r1, r2])); tw.appendChild(tb);
    return tw;
  }
  function renderMixedOut() {
    var host = document.getElementById("mixed-out"); if (!host) return;
    host.textContent = "";
    var m = message(), r = st.mode === "enc" ? C.mixedEncode(m, st.mixedKey) : C.mixedDecode(m, st.mixedKey);
    host.appendChild(E("p", { class: "fine", style: "margin:0", text: T("secret.in") }));
    host.appendChild(E("div", { class: "cipher", text: m }));
    host.appendChild(E("p", { class: "fine", style: "margin:0", text: T("secret.out") }));
    host.appendChild(E("div", { class: "cipher", text: r }));
  }

  /* ---------- crack panel ---------- */
  function crackPanel() {
    var p = E("div"), list = puzzles();
    p.appendChild(E("h2", { text: T("secret.crack.h") }));
    p.appendChild(E("p", { text: T("secret.crack.b") }));
    var nav = E("div", { class: "chips", role: "group", "aria-label": T("secret.crack.h") });
    list.forEach(function (pz, i) {
      nav.appendChild(E("button", { type: "button", class: "chip", "aria-pressed": st.cur === i ? "true" : "false", onclick: function () { selectPuzzle(i); },
        text: T("secret.puzzle", { n: i + 1, total: list.length }) + (st.solved[pz.id] ? " (" + T("secret.solved") + ")" : "") }));
    });
    p.appendChild(nav);
    var done = list.every(function (z) { return st.solved[z.id]; });
    if (done) p.appendChild(E("div", { class: "badge", role: "status" }, [E("span", { class: "big", text: T("secret.badge") }), E("span", { text: T("secret.allDone") })]));
    p.appendChild(E("div", { id: "puzzle" }));
    return p;
  }
  function selectPuzzle(i) { st.cur = i; st.tries = {}; st.guess = {}; st.hints = 0; st.shiftKey = 0; build(); HK.focus(document.getElementById("h-puzzle")); }

  function renderPuzzle() {
    var host = document.getElementById("puzzle"); if (!host) return;
    host.textContent = "";
    var pz = puzzles()[st.cur], cipher = C.cipherOf(pz), isDone = !!st.solved[pz.id];
    host.appendChild(E("h3", { id: "h-puzzle", tabindex: "-1", text: T("secret.puzzle", { n: st.cur + 1, total: puzzles().length }) + (isDone ? " (" + T("secret.solved") + ")" : "") }));
    host.appendChild(E("p", { class: "fine", style: "margin:0", text: T("secret.cipherIs") }));
    host.appendChild(E("div", { class: "cipher", text: cipher }));
    if (pz.type === "shift") {
      if (pz.hintKey) host.appendChild(E("p", { text: T("secret.hintKey", { k: pz.key }) }));
      host.appendChild(E("p", { class: "fine", text: T("secret.try.shift") }));
      var lab = E("label", { for: "ck", id: "ck-lab" }), out = E("output", { for: "ck", id: "ck-out", style: "font-weight:700" });
      var rng = E("input", { type: "range", id: "ck", min: "0", max: "25", value: String(st.shiftKey), oninput: function (e) { st.shiftKey = parseInt(e.target.value, 10); st.tries[st.shiftKey] = true; updShift(pz, cipher); } });
      host.appendChild(E("p", { class: "row" }, [lab, rng, out]));
      host.appendChild(E("div", { class: "wheelbox", id: "ck-wheel", style: "max-width:18rem" }));
      host.appendChild(E("p", { class: "fine", style: "margin:0", text: T("secret.checking") }));
      host.appendChild(E("div", { class: "cipher", id: "ck-text" }));
      host.appendChild(E("p", { id: "ck-tries", class: "fine" }));
      host.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "ck-go", text: T("secret.read"), onclick: function () {
        if (C.shiftDecode(cipher, st.shiftKey) === pz.plain) win(pz, cipher); else feedback(T("secret.again"));
      } })]));
      host.appendChild(E("div", { id: "fb", role: "status" }));
      updShift(pz, cipher, true);
    } else {
      host.appendChild(E("p", { text: pz.keyShown ? T("secret.keyShown") : T(HK.lang === "es" ? "secret.keyHiddenEs" : "secret.keyHidden") }));
      if (pz.keyShown) host.appendChild(keyTable(pz.key));
      var letters = C.distinctLetters(cipher), freq = C.frequencies(cipher);
      host.appendChild(E("p", { class: "fine", text: T("secret.freq") + ": " + freq.map(function (f) { return f.letter + " " + f.count; }).join(", ") }));
      var grid = E("div", { class: "row", style: "align-items:flex-start" });
      letters.forEach(function (L) {
        var sel = E("select", { id: "g-" + L, "aria-label": T("secret.assign", { c: L }), onchange: function (e) { st.guess[L] = e.target.value || undefined; updMixed(pz, cipher); } });
        sel.appendChild(E("option", { value: "", text: L + " = " + T("secret.blank") }));
        AZ.split("").forEach(function (a) { var o = E("option", { value: a, text: L + " = " + a }); if (st.guess[L] === a) o.selected = true; sel.appendChild(o); });
        grid.appendChild(sel);
      });
      host.appendChild(grid);
      if (!pz.keyShown) host.appendChild(E("p", { class: "row" }, [E("button", { type: "button", class: "btn small", onclick: function () {
        var un = letters.filter(function (L) { return st.guess[L] !== AZ.charAt(pz.key.indexOf(L)); });
        if (un.length) { var L = un[U.randInt(un.length)]; st.guess[L] = AZ.charAt(pz.key.indexOf(L)); st.hints++; renderPuzzle(); }
      }, text: T("secret.hintBtn") }), E("span", { class: "fine", text: T("secret.hintUsed", { n: st.hints }) })]));
      host.appendChild(E("p", { class: "fine", style: "margin:0", text: T("secret.checking") }));
      host.appendChild(E("div", { class: "cipher", id: "mx-text" }));
      host.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "mx-go", text: T("secret.read"), onclick: function () {
        if (C.applyGuess(cipher, st.guess) === pz.plain) win(pz, cipher); else feedback(T("secret.again.mixed"));
      } })]));
      host.appendChild(E("div", { id: "fb", role: "status" }));
      updMixed(pz, cipher);
    }
    if (isDone) showDone(pz, cipher);
  }
  function updShift(pz, cipher, first) {
    document.getElementById("ck-lab").textContent = T("secret.keyLabel");
    document.getElementById("ck-out").textContent = String(st.shiftKey);
    document.getElementById("ck-text").textContent = C.shiftDecode(cipher, st.shiftKey);
    var w = document.getElementById("ck-wheel"); w.textContent = ""; w.appendChild(wheelSvg(st.shiftKey));
    document.getElementById("ck-tries").textContent = T("secret.tries", { n: Object.keys(st.tries).length });
  }
  function updMixed(pz, cipher) { document.getElementById("mx-text").textContent = C.applyGuess(cipher, st.guess); }
  function feedback(msg) { var fb = document.getElementById("fb"); fb.textContent = ""; fb.appendChild(E("p", { class: "feedback try", text: msg })); }
  function win(pz, cipher) {
    st.solved[pz.id] = true;
    build();
    HK.say(T("secret.good", { m: pz.plain }));
    HK.focus(document.getElementById("h-puzzle"));
  }
  function showDone(pz, cipher) {
    var fb = document.getElementById("fb");
    var box = E("div", { class: "feedback good" }, [E("div", { class: "head" }, [E("span", { "data-art": "secret.done", "data-decorative": "", "data-h": "2.6rem" }), E("span", { text: T("secret.good", { m: pz.plain }) })])]);
    if (pz.type === "shift") {
      box.appendChild(E("h4", { text: T("secret.brute") })); box.appendChild(E("p", { class: "fine", text: T("secret.bruteSub") }));
      var tb = E("table"), body = E("tbody");
      C.allShifts(cipher).forEach(function (r) { body.appendChild(E("tr", { class: r.key === pz.key ? "sel" : "" }, [E("th", { scope: "row", text: String(r.key) }), E("td", { class: "mono", text: r.text })])); });
      tb.appendChild(body); box.appendChild(E("div", { class: "tablewrap" }, [tb]));
    }
    var last = st.cur < puzzles().length - 1;
    if (last) box.appendChild(E("button", { type: "button", class: "btn primary", onclick: function () { selectPuzzle(st.cur + 1); }, text: T("secret.next") }));
    box.appendChild(E("p", { class: "promise", text: T("secret.safety") }));
    (fb || document.getElementById("puzzle")).appendChild(box);
    HK.refreshArt();
  }

  /* ---------- page ---------- */
  function build() {
    var f = document.activeElement && document.activeElement.id;
    APP.textContent = "";
    APP.appendChild(E("p", { class: "kicker", text: T("secret.kicker") }));
    APP.appendChild(E("h1", { id: "h-main", tabindex: "-1", text: T("secret.title") }));
    APP.appendChild(E("span", { class: "tick", "aria-hidden": "true" }));
    APP.appendChild(E("p", { class: "lead", text: T("secret.lead") }));
    APP.appendChild(E("div", { class: "note" }, [E("span", { class: "label", text: T("secret.vocab") }), E("ul", { style: "margin:0" }, ["secret.v.cipher", "secret.v.key", "secret.v.plain"].map(function (k) { return E("li", { text: T(k) }); }))]));
    APP.appendChild(tabs());
    var panel = E("div", { id: "panel", role: "tabpanel", "aria-labelledby": "tab-" + st.tab, class: "plate plain", style: "margin-top:0; border-top:0" });
    panel.appendChild(st.tab === "wheel" ? wheelPanel() : st.tab === "mixed" ? mixedPanel() : crackPanel());
    APP.appendChild(panel);
    APP.appendChild(E("div", { class: "row" }, [E("a", { class: "btn", "data-keep": "../index.html", href: HK.href("../index.html"), text: T("secret.lab") })]));
    if (st.tab === "wheel") renderWheelOut(); else if (st.tab === "mixed") renderMixedOut(); else renderPuzzle();
    HK.refreshArt();
    if (f) { var el = document.getElementById(f); if (el) el.focus(); }
  }

  HK.onLang(function () { st.sentence = Math.min(st.sentence, sentences().length - 1); st.chips = []; st.cur = 0; st.tries = {}; st.guess = {}; st.hints = 0; st.solved = {}; build(); });
  HK.boot();
  build();
})();
