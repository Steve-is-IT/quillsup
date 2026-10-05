/* Generated from art.json by _build/sync_art.py. Edit art.json, not this file. */
window.HK_ART = {
 "_readme": "Swap art here. Each slot (a place in the Lab) points at a character entry; each character entry points at an image file inside assets/ (png, svg or webp). To use the illustrator's art, drop the new files into assets/art/ and change the 'src' values. Then run: python kit/26_Lab/_build/sync_art.py (it rewrites assets/art.js, which is what browsers read when the Lab is opened from a folder, because browsers block reading JSON from file://). 'alt' is read aloud by screen readers; update it when the picture changes. A character with src null uses a simple drawn placeholder (fallback).",
 "version": 1,
 "status": "PLACEHOLDER art from kit/09_Art/characters, unmodified. Replace with the illustrator's final art.",
 "characters": {
  "hackle_happy": {
   "src": "art/hackle_happy.png",
   "alt": {
    "en": "Hackle, a baby hedgehog with yellow quills tipped orange, smiling",
    "es": "Hackle, una cría de erizo con púas amarillas de puntas naranja, sonriendo"
   }
  },
  "hackle_up": {
   "src": "art/hackle_up.png",
   "alt": {
    "en": "Hackle with the orange-tipped quills standing straight up",
    "es": "Hackle con las púas naranja levantadas"
   }
  },
  "hackle_curious": {
   "src": "art/hackle_curious.png",
   "alt": {
    "en": "Hackle looking curious",
    "es": "Hackle con cara de curiosidad"
   }
  },
  "hackle_helping": {
   "src": "art/hackle_helping.png",
   "alt": {
    "en": "Hackle holding out a helping paw",
    "es": "Hackle ofreciendo una patita de ayuda"
   }
  },
  "hackle_proud": {
   "src": "art/hackle_proud.png",
   "alt": {
    "en": "Hackle looking proud",
    "es": "Hackle con aire orgulloso"
   }
  },
  "hackle_silly": {
   "src": "art/hackle_silly.png",
   "alt": {
    "en": "Hackle being silly",
    "es": "Hackle haciendo una cara graciosa"
   }
  },
  "hackle_down": {
   "src": "art/hackle_down.png",
   "alt": {
    "en": "Hackle calm, with the quills lying flat",
    "es": "Hackle tranquilo, con las púas relajadas"
   }
  },
  "hackle_sleepy": {
   "src": "art/hackle_sleepy.png",
   "alt": {
    "en": "Hackle looking sleepy",
    "es": "Hackle con sueño"
   }
  },
  "peeper": {
   "src": "art/peeper.png",
   "alt": {
    "en": "Peeper, a big-eyed blue owl with a magnifying glass",
    "es": "Peeper, un búho azul de ojos grandes con una lupa"
   }
  },
  "latch": {
   "src": "art/latch.png",
   "alt": {
    "en": "Latch, a friendly green padlock",
    "es": "Latch, un candado verde y amistoso"
   }
  },
  "pip": {
   "src": "art/pip.png",
   "alt": {
    "en": "Pip, a snail with a privacy shell",
    "es": "Pip, un caracol con su concha de privacidad"
   }
  },
  "buddy": {
   "src": "art/buddy.png",
   "alt": {
    "en": "Buddy, a purple bear with a heart",
    "es": "Buddy, un oso morado con un corazón"
   }
  },
  "ember": {
   "src": "art/ember.png",
   "alt": {
    "en": "Ember, a teal flame with a warm glow",
    "es": "Ember, una llama turquesa con un brillo cálido"
   }
  },
  "fixit": {
   "src": "art/fixit.png",
   "alt": {
    "en": "Fixit, an orange robot with a wrench and a plaster",
    "es": "Fixit, un robot naranja con una llave inglesa y una curita"
   }
  },
  "crew": {
   "src": "art/crew_group.png",
   "alt": {
    "en": "The Hackles crew: Latch, Peeper, Pip, Hackle, Ember, Buddy and Fixit",
    "es": "El equipo de Hackles: Latch, Peeper, Pip, Hackle, Ember, Buddy y Fixit"
   }
  },
  "gifty": {
   "src": null,
   "fallback": "giftbox",
   "alt": {
    "en": "Gifty, a silly gold gift box with a tiny hook (placeholder drawing)",
    "es": "Gifty, una caja de regalo dorada y graciosa con un anzuelito (dibujo provisional)"
   }
  }
 },
 "slots": {
  "brand.mark": "hackle_happy",
  "home.hero": "crew",
  "fishy.hero": "peeper",
  "fishy.good": "hackle_proud",
  "fishy.kind": "hackle_helping",
  "fishy.think": "peeper",
  "fishy.done": "hackle_proud",
  "passphrase.hero": "latch",
  "passphrase.done": "latch",
  "secret.hero": "hackle_silly",
  "secret.done": "hackle_proud",
  "detective.hero": "peeper",
  "detective.protect": "hackle_helping",
  "ornot.hero": "hackle_up",
  "ornot.calm": "hackle_down",
  "ornot.good": "hackle_happy",
  "ornot.ladder": "buddy",
  "trail.hero": "crew",
  "trail.gifty": "gifty",
  "trail.fixit": "fixit",
  "trail.breathe": "hackle_sleepy",
  "trail.peak": "hackle_proud",
  "trail.team.1": "latch",
  "trail.team.2": "peeper",
  "trail.team.3": "pip",
  "trail.team.4": "buddy",
  "trail.team.5": "ember",
  "trail.team.6": "fixit"
 },
 "icons": {
  "spot": "icons/icon_spot_it.svg",
  "passphrase": "icons/icon_lock_it.svg",
  "secret": "icons/orn_registration.svg",
  "detective": "icons/icon_share_smart.svg",
  "ornot": "icons/icon_kind_and_well.svg",
  "trail": "icons/icon_safe_people.svg"
 }
};
