/* Passphrase Lab screen. Dice rolls and word pickers only. No text fields. No storage, no network. */
(function () {
  "use strict";
  var P = window.PassLogic, U = window.HKUtil;
  var T = HK.t, E = HK.el;
  var APP = document.getElementById("app");

  var state = {
    A: { kind: "rw", count: 4, alphabet: "keyboard", rolled: null },
    B: { kind: "ch", count: 8, alphabet: "keyboard", rolled: null },
    vault: 6
  };

  function words() { return window.PP_WORDS[HK.lang]; }

  /* A secret's description for the logic: kind rw/cw are dice words, ch is characters. */
  function spec(s) {
    if (s.kind === "ch") return { kind: "chars", alphabet: s.alphabet, count: s.count };
    return { kind: "words", list: s.kind === "cw" ? "classroom" : "real", count: s.count };
  }
  function space(s) { return P.secretSpace(spec(s)); }

  /* ----- formatting ----- */
  function num(v) {
    if (v === null || v === undefined) return "";
    if (Math.floor(v) === v) return U.commas(v);
    return String(v);
  }
  function fmtTime(sec) {
    var d = P.duration(sec);
    if (d.unit === "instant") return T("pp.t.instant");
    if (d.unit === "years" && d.sci) return T("pp.t.sci", { m: d.sci.mantissa, e: d.sci.exp });
    var n = num(d.value) + (d.scale ? " " + T("pp.scale." + d.scale) : "");
    if (d.value === 1 && !d.scale && d.unit !== "milliseconds") return T("pp.t." + d.unit + ".one");
    return T("pp.t." + d.unit, { n: n });
  }
  function fmtCount(big) {
    var d = P.describeCount(big);
    return d;
  }
  function shortCount(big) {
    var d = P.describeCount(big);
    if (!d.short) return "";
    if (d.short.sci) return T("pp.about", { n: d.short.sci.mantissa + " x 10^" + d.short.sci.exp });
    return T("pp.about", { n: num(d.short.value) + " " + T("pp.scale." + d.short.scale) });
  }
  function universeNote(sec) {
    var r = P.universeRatio(sec);
    if (r < 1) return "";
    var sn = P.scaleNumber(r);
    var x = sn.sci ? sn.sci.mantissa + " x 10^" + sn.sci.exp : num(sn.value) + (sn.scale ? " " + T("pp.scale." + sn.scale) : "");
    return T("pp.universe", { x: x });
  }
  function label(s) {
    var sp = space(s);
    return s.kind === "ch" ? T("pp.desc.chars", { n: s.count, l: sp.options }) : T("pp.desc.words", { n: s.count, l: U.commas(sp.options) });
  }

  /* ----- building blocks ----- */
  function rangeRow(id, labelText, min, max, value, onInput) {
    var out = E("output", { for: id, style: "font-weight:700; min-width:2ch; display:inline-block", text: String(value) });
    var input = E("input", { type: "range", id: id, min: String(min), max: String(max), value: String(value),
      oninput: function (e) { out.textContent = e.target.value; onInput(parseInt(e.target.value, 10)); } });
    return E("p", { class: "row" }, [E("label", { for: id, text: labelText }), input, out]);
  }

  function diceEls(list) {
    return E("span", { class: "dice" }, list.map(function (n) { return E("span", { class: "die", role: "img", "aria-label": T("pp.die", { n: n }), text: String(n) }); }));
  }

  function rollSecret(x) {
    var s = state[x];
    if (s.kind === "ch") {
      s.rolled = { sample: sampleChars(s) };
    } else {
      var per = s.kind === "cw" ? 2 : 5, rows = [];
      for (var i = 0; i < s.count; i++) rows.push(P.rollDice(per));
      s.rolled = { dice: rows };
    }
    HK.say(T("pp.live.roll", { x: x }));
  }
  function sampleChars(s) {
    var sets = { digits: "0123456789", lower: "abcdefghijklmnopqrstuvwxyz", mixed: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
                 alnum: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", keyboard: "" };
    var chars = sets[s.alphabet];
    if (s.alphabet === "keyboard") { for (var c = 33; c <= 126; c++) chars += String.fromCharCode(c); }
    var out = "";
    for (var i = 0; i < s.count; i++) out += chars.charAt(U.randInt(chars.length));
    return out;
  }

  /* ----- builder panel ----- */
  function builder(x) {
    var s = state[x];
    var fs = E("fieldset", { id: "fs-" + x });
    fs.appendChild(E("legend", { text: T("pp.secret", { x: x }) }));
    var kinds = E("div", { role: "radiogroup", "aria-label": T("pp.kind") });
    [["cw", "pp.kind.cw"], ["rw", "pp.kind.rw"], ["ch", "pp.kind.ch"]].forEach(function (k) {
      var id = "k-" + x + "-" + k[0];
      var inp = E("input", { type: "radio", name: "kind-" + x, id: id, value: k[0], onchange: function () {
        s.kind = k[0];
        var max = s.kind === "ch" ? 20 : 10;
        if (s.count > max) s.count = max;
        s.rolled = null;
        buildAll(); document.getElementById(id).focus();
      } });
      inp.checked = s.kind === k[0];
      kinds.appendChild(E("label", { class: "opt", for: id }, [inp, E("span", { text: T(k[1]) })]));
    });
    fs.appendChild(kinds);
    var max = s.kind === "ch" ? 20 : 10;
    fs.appendChild(rangeRow("n-" + x, T(s.kind === "ch" ? "pp.count.chars" : "pp.count.words"), 1, max, s.count, function (v) { s.count = v; s.rolled = null; update(true, x); renderPractice(x); }));
    if (s.kind === "ch") {
      var sel = E("select", { id: "a-" + x, onchange: function (e) { s.alphabet = e.target.value; s.rolled = null; update(true, x); renderPractice(x); } });
      ["digits", "lower", "mixed", "alnum", "keyboard"].forEach(function (a) { var o = E("option", { value: a, text: T("pp.alpha." + a) }); if (a === s.alphabet) o.selected = true; sel.appendChild(o); });
      fs.appendChild(E("p", { class: "row" }, [E("label", { for: "a-" + x, text: T("pp.alpha") }), sel]));
    }
    fs.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn", id: "roll-" + x, onclick: function () { rollSecret(x); renderPractice(x); }, text: s.rolled ? T("pp.rollAgain") : T("pp.roll") })]));
    fs.appendChild(E("div", { id: "practice-" + x }));
    return fs;
  }

  function renderPractice(x) {
    var host = document.getElementById("practice-" + x);
    if (!host) return;
    var s = state[x];
    host.textContent = "";
    var rb = document.getElementById("roll-" + x);
    if (rb) rb.textContent = s.rolled ? T("pp.rollAgain") : T("pp.roll");
    if (!s.rolled) return;
    var box = E("div", { class: "plate plain" });
    if (s.kind === "ch") {
      box.appendChild(E("p", { class: "fine", style: "margin:0", text: T("pp.sample") }));
      box.appendChild(E("p", { class: "cipher", style: "margin:0.2rem 0", text: s.rolled.sample }));
    } else if (s.kind === "cw") {
      box.appendChild(E("p", { class: "fine", text: T("pp.dice.cw") }));
      var list = words();
      s.rolled.dice.forEach(function (d, i) {
        var idx = (d[0] - 1) * 6 + (d[1] - 1);
        var row = E("div", { class: "row" });
        row.appendChild(E("span", { style: "min-width:6.5rem", text: T("pp.word", { n: i + 1 }) }));
        row.appendChild(diceEls(d));
        var sel = E("select", { "aria-label": T("pp.word", { n: i + 1 }), onchange: function (e) { var v = parseInt(e.target.value, 10); s.rolled.dice[i] = [Math.floor(v / 6) + 1, (v % 6) + 1]; renderPractice(x); document.querySelectorAll("#practice-" + x + " select")[i].focus(); } });
        list.forEach(function (w, k) { var o = E("option", { value: String(k), text: (Math.floor(k / 6) + 1) + "-" + ((k % 6) + 1) + "  " + w }); if (k === idx) o.selected = true; sel.appendChild(o); });
        row.appendChild(sel);
        box.appendChild(row);
      });
      var phrase = s.rolled.dice.map(function (d) { return P.wordFromDice(list, d[0], d[1]); }).join(" ");
      box.appendChild(E("p", { class: "cipher", style: "margin:0.4rem 0", text: phrase }));
      box.appendChild(E("p", { class: "fine", text: T("pp.pickNote") }));
    } else {
      box.appendChild(E("p", { class: "fine", text: T("pp.dice.rw") }));
      s.rolled.dice.forEach(function (d, i) {
        var row = E("div", { class: "row" });
        row.appendChild(E("span", { style: "min-width:6.5rem", text: T("pp.word", { n: i + 1 }) }));
        row.appendChild(diceEls(d));
        box.appendChild(row);
      });
    }
    box.appendChild(E("p", { class: "fine", style: "margin:0", text: T("pp.practiceOnly") }));
    host.appendChild(box);
  }

  /* ----- results ----- */
  function colData(x) {
    var s = state[x], sp = space(s);
    var c = P.combos(sp.options, sp.length);
    var cd = P.describeCount(c);
    return { x: x, s: s, sp: sp, c: c, exact: cd.exact, short: shortCount(c), bits: P.bits(sp.options, sp.length),
             classAvg: P.seconds(c, P.RATES.classroom, "avg"), classAll: P.seconds(c, P.RATES.classroom, "all"),
             attAvg: P.seconds(c, P.RATES.attacker, "avg"), attAll: P.seconds(c, P.RATES.attacker, "all") };
  }

  function renderResults() {
    var host = document.getElementById("results");
    host.textContent = "";
    var A = colData("A"), B = colData("B");
    var sb = document.getElementById("sumbar");
    if (sb) { sb.textContent = ""; [A, B].forEach(function (c) { sb.appendChild(E("span", null, [E("strong", { text: T("pp.secret", { x: c.x }) + ": " }), document.createTextNode((c.short || c.exact) + ", " + T("pp.row.attAvg").toLowerCase() + ": " + fmtTime(c.attAvg))])); }); }
    var cols = [A, B];
    host.appendChild(E("h2", { text: T("pp.compare") }));
    var tw = E("div", { class: "tablewrap" });
    var tb = E("table");
    tb.appendChild(E("caption", { class: "sr-only", text: T("pp.compare") }));
    var thead = E("thead", null, [E("tr", null, [E("th", { scope: "col", text: "" })].concat(cols.map(function (c) { return E("th", { scope: "col", text: T("pp.secret", { x: c.x }) + ": " + label(c.s) }); })))]);
    tb.appendChild(thead);
    var body = E("tbody");
    function row(name, fn, cls) {
      body.appendChild(E("tr", null, [E("th", { scope: "row", text: name })].concat(cols.map(function (c) { var v = fn(c); return E("td", { class: cls || "", html: v }); }))));
    }
    row(T("pp.row.possible"), function (c) { return "<span class='big-num'>" + HK.esc(c.exact) + "</span>"; });
    row(T("pp.row.words"), function (c) { return HK.esc(c.short || "-"); });
    row(T("pp.row.bits"), function (c) { return HK.esc(String(Math.round(c.bits * 10) / 10)); });
    row(T("pp.row.classAvg"), function (c) { return HK.esc(fmtTime(c.classAvg)); });
    row(T("pp.row.classAll"), function (c) { return HK.esc(fmtTime(c.classAll)); });
    row(T("pp.row.attAvg"), function (c) { return "<strong>" + HK.esc(fmtTime(c.attAvg)) + "</strong>"; });
    row(T("pp.row.attAll"), function (c) { return HK.esc(fmtTime(c.attAll)); });
    tb.appendChild(body); tw.appendChild(tb); host.appendChild(tw);
    host.appendChild(E("p", { class: "fine", text: T("pp.avgHelp") }));

    // bars
    var bars = E("div", { role: "group", "aria-label": T("pp.bar") });
    bars.appendChild(E("p", { class: "fine", style: "margin-bottom:0", text: T("pp.bar") }));
    cols.forEach(function (c, i) {
      var pct = Math.max(2, Math.min(100, Math.round(100 * c.bits / 132)));
      bars.appendChild(E("p", { style: "margin:0.3rem 0 0", text: T("pp.secret", { x: c.x }) + ": " + Math.round(c.bits) + " bits" }));
      bars.appendChild(E("div", { class: "bar" + (i ? " b2" : ""), "aria-hidden": "true" }, [E("span", { style: "width:" + pct + "%" })]));
    });
    host.appendChild(bars);

    // versus sentence
    var l = P.ratio(A.c, B.c);
    var vs;
    if (Math.abs(l) < 0.05) vs = T("pp.vs.same");
    else {
      var big = l > 0 ? A : B, small = l > 0 ? B : A, ll = Math.abs(l);
      if (ll >= 15) vs = T("pp.vs.huge", { a: big.x, b: small.x, e: Math.round(ll) });
      else {
        var sn = P.scaleNumber(Math.pow(10, ll));
        vs = T("pp.vs.more", { a: big.x, b: small.x, r: num(sn.value) + (sn.scale ? " " + T("pp.scale." + sn.scale) : "") });
      }
    }
    host.appendChild(E("p", { class: "promise", text: vs }));
    var uns = [];
    cols.forEach(function (c) { var u = universeNote(c.classAvg); if (u) uns.push(T("pp.secret", { x: c.x }) + ": " + u + " (" + T("pp.row.classAvg") + ")"); else { var u2 = universeNote(c.attAvg); if (u2) uns.push(T("pp.secret", { x: c.x }) + ": " + u2 + " (" + T("pp.row.attAvg") + ")"); } });
    uns.forEach(function (t) { host.appendChild(E("p", { class: "fine", text: t })); });
  }

  /* Short live summary for screen readers (the table itself is not live). */
  var liveTimer = null;
  function announce(x) {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () {
      var c = colData(x);
      HK.say(T("pp.live.changed", { x: x, s: T("pp.summary", { x: x, desc: label(c.s), n: c.exact, t: fmtTime(c.attAvg) }) }));
    }, 600);
  }

  function update(live, x) { renderResults(); if (live) announce(x); }

  /* ----- tables ----- */
  function rowName(r) {
    var sp = P.secretSpace(r);
    return r.kind === "words" ? T("pp.rowLabel.words", { n: r.count, l: U.commas(sp.options) }) : T("pp.rowLabel.chars", { n: r.count, l: sp.options });
  }
  function honestTable() {
    var box = E("div");
    box.appendChild(E("h2", { text: T("pp.table.honest") }));
    box.appendChild(E("p", { class: "fine", text: T("pp.table.honestSub") }));
    var tw = E("div", { class: "tablewrap" }), tb = E("table");
    tb.appendChild(E("caption", { class: "sr-only", text: T("pp.table.honest") }));
    tb.appendChild(E("thead", null, [E("tr", null, [E("th", { scope: "col", text: T("pp.th.secret") }), E("th", { scope: "col", class: "num", text: T("pp.th.possible") }), E("th", { scope: "col", text: T("pp.th.avg") }), E("th", { scope: "col", text: T("pp.th.try") })])]));
    var body = E("tbody");
    P.HONEST_ROWS.forEach(function (r) {
      var sp = P.secretSpace(r), c = P.combos(sp.options, sp.length);
      var tr = E("tr", null, [
        E("th", { scope: "row", text: rowName(r) }),
        E("td", { class: "num", text: U.commas(c) }),
        E("td", { text: fmtTime(P.seconds(c, P.RATES.attacker, "avg")) }),
        E("td", null, [E("button", { type: "button", class: "btn small", "aria-label": T("pp.tryLabel", { s: rowName(r) }), onclick: function () {
          var a = state.A;
          if (r.kind === "words") { a.kind = r.list === "classroom" ? "cw" : "rw"; a.count = r.count; }
          else { a.kind = "ch"; a.alphabet = r.alphabet; a.count = r.count; }
          a.rolled = null; buildAll(); HK.say(T("pp.live.changed", { x: "A", s: label(a) })); document.getElementById("fs-A").scrollIntoView({ block: "start" }); document.getElementById("n-A").focus();
        }, text: T("pp.try") })])
      ]);
      body.appendChild(tr);
    });
    tb.appendChild(body); tw.appendChild(tb); box.appendChild(tw);
    box.appendChild(E("p", { text: T("pp.read") }));
    return box;
  }
  function classTable() {
    var box = E("div");
    box.appendChild(E("h2", { text: T("pp.table.class") }));
    box.appendChild(E("p", { class: "fine", text: T("pp.table.classSub") }));
    var tw = E("div", { class: "tablewrap" }), tb = E("table");
    tb.appendChild(E("caption", { class: "sr-only", text: T("pp.table.class") }));
    tb.appendChild(E("thead", null, [E("tr", null, [E("th", { scope: "col", text: T("pp.th.secret") }), E("th", { scope: "col", class: "num", text: T("pp.th.possible") }), E("th", { scope: "col", text: T("pp.th.all") })])]));
    var body = E("tbody");
    P.CLASS_ROWS.forEach(function (r) {
      var c = P.combos(36, r.count);
      body.appendChild(E("tr", null, [E("th", { scope: "row", text: rowName(r) }), E("td", { class: "num", text: U.commas(c) }), E("td", { text: fmtTime(P.seconds(c, P.RATES.classroom, "all")) })]));
    });
    tb.appendChild(body); tw.appendChild(tb); box.appendChild(tw);
    box.appendChild(E("p", { class: "fine", text: T("pp.toy") }));
    return box;
  }

  function vaultBox() {
    var box = E("div", { class: "plate" });
    box.appendChild(E("h2", { text: T("pp.vault") }));
    box.appendChild(E("p", { text: T("pp.vault.b") }));
    var out = E("p", { class: "big-num", id: "vault-out" });
    var lab = E("label", { for: "vault-n", id: "vault-label" });
    var input = E("input", { type: "range", id: "vault-n", min: "1", max: "20", value: String(state.vault), oninput: function (e) { state.vault = parseInt(e.target.value, 10); vaultUpdate(); } });
    box.appendChild(E("p", { class: "row" }, [lab, input]));
    box.appendChild(out);
    function vaultUpdate() {
      var c = P.combos(6, state.vault);
      lab.textContent = T("pp.vault.n", { n: state.vault });
      out.textContent = T("pp.vault.out", { n: state.vault, c: U.commas(c), t: fmtTime(P.seconds(c, P.RATES.classroom, "all")) });
    }
    vaultUpdate();
    return box;
  }

  function buildAll() {
    var focusId = document.activeElement && document.activeElement.id;
    APP.textContent = "";
    APP.appendChild(E("p", { class: "kicker", text: T("pp.kicker") }));
    APP.appendChild(E("h1", { id: "h-main", tabindex: "-1", text: T("pp.title") }));
    APP.appendChild(E("span", { class: "tick", "aria-hidden": "true" }));
    APP.appendChild(E("p", { class: "lead", text: T("pp.lead") }));
    APP.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "passphrase.hero", "data-decorative": "", "data-h": "5.5rem" })]));
    APP.appendChild(E("div", { class: "privacy", role: "note" }, [E("strong", { text: T("pp.never.h") + ". " }), document.createTextNode(T("pp.never.b"))]));
    APP.appendChild(E("div", { class: "note" }, [E("span", { class: "label", text: T("pp.assume.h") }), E("p", { style: "margin:0", text: T("pp.assume.b") })]));
    APP.appendChild(E("div", { class: "sumbar", id: "sumbar", "aria-hidden": "true" }));
    var grid = E("div", { class: "cmp" }, [builder("A"), builder("B")]);
    APP.appendChild(grid);
    APP.appendChild(E("div", { id: "results", class: "plate" }));
    APP.appendChild(honestTable());
    APP.appendChild(classTable());
    APP.appendChild(vaultBox());
    APP.appendChild(E("h2", { text: T("pp.real.h") })); APP.appendChild(E("p", { text: T("pp.real.b") }));
    APP.appendChild(E("h2", { text: T("pp.online.h") })); APP.appendChild(E("p", { text: T("pp.online.b") }));
    APP.appendChild(E("h2", { text: T("pp.human.h") })); APP.appendChild(E("p", { text: T("pp.human.b") }));
    APP.appendChild(E("p", { class: "promise", text: T("pp.tell") }));
    APP.appendChild(E("div", { class: "row" }, [E("a", { class: "btn", "data-keep": "../index.html", href: HK.href("../index.html"), text: T("pp.lab") })]));
    renderResults(); renderPractice("A"); renderPractice("B");
    HK.refreshArt();
    if (focusId) { var f = document.getElementById(focusId); if (f) f.focus(); }
  }

  HK.onLang(buildAll);
  HK.boot();
  buildAll();
})();
