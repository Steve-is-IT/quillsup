/* HACKLES LAB home page: one card per tool. */
(function () {
  "use strict";
  var T = HK.t, E = HK.el;
  var TOOLS = [
    { id: "spot",       dir: "spot-the-fishy",    icon: "spot",       doc: "Facilitation_Card_01_Spot_the_Fishy.pdf" },
    { id: "passphrase", dir: "passphrase-lab",    icon: "passphrase", doc: "Facilitation_Card_02_Passphrase_Lab.pdf" },
    { id: "secret",     dir: "secret-code-lab",   icon: "secret",     doc: "Facilitation_Card_03_Secret_Code_Lab.pdf" },
    { id: "detective",  dir: "data-detective",    icon: "detective",  doc: "Facilitation_Card_04_Data_Detective.pdf" },
    { id: "ornot",      dir: "hackles-or-not",    icon: "ornot",      doc: "Facilitation_Card_05_Hackles_or_Not.pdf" },
    { id: "trail",      dir: "help-ladder-trail", icon: "trail",      doc: "Facilitation_Card_06_Help_Ladder_Trail.pdf" }
  ];
  HK.register({
    en: {
      "home.kicker": "Six classroom tools",
      "home.title": "HACKLES LAB",
      "home.lead": "Games and experiments for noticing, pausing, checking and telling. They run in any browser, even offline, on a phone, tablet, Chromebook or projector. No accounts, no typing of personal details, nothing saved.",
      "home.promise": "Trust your hackles. A false alarm is fine. It is never your fault.",
      "home.open": "Open",
      "home.teacher": "Teacher facilitation card (PDF)",
      "home.t.spot.name": "Spot the Fishy", "home.t.spot.d": "Sort real messages into Fishy, Real, or Pause and Ask. The whole class fills one Pond together.", "home.t.spot.m": "K-12. 10 or 30 minutes. Team mode.",
      "home.t.passphrase.name": "Passphrase Lab", "home.t.passphrase.d": "Roll dice, build practice secrets and see how many guesses each one could take.", "home.t.passphrase.m": "Grades 3-12. 10 to 30 minutes.",
      "home.t.secret.name": "Secret Code Lab", "home.t.secret.d": "Turn the cipher wheel, scramble a message, then crack a set of codes.", "home.t.secret.m": "Grades 3-8. 10 to 30 minutes.",
      "home.t.detective.name": "Data Detective", "home.t.detective.d": "Reveal small facts about a made-up kid, watch them add up, then decide what you would change.", "home.t.detective.m": "Grades 3-8. 10 to 20 minutes.",
      "home.t.ornot.name": "Hackles or Not?", "home.t.ornot.d": "Decide if your hackles go up, then choose Pause, Check or Tell. Includes Help Ladder practice.", "home.t.ornot.m": "Grades 2-8. 10 to 20 minutes.",
      "home.t.trail.name": "Help Ladder Trail", "home.t.trail.d": "A cooperative hike to Hackles Peak. Teams choose, Gifty tempts, the Help Ladder helps. The class cannot lose.", "home.t.trail.m": "K-8. 10 or 30 minutes. Teams.",
      "home.how.h": "Using the Lab",
      "home.how.1": "Open index.html from the folder, or put the folder on any web host. Nothing else is needed.",
      "home.how.2": "Use the language buttons for English or Spanish. The Spanish version is a draft for native-speaker review.",
      "home.how.3": "Text size buttons make everything bigger for a projector. The pages also follow your browser zoom.",
      "home.how.4": "The pictures are placeholders from the Hackles art folder. An illustrator can swap them in one file, assets/art.json.",
      "home.pill": "Free. No accounts. No data collected."
    },
    es: {
      "home.kicker": "Seis herramientas para el aula",
      "home.title": "LABORATORIO HACKLES",
      "home.lead": "Juegos y experimentos para notar, pausar, revisar y contar. Funcionan en cualquier navegador, incluso sin conexión, en teléfono, tableta, Chromebook o proyector. Sin cuentas, sin escribir datos personales y sin guardar nada.",
      "home.promise": "Confía en tu corazonada. Una falsa alarma está bien. Nunca es tu culpa.",
      "home.open": "Abrir",
      "home.teacher": "Tarjeta de facilitación para docentes (PDF, en inglés)",
      "home.t.spot.name": "Detecta lo Sospechoso", "home.t.spot.d": "Clasifica mensajes de verdad en Sospechoso, Real o Pausa y Pregunta. Toda la clase llena un Estanque junta.", "home.t.spot.m": "K-12. 10 o 30 minutos. Modo por equipos.",
      "home.t.passphrase.name": "Laboratorio de Frases de Contraseña", "home.t.passphrase.d": "Tira dados, arma secretos de práctica y mira cuántos intentos podría necesitar cada uno.", "home.t.passphrase.m": "Grados 3-12. De 10 a 30 minutos.",
      "home.t.secret.name": "Laboratorio de Códigos Secretos", "home.t.secret.d": "Gira la rueda de cifrado, revuelve un mensaje y luego descifra una serie de códigos.", "home.t.secret.m": "Grados 3-8. De 10 a 30 minutos.",
      "home.t.detective.name": "Detective de Datos", "home.t.detective.d": "Descubre pequeños datos de un niño inventado, mira cómo se suman y decide qué cambiarías.", "home.t.detective.m": "Grados 3-8. De 10 a 20 minutos.",
      "home.t.ornot.name": "¿Piel erizada o no?", "home.t.ornot.d": "Decide si se te eriza la piel y elige Pausa, Revisa o Cuenta. Incluye práctica de la Escalera de Ayuda.", "home.t.ornot.m": "Grados 2-8. De 10 a 20 minutos.",
      "home.t.trail.name": "Sendero de la Escalera de Ayuda", "home.t.trail.d": "Una caminata cooperativa a la Cima Hackles. Los equipos eligen, Gifty tienta y la Escalera de Ayuda ayuda. La clase no puede perder.", "home.t.trail.m": "K-8. 10 o 30 minutos. Equipos.",
      "home.how.h": "Cómo usar el Laboratorio",
      "home.how.1": "Abre index.html desde la carpeta, o pon la carpeta en cualquier servidor web. No hace falta nada más.",
      "home.how.2": "Usa los botones de idioma para inglés o español. La versión en español es un borrador para revisión de hablantes nativos.",
      "home.how.3": "Los botones de tamaño de texto agrandan todo para un proyector. Las páginas también siguen el zoom de tu navegador.",
      "home.how.4": "Las imágenes son provisionales de la carpeta de arte de Hackles. Una ilustradora o un ilustrador puede cambiarlas en un solo archivo, assets/art.json.",
      "home.pill": "Gratis. Sin cuentas. No se recopilan datos."
    }
  });

  var APP = document.getElementById("app");
  function build() {
    APP.textContent = "";
    APP.appendChild(E("div", { class: "row", style: "align-items:flex-end" }, [
      E("div", { style: "flex:1 1 20rem" }, [
        E("p", { class: "kicker", text: T("home.kicker") }),
        E("h1", { id: "h-main", tabindex: "-1", text: T("home.title") }),
        E("span", { class: "tick", "aria-hidden": "true" }),
        E("p", { class: "lead", text: T("home.lead") }),
        E("p", { class: "promise", text: T("home.promise") }),
        E("span", { class: "stamp", text: T("home.pill") })
      ]),
      E("div", { style: "flex:1 1 16rem; max-width:26rem", "data-art": "home.hero", "data-decorative": "" })
    ]));
    var grid = E("div", { class: "grid", style: "margin-top:1.4rem" });
    TOOLS.forEach(function (t, i) {
      var card = E("section", { class: "tool-card", "aria-labelledby": "tc-" + t.id });
      card.appendChild(E("span", { class: "num", "aria-hidden": "true", text: String(i + 1) }));
      card.appendChild(E("div", { class: "pic" }, [E("img", { src: HK.icon(t.icon), alt: "", width: "72", height: "72" })]));
      card.appendChild(E("div", { class: "body" }, [
        E("h2", { id: "tc-" + t.id, text: T("home.t." + t.id + ".name") }),
        E("p", { text: T("home.t." + t.id + ".d") }),
        E("p", { class: "meta", text: T("home.t." + t.id + ".m") }),
        E("a", { class: "btn primary", "data-keep": t.dir + "/index.html", href: HK.href(t.dir + "/index.html"), "aria-label": T("home.open") + " " + T("home.t." + t.id + ".name") }, [T("home.open")]),
        E("p", { class: "fine", style: "margin:0.6rem 0 0" }, [E("a", { href: "_docs/" + t.doc, text: T("home.teacher") })])
      ]));
      grid.appendChild(card);
    });
    APP.appendChild(grid);
    APP.appendChild(E("div", { class: "note", style: "margin-top:1.6rem" }, [E("span", { class: "label", text: T("home.how.h") }),
      E("ul", { style: "margin:0" }, [1, 2, 3, 4].map(function (n) { return E("li", { text: T("home.how." + n) }); }))]));
    HK.refreshArt();
  }
  HK.onLang(build);
  HK.boot();
  build();
})();
