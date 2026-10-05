/* Hackles Reader search. Reads assets/search-index.js (built by tools/build_reader.py),
   which holds a tokenised inverted index. No network requests. */
(function () {
  "use strict";
  var IDX = window.HK_INDEX;
  var input = document.getElementById("sq");
  var list = document.getElementById("results");
  var status = document.getElementById("sstatus");
  if (!input || !list) return;
  if (!IDX) { status.textContent = "The search index did not load. You can still browse from the menu."; return; }

  var STOP = {}; "the a an and or of to in is it for on with as at by be that this are was from but not you your we our they their he she i if so do does can will el la los las de y en que un una por con para del al se su es no lo como mas pero sus le ya o fue este si entre cuando muy sin sobre tambien me hasta hay donde quien desde todo nos durante"
    .split(" ").forEach(function (w) { STOP[w] = 1; });

  function fold(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function stem(w) {
    var n = w.length;
    if (n > 4 && /ies$/.test(w)) return w.slice(0, -3) + "y";
    if (n > 4 && /(sses|xes|ches|shes|zes)$/.test(w)) return w.slice(0, -2);
    if (n > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function tokenise(q, keepStops) {
    var raw = fold(q).match(/[a-z0-9]+/g) || [];
    var out = raw.filter(function (w) { return w.length > 1 && (keepStops || !STOP[w]); });
    if (!out.length && !keepStops) return tokenise(q, true);
    return out.map(stem);
  }

  var termList = Object.keys(IDX.terms); /* already sorted at build time */
  var PAGES = IDX.pages, SECS = IDX.secs;

  function postings(term) {
    var flat = IDX.terms[term], res = {}, id = 0;
    if (!flat) return res;
    for (var i = 0; i < flat.length; i += 2) { id += flat[i]; res[id] = flat[i + 1]; }
    return res;
  }
  function expand(prefix) {
    var lo = 0, hi = termList.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (termList[mid] < prefix) lo = mid + 1; else hi = mid; }
    var out = [];
    for (var i = lo; i < termList.length && termList[i].indexOf(prefix) === 0 && out.length < 40; i++) out.push(termList[i]);
    return out;
  }

  function search(q) {
    var toks = tokenise(q);
    if (!toks.length) return { results: [], toks: toks };
    var scores = null;
    toks.forEach(function (t, i) {
      var cand = {};
      var terms = (IDX.terms[t] ? [t] : []);
      if (i === toks.length - 1) terms = terms.concat(expand(t).filter(function (x) { return x !== t; }));
      terms.forEach(function (tm) {
        var p = postings(tm), w = tm === t ? 1 : 0.6;
        for (var k in p) cand[k] = (cand[k] || 0) + Math.min(p[k], 12) * w;
      });
      if (scores === null) scores = cand;
      else { var nx = {}; for (var k in cand) if (scores[k] !== undefined) nx[k] = scores[k] + cand[k]; scores = nx; }
    });
    var res = Object.keys(scores || {}).map(function (k) { return { id: +k, score: scores[k] }; });
    res.sort(function (a, b) { return b.score - a.score || a.id - b.id; });
    return { results: res, toks: toks };
  }

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hl(text, toks) {
    var f = fold(text);
    if (f.length !== text.length || !toks.length) return esc(text);
    var re = new RegExp("(" + toks.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")[a-z0-9]*", "g");
    var out = "", last = 0, m;
    while ((m = re.exec(f))) {
      out += esc(text.slice(last, m.index)) + "<mark>" + esc(text.slice(m.index, m.index + m[0].length)) + "</mark>";
      last = m.index + m[0].length;
      if (!m[0].length) re.lastIndex++;
    }
    return out + esc(text.slice(last));
  }

  var MAX = 60;
  function render(q) {
    var r = search(q);
    list.innerHTML = "";
    if (!q.trim()) { status.textContent = ""; return; }
    if (!r.results.length) { status.textContent = "No results for “" + q + "”. Try fewer or shorter words."; return; }
    var shown = r.results.slice(0, MAX);
    status.textContent = r.results.length + " result" + (r.results.length === 1 ? "" : "s") + " for “" + q + "”" + (r.results.length > MAX ? ", showing the first " + MAX : "") + ".";
    var html = shown.map(function (x) {
      var s = SECS[x.id], p = PAGES[s[0]];
      var url = p[0] + "?q=" + encodeURIComponent(q) + (s[1] && s[1] !== "top" ? "#" + s[1] : "");
      var langAttr = p[2] === "es" ? ' lang="es"' : "";
      var path = s[2] === p[1] ? p[3] : p[3] + " › " + s[2];
      return '<li><a href="' + esc(url) + '"' + langAttr + '><span class="r-title">' + hl(p[1], r.toks) + '</span><span class="r-path">' +
        esc(path) + '</span><span class="r-snip">' + hl(s[3] || "", r.toks) + "</span></a></li>";
    }).join("");
    list.innerHTML = html;
  }

  var timer;
  input.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      render(input.value);
      try { var u = new URL(location.href); if (input.value) u.searchParams.set("q", input.value); else u.searchParams.delete("q"); history.replaceState(null, "", u); } catch (e) {}
    }, 120);
  });
  document.getElementById("sform").addEventListener("submit", function (e) { e.preventDefault(); render(input.value); });

  /* keyboard: Down enters the list, Up/Down move, Escape returns to the box */
  function links() { return Array.prototype.slice.call(list.querySelectorAll("a")); }
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { var l = links(); if (l.length) { e.preventDefault(); l[0].focus(); } }
  });
  list.addEventListener("keydown", function (e) {
    var l = links(), i = l.indexOf(document.activeElement);
    if (e.key === "ArrowDown" && i < l.length - 1) { e.preventDefault(); l[i + 1].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (i > 0) l[i - 1].focus(); else input.focus(); }
    else if (e.key === "Home" && l.length) { e.preventDefault(); l[0].focus(); }
    else if (e.key === "End" && l.length) { e.preventDefault(); l[l.length - 1].focus(); }
    else if (e.key === "Escape") { e.preventDefault(); input.focus(); }
  });

  var q0 = new URLSearchParams(location.search).get("q");
  if (q0) { input.value = q0; render(q0); }
  input.focus();
})();
