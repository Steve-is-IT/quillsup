/* HACKLES LAB core: language, page chrome, live announcements, art lookup.
   No network, no cookies, no storage. Language and text size travel in the page address
   (?lang=es&size=big) so a link keeps them. Classic script (works from file://). */
(function (root) {
  "use strict";
  var HK = root.HK = root.HK || {};
  var scriptEl = document.currentScript;
  var BASE = scriptEl && scriptEl.src ? scriptEl.src.replace(/js\/core\.js[^/]*$/, "") : "../assets/";

  HK.strings = { en: {}, es: {} };
  HK.langCbs = [];
  HK.base = BASE;

  HK.register = function (obj) {
    ["en", "es"].forEach(function (l) {
      var src = obj[l] || {};
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) HK.strings[l][k] = src[k];
    });
  };

  var q = (function () {
    var o = {};
    try {
      var s = (location.search || "").replace(/^\?/, "");
      s.split("&").forEach(function (p) { if (!p) return; var kv = p.split("="); o[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ""); });
    } catch (e) { /* ignore */ }
    return o;
  })();
  HK.lang = (q.lang === "es") ? "es" : "en";
  HK.size = (q.size === "big" || q.size === "huge") ? q.size : "normal";

  HK.t = function (key, vars) {
    var s = HK.strings[HK.lang][key];
    if (s === undefined) s = HK.strings.en[key];
    if (s === undefined) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, n) { return vars[n] !== undefined ? vars[n] : m; });
    return s;
  };

  /* Escape text, then allow **bold** only. */
  HK.esc = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  HK.md = function (s) { return HK.esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"); };

  HK.el = function (tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k) || attrs[k] === null || attrs[k] === undefined || attrs[k] === false) continue;
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  };

  /* Apply data-i18n (text), data-i18n-html (trusted markup from our own tables), data-i18n-attr="attr:key;attr:key". */
  HK.apply = function (scope) {
    scope = scope || document;
    var n, i, list;
    list = scope.querySelectorAll("[data-i18n]");
    for (i = 0; i < list.length; i++) { n = list[i]; n.textContent = HK.t(n.getAttribute("data-i18n")); }
    list = scope.querySelectorAll("[data-i18n-html]");
    for (i = 0; i < list.length; i++) { n = list[i]; n.innerHTML = HK.t(n.getAttribute("data-i18n-html")); }
    list = scope.querySelectorAll("[data-i18n-attr]");
    for (i = 0; i < list.length; i++) {
      n = list[i];
      n.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var kv = pair.split(":");
        if (kv.length === 2) n.setAttribute(kv[0].trim(), HK.t(kv[1].trim()));
      });
    }
  };

  HK.href = function (path) {
    var parts = [];
    if (HK.lang === "es") parts.push("lang=es");
    if (HK.size !== "normal") parts.push("size=" + HK.size);
    if (!parts.length) return path;
    var hash = "";
    var h = path.indexOf("#");
    if (h >= 0) { hash = path.slice(h); path = path.slice(0, h); }
    return path + (path.indexOf("?") >= 0 ? "&" : "?") + parts.join("&") + hash;
  };

  function refreshLinks() {
    var list = document.querySelectorAll("a[data-keep]");
    for (var i = 0; i < list.length; i++) list[i].setAttribute("href", HK.href(list[i].getAttribute("data-keep")));
  }

  function writeUrl() {
    try {
      if (history && history.replaceState && location.protocol !== "about:") {
        var parts = [];
        if (HK.lang === "es") parts.push("lang=es");
        if (HK.size !== "normal") parts.push("size=" + HK.size);
        history.replaceState(null, "", location.pathname + (parts.length ? "?" + parts.join("&") : "") + location.hash);
      }
    } catch (e) { /* some sandboxes block this; the page still works */ }
  }

  HK.onLang = function (cb) { HK.langCbs.push(cb); };

  HK.setLang = function (l) {
    HK.lang = (l === "es") ? "es" : "en";
    document.documentElement.lang = HK.lang;
    writeUrl();
    HK.apply(document);
    refreshChrome();
    refreshLinks();
    HK.langCbs.forEach(function (cb) { try { cb(HK.lang); } catch (e) { console.error(e); } });
    HK.say(HK.t("common.langChanged"));
  };

  HK.setSize = function (s) {
    HK.size = s;
    if (s === "normal") document.documentElement.removeAttribute("data-size"); else document.documentElement.setAttribute("data-size", s);
    writeUrl();
    refreshChrome();
    refreshLinks();
  };

  /* Live region. Polite by default; assertive only for the rare thing that must interrupt. */
  var live;
  HK.say = function (msg, assertive) {
    if (!live) return;
    var node = assertive ? live.a : live.p;
    node.textContent = "";
    setTimeout(function () { node.textContent = msg; }, 30);
  };

  HK.focus = function (el) {
    if (!el) return;
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: false });
  };

  /* Pictures. Slots come from art.json (via art.js). */
  HK.artInfo = function (slot) {
    var A = root.HK_ART;
    if (!A) return null;
    var id = A.slots[slot];
    var ch = id && A.characters[id];
    return ch ? { id: id, ch: ch } : null;
  };
  var GIFT = '<svg viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false"><rect x="18" y="42" width="64" height="44" fill="#FFC93C" stroke="#2B2D42" stroke-width="4"/><rect x="12" y="32" width="76" height="14" fill="#FF8A3D" stroke="#2B2D42" stroke-width="4"/><path d="M50 32 C40 12 24 18 34 30 M50 32 C60 12 76 18 66 30" fill="none" stroke="#2B2D42" stroke-width="4"/><path d="M50 86 V94 C50 100 58 100 58 94" fill="none" stroke="#2B2D42" stroke-width="4"/><circle cx="40" cy="62" r="3" fill="#2B2D42"/><circle cx="60" cy="62" r="3" fill="#2B2D42"/><path d="M42 72 Q50 78 58 72" fill="none" stroke="#2B2D42" stroke-width="3"/></svg>';
  HK.art = function (slot, opts) {
    opts = opts || {};
    var info = HK.artInfo(slot);
    var wrap;
    if (!info) return document.createComment("no art for " + slot);
    var alt = opts.decorative ? "" : ((info.ch.alt && (info.ch.alt[HK.lang] || info.ch.alt.en)) || "");
    if (!info.ch.src) {
      wrap = HK.el("span", { class: "art " + (opts.cls || ""), role: opts.decorative ? null : "img", "aria-label": opts.decorative ? null : alt, "aria-hidden": opts.decorative ? "true" : null });
      wrap.innerHTML = GIFT;
      wrap.style.display = "inline-block";
      wrap.style.width = opts.width || "4.5rem";
      return wrap;
    }
    var img = HK.el("img", { src: BASE + info.ch.src, alt: alt, class: "art " + (opts.cls || ""), loading: "lazy", decoding: "async" });
    if (opts.decorative) img.setAttribute("aria-hidden", "true");
    return img;
  };
  /* Re-translate the alt text of every picture already on the page. */
  HK.refreshArt = function () {
    var list = document.querySelectorAll("[data-art]");
    for (var i = 0; i < list.length; i++) {
      var h = list[i], slot = h.getAttribute("data-art");
      h.textContent = "";
      var el = HK.art(slot, { decorative: h.hasAttribute("data-decorative"), cls: h.getAttribute("data-cls") || "" });
      if (el.nodeType === 1) { if (h.getAttribute("data-h")) el.style.height = h.getAttribute("data-h"); h.appendChild(el); }
    }
  };
  HK.onLang(function () { HK.refreshArt(); });

  HK.icon = function (key) {
    var A = root.HK_ART;
    var p = A && A.icons && A.icons[key];
    return p ? BASE + p : "";
  };

  /* ---------- page chrome ---------- */
  HK.register({
    en: {
      "common.skip": "Skip to main content",
      "common.brand": "HACKLES LAB",
      "common.home": "Lab home",
      "common.language": "Language",
      "common.textsize": "Text size",
      "common.size.normal": "A",
      "common.size.big": "A+",
      "common.size.huge": "A++",
      "common.size.normal.label": "Normal text size",
      "common.size.big.label": "Bigger text",
      "common.size.huge.label": "Biggest text",
      "common.langChanged": "Language changed to English.",
      "common.draft": "The Spanish version is a draft. Native speakers and a school counselor should review it before classroom use.",
      "common.noscript": "This tool needs JavaScript. It runs entirely in your browser and works offline.",
      "common.privacy": "No accounts. No data collected. Nothing leaves this page: no cookies, no saved settings, no network.",
      "common.legal": "(c) 2026 Competence Collective. Lesson text CC BY-NC 4.0. Hackles name, logos and art: all rights reserved.",
      "common.tagline": "Trust your hackles. Pause. Check. Tell.",
      "common.promise": "A false alarm is fine. It is never your fault.",
      "common.back": "Back to Lab home",
      "common.again": "Play again",
      "common.next": "Next",
      "common.done": "Done"
    },
    es: {
      "common.skip": "Saltar al contenido principal",
      "common.brand": "LABORATORIO HACKLES",
      "common.home": "Inicio del Laboratorio",
      "common.language": "Idioma",
      "common.textsize": "Tamaño del texto",
      "common.size.normal": "A",
      "common.size.big": "A+",
      "common.size.huge": "A++",
      "common.size.normal.label": "Tamaño de texto normal",
      "common.size.big.label": "Texto más grande",
      "common.size.huge.label": "Texto muy grande",
      "common.langChanged": "Idioma cambiado a español.",
      "common.draft": "La versión en español es un borrador. Hablantes nativos y una persona consejera escolar deben revisarla antes de usarla en clase.",
      "common.noscript": "Esta herramienta necesita JavaScript. Funciona por completo en tu navegador y sin conexión.",
      "common.privacy": "Sin cuentas. No se recopilan datos. Nada sale de esta página: sin cookies, sin ajustes guardados, sin red.",
      "common.legal": "(c) 2026 Competence Collective. Texto de las lecciones: CC BY-NC 4.0. El nombre Hackles, los logotipos y las ilustraciones: todos los derechos reservados.",
      "common.tagline": "Confía en tu corazonada. Pausa. Revisa. Cuenta.",
      "common.promise": "Una falsa alarma está bien. Nunca es tu culpa.",
      "common.back": "Volver al inicio del Laboratorio",
      "common.again": "Jugar otra vez",
      "common.next": "Siguiente",
      "common.done": "Listo"
    }
  });

  function buildChrome() {
    var body = document.body;
    var tool = body.getAttribute("data-tool");
    var isHome = !tool;
    var up = isHome ? "" : "../";

    var skip = HK.el("a", { class: "skip", href: "#main", "data-i18n": "common.skip" });
    var head = HK.el("header", { class: "masthead" });
    var wrap = HK.el("div", { class: "wrap" });
    var brand = HK.el("a", { class: "brand", "data-keep": up + "index.html", href: up + "index.html" }, [
      HK.el("span", { "data-art": "brand.mark", "data-decorative": "", "data-h": "2.1rem" }),
      HK.el("span", { "data-i18n": "common.brand" })
    ]);
    var tb = HK.el("div", { class: "toolbar" });

    var langGroup = HK.el("div", { role: "group", "data-i18n-attr": "aria-label:common.language", "aria-label": "Language" }, [
      HK.el("span", { class: "seg-label", "data-i18n": "common.language", "aria-hidden": "true" }),
      HK.el("span", { class: "seg" }, [
        HK.el("button", { type: "button", lang: "en", "data-lang": "en", onclick: function () { HK.setLang("en"); } }, ["English"]),
        HK.el("button", { type: "button", lang: "es", "data-lang": "es", onclick: function () { HK.setLang("es"); } }, ["Español"])
      ])
    ]);
    var sizeGroup = HK.el("div", { role: "group", "data-i18n-attr": "aria-label:common.textsize", "aria-label": "Text size" }, [
      HK.el("span", { class: "seg-label", "data-i18n": "common.textsize", "aria-hidden": "true" }),
      HK.el("span", { class: "seg" }, ["normal", "big", "huge"].map(function (s) {
        return HK.el("button", { type: "button", "data-size": s, "data-i18n": "common.size." + s, "data-i18n-attr": "aria-label:common.size." + s + ".label", onclick: function () { HK.setSize(s); } });
      }))
    ]);
    tb.appendChild(langGroup);
    tb.appendChild(sizeGroup);
    wrap.appendChild(brand);
    wrap.appendChild(tb);
    head.appendChild(wrap);

    var draft = HK.el("div", { class: "wrap" }, [HK.el("p", { class: "draftbar", id: "hk-draft", role: "note", "data-i18n": "common.draft" })]);

    body.insertBefore(head, body.firstChild);
    body.insertBefore(draft, head.nextSibling);
    body.insertBefore(skip, body.firstChild);

    var foot = HK.el("footer", { class: "site" }, [
      HK.el("div", { class: "wrap" }, [
        HK.el("p", { "data-i18n": "common.privacy" }),
        HK.el("p", { "data-i18n": "common.legal" })
      ])
    ]);
    body.appendChild(foot);

    live = {
      p: HK.el("div", { class: "sr-only", role: "status", "aria-live": "polite", "aria-atomic": "true" }),
      a: HK.el("div", { class: "sr-only", role: "alert", "aria-live": "assertive", "aria-atomic": "true" })
    };
    body.appendChild(live.p);
    body.appendChild(live.a);
  }

  function refreshChrome() {
    var i, b;
    var l = document.querySelectorAll("button[data-lang]");
    for (i = 0; i < l.length; i++) l[i].setAttribute("aria-pressed", l[i].getAttribute("data-lang") === HK.lang ? "true" : "false");
    var s = document.querySelectorAll(".toolbar button[data-size]");
    for (i = 0; i < s.length; i++) { b = s[i]; b.setAttribute("aria-pressed", b.getAttribute("data-size") === HK.size ? "true" : "false"); }
    var d = document.getElementById("hk-draft");
    if (d) d.hidden = HK.lang !== "es";
  }

  HK.boot = function () {
    if (HK._booted) return;
    HK._booted = true;
    document.documentElement.lang = HK.lang;
    if (HK.size !== "normal") document.documentElement.setAttribute("data-size", HK.size);
    buildChrome();
    HK.apply(document);
    HK.refreshArt();
    refreshChrome();
    refreshLinks();
    function setTitle() {
      var k = document.body.getAttribute("data-title-key");
      document.title = (!k || k === "common.brand") ? HK.t("common.brand") : HK.t(k) + " | " + HK.t("common.brand");
    }
    setTitle();
    HK.onLang(setTitle);
  };
})(typeof self !== "undefined" ? self : this);
