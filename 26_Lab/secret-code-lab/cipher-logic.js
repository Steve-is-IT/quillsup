/* Secret Code Lab: ciphers as pure functions (browser and Node tests). Letters A-Z only; everything else passes through. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../assets/js/util.js"));
  else root.CipherLogic = factory(root.HKUtil);
})(typeof self !== "undefined" ? self : this, function (U) {
  "use strict";
  var AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  /* The mixed-alphabet key from 3-5 Reproducibles R-4.2 */
  var GUIDE_KEY = "QWERTYUIOPASDFGHJKLZXCVBNM";

  function mod(n, m) { return ((n % m) + m) % m; }

  function shift(text, key) {
    var out = "";
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i).toUpperCase(), p = AZ.indexOf(ch);
      out += p < 0 ? text.charAt(i) : AZ.charAt(mod(p + key, 26));
    }
    return out;
  }
  function shiftEncode(text, key) { return shift(text, key); }
  function shiftDecode(text, key) { return shift(text, -key); }

  function isValidKey(key) {
    if (typeof key !== "string" || key.length !== 26) return false;
    var seen = {};
    for (var i = 0; i < 26; i++) { var c = key.charAt(i); if (AZ.indexOf(c) < 0 || seen[c]) return false; seen[c] = true; }
    return true;
  }
  function mixedEncode(text, key) {
    var out = "";
    for (var i = 0; i < text.length; i++) { var p = AZ.indexOf(text.charAt(i).toUpperCase()); out += p < 0 ? text.charAt(i) : key.charAt(p); }
    return out;
  }
  function mixedDecode(text, key) {
    var out = "";
    for (var i = 0; i < text.length; i++) { var p = key.indexOf(text.charAt(i).toUpperCase()); out += (AZ.indexOf(text.charAt(i).toUpperCase()) < 0) ? text.charAt(i) : AZ.charAt(p); }
    return out;
  }
  function randomKey(rng) { return U.shuffle(AZ.split(""), rng).join(""); }

  /* All 25 possible shifts of a ciphertext (the "try every key" view). */
  function allShifts(cipher) { var out = []; for (var k = 1; k <= 25; k++) out.push({ key: k, text: shiftDecode(cipher, k) }); return out; }

  function frequencies(text) {
    var f = {};
    for (var i = 0; i < text.length; i++) { var c = text.charAt(i); if (AZ.indexOf(c) >= 0) f[c] = (f[c] || 0) + 1; }
    return Object.keys(f).map(function (k) { return { letter: k, count: f[k] }; }).sort(function (a, b) { return b.count - a.count || (a.letter < b.letter ? -1 : 1); });
  }
  function distinctLetters(text) { return frequencies(text).map(function (x) { return x.letter; }).sort(); }

  /* Apply a partial guess table {cipherLetter: plainLetter} to a ciphertext; unknown letters show "_". */
  function applyGuess(cipher, guess) {
    var out = "";
    for (var i = 0; i < cipher.length; i++) { var c = cipher.charAt(i); out += AZ.indexOf(c) < 0 ? c : (guess[c] || "_"); }
    return out;
  }

  /* The challenge sets. Ciphertexts are COMPUTED from the plaintext, never typed by hand. */
  var PUZZLES = {
    en: [
      { id: "e1", type: "shift", key: 3, hintKey: true,  plain: "PAUSE CHECK TELL" },
      { id: "e2", type: "shift", key: 5, hintKey: true,  plain: "TELL A TRUSTED GROWNUP" },
      { id: "e3", type: "shift", key: 4, hintKey: false, plain: "YOU ARE NEVER IN TROUBLE FOR TELLING" },
      { id: "e4", type: "shift", key: 9, hintKey: false, plain: "A STRONG KEY MAKES A STRONG LOCK" },
      { id: "e5", type: "mixed", key: GUIDE_KEY, keyShown: true,  plain: "MEET AT THE OLD LIBRARY DOOR" },
      { id: "e6", type: "mixed", key: GUIDE_KEY, keyShown: true,  plain: "ASK A GROWNUP BEFORE YOU CLICK" },
      { id: "e7", type: "mixed", key: GUIDE_KEY, keyShown: false, plain: "SAVE THE MESSAGE AND SHOW SOMEONE YOU TRUST" }
    ],
    es: [
      { id: "s1", type: "shift", key: 3, hintKey: true,  plain: "PAUSA REVISA CUENTA" },
      { id: "s2", type: "shift", key: 5, hintKey: true,  plain: "CUENTALE A UN ADULTO" },
      { id: "s3", type: "shift", key: 2, hintKey: false, plain: "CUENTALE A ALGUIEN" },
      { id: "s4", type: "shift", key: 7, hintKey: false, plain: "NUNCA COMPARTAS TU CLAVE" },
      { id: "s5", type: "mixed", key: GUIDE_KEY, keyShown: true,  plain: "NOS VEMOS EN LA BIBLIOTECA" },
      { id: "s6", type: "shift", key: 6, hintKey: false, plain: "GUARDA LA CLAVE EN SECRETO" },
      { id: "s7", type: "mixed", key: GUIDE_KEY, keyShown: false, plain: "PREGUNTA PRIMERO" }
    ]
  };
  function cipherOf(p) { return p.type === "shift" ? shiftEncode(p.plain, p.key) : mixedEncode(p.plain, p.key); }

  /* Sentences and word chips for the encoder (no free typing anywhere). */
  var SENTENCES = {
    en: ["PAUSE CHECK TELL", "TELL A TRUSTED GROWNUP", "HACKLES UP", "A FALSE ALARM IS FINE", "NEVER SHARE YOUR PASSWORD", "IT IS NEVER YOUR FAULT", "ASK A GROWNUP BEFORE YOU CLICK"],
    es: ["PAUSA REVISA CUENTA", "CUENTALE A UN ADULTO", "NUNCA COMPARTAS TU CLAVE", "UNA FALSA ALARMA ESTA BIEN", "NUNCA ES TU CULPA", "PREGUNTA PRIMERO"]
  };
  var CHIPS = {
    en: ["PAUSE", "CHECK", "TELL", "A", "TRUSTED", "GROWNUP", "FRIEND", "HACKLES", "UP", "NEVER", "SHARE", "YOUR", "KEY", "SECRET", "IS", "SAFE"],
    es: ["PAUSA", "REVISA", "CUENTA", "UN", "ADULTO", "DE", "CONFIANZA", "AMIGO", "NUNCA", "COMPARTAS", "TU", "CLAVE", "SECRETO", "ES", "SEGURO", "PIEL"]
  };

  return { AZ: AZ, GUIDE_KEY: GUIDE_KEY, shiftEncode: shiftEncode, shiftDecode: shiftDecode, isValidKey: isValidKey, mixedEncode: mixedEncode,
           mixedDecode: mixedDecode, randomKey: randomKey, allShifts: allShifts, frequencies: frequencies, distinctLetters: distinctLetters,
           applyGuess: applyGuess, PUZZLES: PUZZLES, cipherOf: cipherOf, SENTENCES: SENTENCES, CHIPS: CHIPS };
});
