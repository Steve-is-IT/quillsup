/* Data Detective screen. Fictional kids only. No text input, no storage, no network. */
(function () {
  "use strict";
  var D = window.HK_DATA.detective, L = window.DetectiveLogic;
  var T = HK.t, E = HK.el;
  var APP = document.getElementById("app");
  var S = { screen: "choose", kid: null, order: [], shown: 0, predicted: null, decisions: {}, plan: null };

  function kidById(id) { return D.kids.filter(function (k) { return k.id === id; })[0]; }
  function txt(c) { return c[HK.lang]; }

  function board(set) {
    var ul = E("ul", { style: "list-style:none; padding:0; display:grid; grid-template-columns:repeat(auto-fit,minmax(13rem,1fr)); gap:0.4rem" });
    D.categories.forEach(function (c) {
      var on = !!set[c];
      ul.appendChild(E("li", { style: "border:2px " + (on ? "solid" : "dashed") + " var(--ink); padding:0.35rem 0.6rem; margin:0; background:" + (on ? "var(--hi)" : "transparent") }, [
        E("strong", { text: T("detective.cat." + c) + ": " }), document.createTextNode(on ? "✓ " + T("detective.yes") : T("detective.no"))
      ]));
    });
    return ul;
  }

  function head(sub) {
    var h = E("div");
    h.appendChild(E("p", { class: "kicker", text: T("detective.kicker") }));
    h.appendChild(E("h1", { id: "h-main", tabindex: "-1", text: T("detective.title") }));
    h.appendChild(E("span", { class: "tick", "aria-hidden": "true" }));
    if (sub) h.appendChild(E("p", { class: "lead", text: sub }));
    return h;
  }

  function renderChoose() {
    APP.textContent = "";
    APP.appendChild(head(T("detective.lead")));
    APP.appendChild(E("div", { class: "row" }, [E("span", { "data-art": "detective.hero", "data-decorative": "", "data-h": "5.5rem" })]));
    APP.appendChild(E("p", { class: "promise", text: T("detective.frame") }));
    APP.appendChild(E("p", { class: "privacy", text: T("detective.noinput") }));
    APP.appendChild(E("h2", { text: T("detective.choose") }));
    var g = E("div", { class: "grid" });
    D.kids.forEach(function (k) {
      g.appendChild(E("div", { class: "tool-card" }, [E("div", { class: "body" }, [
        E("h3", { text: k.name }),
        E("button", { type: "button", class: "btn primary", onclick: function () { startKid(k.id); }, text: T("detective.start", { name: k.name }) })
      ])]));
    });
    APP.appendChild(g);
    HK.refreshArt();
  }

  function startKid(id) {
    S.kid = kidById(id); S.order = L.revealOrder(S.kid.cards); S.shown = 1; S.predicted = null; S.decisions = {}; S.plan = null; S.screen = "reveal";
    render(true);
    HK.say(T("detective.live.reveal", { n: 1, lvl: T("detective.lvl." + L.level(L.afterReveal(S.order, 1))) }));
  }

  function renderReveal(focusNew) {
    APP.textContent = "";
    APP.appendChild(head(null));
    APP.appendChild(E("h2", { text: T("detective.kid", { name: S.kid.name }) }));
    var posts = E("ol", { class: "plain", style: "list-style:none; padding:0; max-width:none" });
    for (var i = 0; i < S.shown; i++) {
      var c = S.order[i];
      posts.appendChild(E("li", { class: "sortcard", style: "font-size:1.05rem" }, [
        E("span", { class: "cardno", "aria-hidden": "true", text: T("detective.postN", { n: i + 1, total: S.order.length }) }),
        E("span", { class: "sr-only", text: T("detective.postN", { n: i + 1, total: S.order.length }) + ". " }),
        E("span", { text: txt(c) })
      ]));
    }
    APP.appendChild(posts);
    var set = L.afterReveal(S.order, S.shown), lvl = L.level(set);
    APP.appendChild(E("h2", { style: "font-size:1.2rem", text: T("detective.board") }));
    APP.appendChild(board(set));
    APP.appendChild(E("p", { class: "promise", role: "status", id: "lvl", text: T("detective.lvl." + lvl) }));
    if (S.shown < S.order.length) {
      var pr = E("div", { class: "plate plain" });
      pr.appendChild(E("p", { style: "font-weight:700; margin-bottom:0.3rem", text: T("detective.predict") }));
      var chips = E("div", { class: "chips", role: "group", "aria-label": T("detective.predict") });
      ["yes", "no", "unsure"].forEach(function (k) {
        chips.appendChild(E("button", { type: "button", class: "chip", "aria-pressed": S.predicted === k ? "true" : "false", onclick: function () { S.predicted = k; renderReveal(); document.querySelector(".chips .chip[data-k='" + k + "']").focus(); HK.say(T("detective.p.thanks")); }, "data-k": k, text: T("detective.p." + k) }));
      });
      pr.appendChild(chips);
      if (S.predicted) pr.appendChild(E("p", { role: "status", class: "fine", text: T("detective.p.thanks") }));
      APP.appendChild(pr);
      APP.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-reveal", onclick: function () { S.shown++; S.predicted = null; renderReveal(true); HK.say(T("detective.live.reveal", { n: S.shown, lvl: T("detective.lvl." + L.level(L.afterReveal(S.order, S.shown))) })); document.getElementById(S.shown < S.order.length ? "btn-reveal" : "btn-file").focus(); }, text: T("detective.reveal") })]));
    } else {
      APP.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-file", onclick: function () { S.screen = "file"; render(true); HK.say(T("detective.live.file")); }, text: T("detective.seeAll") })]));
    }
    HK.refreshArt();
  }

  function renderFile() {
    APP.textContent = "";
    APP.appendChild(head(null));
    APP.appendChild(E("h2", { text: T("detective.file") + ": " + S.kid.name }));
    APP.appendChild(E("p", { text: T("detective.fileSub") }));
    var tb = E("table"), body = E("tbody");
    tb.appendChild(E("thead", null, [E("tr", null, [E("th", { scope: "col", text: T("detective.th.fact") }), E("th", { scope: "col", text: T("detective.th.found") })])]));
    D.categories.forEach(function (c) {
      var idx = L.firstIndex(S.order, c);
      body.appendChild(E("tr", null, [E("th", { scope: "row", text: T("detective.cat." + c) }), E("td", { text: idx ? T("detective.postNum", { n: idx }) : T("detective.notFound") })]));
    });
    tb.appendChild(body);
    APP.appendChild(E("div", { class: "tablewrap" }, [tb]));
    var hi = L.firstIndex(S.order, "home");
    APP.appendChild(E("p", { class: "promise", text: hi ? T("detective.fileHow", { n: hi, name: S.kid.name }) : T("detective.fileHowNone", { name: S.kid.name }) }));
    if (L.known(S.kid.cards).password) APP.appendChild(E("p", { text: T("detective.pw") }));
    APP.appendChild(E("div", { class: "row" }, [E("button", { type: "button", class: "btn primary", id: "btn-reflect", onclick: function () { S.screen = "reflect"; render(true); }, text: T("detective.toReflect") })]));
  }

  function renderReflect() {
    APP.textContent = "";
    APP.appendChild(head(null));
    APP.appendChild(E("h2", { text: T("detective.reflect") + " (" + S.kid.name + ")" }));
    APP.appendChild(E("p", { text: T("detective.reflectSub") }));
    S.order.forEach(function (c, i) {
      var d = S.decisions[c.n] || "keep";
      var fs = E("fieldset", { style: "margin:0.6rem 0" });
      fs.appendChild(E("legend", { text: T("detective.postN", { n: i + 1, total: S.order.length }) }));
      fs.appendChild(E("p", { style: "margin:0 0 0.4rem", text: txt(c) }));
      var seg = E("span", { class: "seg", role: "group", "aria-label": T("detective.postN", { n: i + 1, total: S.order.length }) });
      ["keep", "change", "remove"].forEach(function (k) {
        if (k === "change" && !c.safe) return;
        seg.appendChild(E("button", { type: "button", id: "d-" + c.n + "-" + k, "aria-pressed": d === k ? "true" : "false", onclick: function () { S.decisions[c.n] = k; renderReflect(); var el = document.getElementById("d-" + c.n + "-" + k); if (el) el.focus(); announceAfter(); }, text: T("detective.d." + k) }));
      });
      fs.appendChild(seg);
      if (d === "change" && c.safe) fs.appendChild(E("p", { style: "margin:0.5rem 0 0", text: T("detective.safeIs", { t: c.safe[HK.lang] }) }));
      if (d === "remove") fs.appendChild(E("p", { style: "margin:0.5rem 0 0", text: c.safe ? T("detective.removed") : T("detective.noSafe") }));
      if (d === "change" && !c.safe) fs.appendChild(E("p", { text: T("detective.noSafe") }));
      APP.appendChild(fs);
    });
    var kept = L.afterChanges(S.order, S.decisions), set = L.known(kept);
    var changed = Object.keys(S.decisions).some(function (k) { return S.decisions[k] !== "keep"; });
    var box = E("div", { class: "plate" });
    box.appendChild(E("h2", { text: T("detective.after") }));
    box.appendChild(board(set));
    var n = L.count(set), msg;
    if (n === 0) msg = T("detective.after.none");
    else {
      var names = D.categories.filter(function (c) { return set[c]; }).map(function (c) { return T("detective.cat." + c).toLowerCase(); }).join(", ");
      msg = (changed ? T("detective.after.some", { t: names }) + " " + (L.level(set) === "crumb" ? "" : T("detective.after.still")) : T("detective.after.some", { t: names }));
    }
    box.appendChild(E("p", { class: "promise", id: "after-msg", role: "status", text: msg }));
    APP.appendChild(box);
    var cc = E("div", { class: "note" }, [E("span", { class: "label", text: T("detective.clueCheck") }), E("ol", { style: "margin:0" }, [1, 2, 3, 4].map(function (i) { return E("li", { text: T("detective.cc" + i) }); }))]);
    APP.appendChild(cc);
    APP.appendChild(E("p", { class: "promise", text: T("detective.keep") }));
    var plan = E("div", { class: "plate" });
    plan.appendChild(E("h3", { text: T("detective.plan") }));
    var chips = E("div", { class: "chips", role: "group", "aria-label": T("detective.plan") });
    [1, 2, 3, 4].forEach(function (i) { chips.appendChild(E("button", { type: "button", class: "chip", id: "plan-" + i, "aria-pressed": S.plan === i ? "true" : "false", onclick: function () { S.plan = i; renderReflect(); document.getElementById("plan-" + i).focus(); HK.say(T("detective.plan.picked", { t: T("detective.plan." + i) })); }, text: T("detective.plan." + i) })); });
    plan.appendChild(chips);
    if (S.plan) plan.appendChild(E("p", { style: "font-weight:700", role: "status", text: T("detective.plan.picked", { t: T("detective.plan." + S.plan) }) }));
    APP.appendChild(plan);
    APP.appendChild(E("div", { class: "row" }, [
      E("button", { type: "button", class: "btn primary", onclick: function () { S.screen = "choose"; render(true); }, text: T("detective.another") }),
      E("a", { class: "btn", "data-keep": "../index.html", href: HK.href("../index.html"), text: T("detective.lab") })
    ]));
  }
  function announceAfter() { var m = document.getElementById("after-msg"); if (m) HK.say(m.textContent); }

  function render(focus) {
    if (S.screen === "choose") renderChoose(); else if (S.screen === "reveal") renderReveal(); else if (S.screen === "file") renderFile(); else renderReflect();
    if (focus) HK.focus(document.getElementById("h-main"));
  }
  HK.onLang(function () { render(false); });
  HK.boot();
  render(false);
})();
