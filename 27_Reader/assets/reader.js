/* Hackles Reader enhancements. Everything works without this file; it adds the theme
   toggles, the phone menu, the "/" shortcut and search-term highlights.
   No network requests, no cookies. localStorage is used only for the optional theme choice. */
(function () {
  "use strict";
  var de = document.documentElement;

  /* ---- theme toggles ---- */
  function getTheme() { var t = de.getAttribute("data-theme"); return t === "white" || t === "dark" || t === "paper" ? t : ""; }
  function setTheme(t) {
    if (t) de.setAttribute("data-theme", t); else de.removeAttribute("data-theme");
    try { if (t) localStorage.setItem("hk-theme", t); else localStorage.removeItem("hk-theme"); } catch (e) {}
    sync();
  }
  function osDark() { return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches; }
  function sync() {
    var t = getTheme();
    var w = document.getElementById("t-white"), d = document.getElementById("t-dark");
    if (w) w.setAttribute("aria-pressed", t === "white" ? "true" : "false");
    if (d) d.setAttribute("aria-pressed", (t === "dark" || (!t && osDark())) ? "true" : "false");
  }
  var tw = document.getElementById("t-white"), td = document.getElementById("t-dark");
  if (tw) tw.addEventListener("click", function () { setTheme(getTheme() === "white" ? "" : "white"); });
  if (td) td.addEventListener("click", function () {
    var pressed = td.getAttribute("aria-pressed") === "true";
    if (pressed) { setTheme(osDark() ? "paper" : ""); } else { setTheme("dark"); }
  });
  sync();

  /* ---- phone menu ---- */
  var nav = document.getElementById("site-nav"), nt = document.getElementById("nav-toggle");
  var mq = window.matchMedia ? matchMedia("(max-width: 61.99rem)") : null;
  function applyNav() {
    if (!nav || !nt) return;
    if (mq && mq.matches) {
      var open = nt.getAttribute("aria-expanded") === "true";
      if (open) nav.removeAttribute("hidden"); else nav.setAttribute("hidden", "");
    } else { nav.removeAttribute("hidden"); }
  }
  if (nt && nav) {
    nt.addEventListener("click", function () {
      nt.setAttribute("aria-expanded", nt.getAttribute("aria-expanded") === "true" ? "false" : "true");
      applyNav();
      if (nt.getAttribute("aria-expanded") === "true") {
        var cur = nav.querySelector('[aria-current="page"]') || nav.querySelector("a");
        if (cur) cur.focus();
      }
    });
    nav.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mq && mq.matches && nt.getAttribute("aria-expanded") === "true") {
        nt.setAttribute("aria-expanded", "false"); applyNav(); nt.focus();
      }
    });
    if (mq && mq.addEventListener) mq.addEventListener("change", applyNav);
    applyNav();
  }
  /* skip-to-navigation must reveal a hidden menu */
  var s2 = document.querySelector(".skip2");
  if (s2 && nt) s2.addEventListener("click", function () {
    if (mq && mq.matches) { nt.setAttribute("aria-expanded", "true"); applyNav(); }
  });

  /* ---- "/" focuses the search box ---- */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
    var q = document.getElementById("sq") || document.getElementById("hq");
    if (q) { e.preventDefault(); q.focus(); q.select(); }
  });

  /* ---- highlight search terms on arrival (?q=...) ---- */
  function foldStr(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  var params = new URLSearchParams(location.search);
  var q = params.get("q");
  var isSearchPage = /search\.html$/.test(location.pathname);
  if (q && !isSearchPage) {
    var words = foldStr(q).match(/[a-z0-9]+/g) || [];
    words = words.filter(function (w) { return w.length > 1; });
    var main = document.getElementById("main");
    if (words.length && main) {
      var count = 0, first = null;
      var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var p = n.parentNode;
          if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (p.closest && p.closest("script,style,.hlbar,.sr-only,nav.toc,nav.chapnav,nav.docnav,nav.crumbs")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (n) {
        var text = n.nodeValue, f = foldStr(text);
        if (f.length !== text.length) return; /* skip rare length-changing folds to stay safe */
        var re = new RegExp("(" + words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")[a-z0-9]*", "g");
        var m, last = 0, frag = null;
        while ((m = re.exec(f))) {
          if (!frag) frag = document.createDocumentFragment();
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          var mk = document.createElement("mark");
          mk.textContent = text.slice(m.index, m.index + m[0].length);
          frag.appendChild(mk); if (!first) first = mk; count++;
          last = m.index + m[0].length;
          if (m[0].length === 0) re.lastIndex++;
        }
        if (frag) {
          if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
          n.parentNode.replaceChild(frag, n);
        }
      });
      if (count) {
        var bar = document.createElement("div");
        bar.className = "hlbar"; bar.setAttribute("role", "status");
        var span = document.createElement("span");
        span.textContent = count + " highlighted match" + (count === 1 ? "" : "es") + " for “" + q + "”";
        var btn = document.createElement("button"); btn.type = "button"; btn.textContent = "Clear highlights";
        btn.addEventListener("click", function () {
          main.querySelectorAll("mark").forEach(function (m) { m.replaceWith(document.createTextNode(m.textContent)); });
          main.normalize(); bar.remove();
        });
        bar.appendChild(span); bar.appendChild(btn);
        main.insertBefore(bar, main.firstChild);
        if (first && !location.hash) {
          var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
          first.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
        }
      }
    }
  }
})();
