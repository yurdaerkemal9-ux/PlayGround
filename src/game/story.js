export const MEMORIES = [
  {
    id: 'foyer',
    index: 1,
    title: 'The First Candle',
    room: 'The Grand Foyer',
    text: 'A little girl kneels on the foyer floor, cupping a match against the dark. She lights one candle, then another. A small blue cat watches from the stairs, ears tall, one eye blue and one amber. The girl laughs. “There you are,” she says. “I was beginning to think the house had eaten you.”',
    sub: 'Foyer · the dust-veiled portrait',
    hint: 'A portrait in the foyer seems to be watching you.',
    art: 0,
    wisp: { x: -6.85, y: 2.15, z: 10.9 },
  },
  {
    id: 'piano',
    index: 2,
    title: 'A Song for Rainy Days',
    room: 'The Living Room',
    text: 'Rain taps the windows. Elara plays the same four notes, over and over, until they stop sounding like music and start sounding like a question. You curl on the piano bench beside her. When she reaches the last note, she rests her hand on your head. The house is warm. The rain is only rain.',
    sub: 'Living room · the grand piano',
    hint: 'The grand piano in the living room remembers a song. A sheet of music rests nearby.',
    art: 1,
    wisp: { x: -12.4, y: 1.85, z: 3.4 },
  },
  {
    id: 'library',
    index: 3,
    title: 'The Secret Library',
    room: 'The Library',
    text: 'She built a fort of blankets behind the shelves, where the house could not find her. You were the brave little ghost who guarded the door. Elara read aloud until her voice went hoarse, and every so often she turned the book around so you could see the pictures. “You are my best listener,” she whispered.',
    sub: 'Library · the hidden alcove',
    hint: 'The library hides a passage. Three marked books — moon, star, feather — must be touched in the right order.',
    art: 2,
    wisp: { x: -12.0, y: 1.35, z: -10.95 },
  },
  {
    id: 'dining',
    index: 4,
    title: 'Sunday Breakfast',
    room: 'The Dining Room',
    text: 'Sunday mornings smelled of toast and beeswax. Elara’s mother set the table with the good china, and Elara slipped you crumbs beneath the cloth when no one was looking. In the locket at her throat was a picture of a house, a girl, and a small blue cat. Some things are too small to be remembered unless someone keeps them.',
    sub: 'Dining room · the locked china cabinet',
    hint: 'The dining room cabinet is locked. A small brass key is missing from the kitchen drawer.',
    art: 3,
    wisp: { x: 18.85, y: 1.75, z: 8.2 },
  },
  {
    id: 'basement',
    index: 5,
    title: 'Below the House',
    room: 'The Cellar',
    text: 'The thunder was so loud the whole house shook. You hid in the cellar behind the old chest, certain the sky was falling. Footsteps on the stairs. A lantern. Elara’s face, streaked with tears because she thought she had lost you. She carried you upstairs wrapped in her cardigan. “Silly cat,” she said. “The storm can’t get you here.”',
    sub: 'Cellar · the little hidden chest',
    hint: 'The cellar is locked. The garden shed might hold its key.',
    art: 4,
    wisp: { x: 15.6, y: -2.75, z: -5.6 },
  },
  {
    id: 'childroom',
    index: 6,
    title: 'The Little Window',
    room: "The Child's Bedroom",
    text: 'Every afternoon you waited in the little window, watching the lane for her bicycle. She always came home before the lamps were lit. Always. Until the autumn she went away to school, and the lane stayed empty, and the lamps came on without her. Still, you waited. You were very good at waiting. You had so much practice.',
    sub: "Child's bedroom · the music box in the toy chest",
    hint: "A toy chest in the child's bedroom holds a music box. Open it.",
    art: 5,
    wisp: { x: 15.6, y: 6.3, z: 11.3 },
  },
  {
    id: 'attic',
    index: 7,
    title: 'The Last Candle',
    room: 'The Attic',
    text: 'Elara came back grown up, with grey at her temples and a suitcase she did not unpack. She found you in the attic, curled on a trunk of old toys. She held you for a long time. “I’m sorry I left you,” she said. “I’m sorry the house kept you.” Then she lit a candle and set it by the window, and you understood: she had not forgotten. She had only been away.',
    sub: 'Attic · the old trunk beneath the skylight',
    hint: 'The attic door needs an iron key. The library has a hidden alcove.',
    art: 6,
    wisp: { x: -14.0, y: 5.85, z: 9.0 },
  },
];

export const MEMORY_BY_ID = Object.fromEntries(MEMORIES.map(m => [m.id, m]));

export const ITEMS = {
  brassKey: { name: 'Small brass key', icon: '⚿', note: 'From the kitchen drawer. It smells faintly of silver polish.' },
  cellarKey: { name: 'Heavy iron key', icon: '⚿', note: 'From the garden shed. Cold, and flecked with rust.' },
  atticKey: { name: 'Old iron key', icon: '⚿', note: 'Found in the hidden library alcove. Its bow is shaped like a crescent moon.' },
};

export const ROOM_ORDER = ['foyer', 'corridor', 'living', 'library', 'dining', 'kitchen', 'garden', 'hall', 'master', 'nursery', 'childroom', 'attic', 'basement'];

export const PUZZLE_NOTES = {
  piano: ['Moonlight', 'a star', 'a feather', 'a heart'],
  library: ['Moon', 'Star', 'Feather'],
};

export const LORE = {
  front_door: {
    title: 'The Sealed Door',
    text: 'The brass is cold. Beyond the stained glass, rain falls on an empty lane. The door will not move — not because it is locked, but because something in the house is holding it shut. Or holding you here.',
  },
  foyer_clock: {
    title: 'Ten Past Three',
    text: 'The pendulum swings, but the hands are frozen at ten past three. A fine grey dust rests on the glass. Time seems to be waiting for something in this house to finish.',
  },
  foyer_mirror: {
    title: 'A Small Blue Shape',
    text: 'A blue shape wavers in the tarnished silver — ears, tail, one blue eye and one amber. When you lean closer, it leans too. You are not sure which of you is the reflection.',
  },
  master_letter: {
    title: 'A Letter, Never Sent',
    text: '“My dearest Elara, the house is quieter without you. The little cat waits by the window every evening. I think she believes you will come back before dark.” The ink has faded to brown. The letter is folded very small, as if it was carried in a pocket for years.',
  },
  kitchen_note: {
    title: 'A Hurried Note',
    text: '“Cellar key is in the garden shed. Don’t let the candles go out.” The handwriting wobbles, as if written in a hurry. Beneath it, someone has drawn a small cat with very tall ears.',
  },
  shed_note: {
    title: 'Tucked Beneath a Trowel',
    text: '“Cellar key. Lock it behind you. The damp gets into everything.” A tin of seeds sits beside the note, though nothing has been planted in the garden for a very long time.',
  },
  fountain: {
    title: 'The Old Fountain',
    text: 'The water is impossibly still. A stone cat sits at its centre, ears tall, one eye chipped away. Coins glimmer beneath the surface — wishes no one came back for.',
  },
  gazebo: {
    title: 'A Quiet Gazebo',
    text: 'Someone used to sit here on summer evenings. The bench still holds the shape of two small figures: one human, one with a tail. The lantern is warm, though no one has lit it.',
  },
  garden_gate: {
    title: 'The Garden Gate',
    text: 'Beyond the gate, the lane disappears into rain and dark. The iron bars are cold, but they do not feel cruel. They feel like a held breath. The way out is not here. Not yet.',
  },
  rune_plaque: {
    title: 'An Engraved Plaque',
    text: '“Moon greets star; the feather follows.” Beneath the words, three small symbols are worn smooth by fingertips. The bookcase behind the plaque has a seam where no seam should be.',
  },
  gramophone: {
    title: 'A Cracked Record',
    text: 'The needle hisses. For a moment, through the static, you hear a girl laughing and a piano playing four notes. Then the record ends, and the room is only a room again.',
  },
  garden_door_note: {
    title: 'Rain Beyond the Glass',
    text: 'Rain threads the dark outside. The garden smells of wet stone and night jasmine. The door is not locked.',
  },
  piano_sheet: {
    title: 'A Page of Handwritten Music',
    text: 'Four notes are circled in faded pencil, with words written beneath them in a child’s careful hand: “Moonlight, a star, a feather, a heart.” At the bottom, a small blue paw print has been pressed into the ink.',
  },
};

export const ENDING = {
  title: 'Every home remembers.',
  text: 'The seven flames lean toward the door at once. It opens — not to the rain, but to a warm afternoon that has been waiting for you all this time. Somewhere beyond it, a girl is laughing. You step into the light. Behind you, the house settles into quiet, and the last candle goes out.',
  short: 'You found every memory. The house let you go.',
};

export const ART_SVGS = [
  // 0: candle + girl + cat
  `<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g0" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#3a6d86"/><stop offset=".55" stop-color="#162b3c"/><stop offset="1" stop-color="#080e16"/></radialGradient>
    <radialGradient id="f0"><stop offset="0" stop-color="#ffe9b8"/><stop offset=".4" stop-color="#ffb85e" stop-opacity=".7"/><stop offset="1" stop-color="#ff9e3d" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="520" fill="url(#g0)"/>
    <ellipse cx="200" cy="430" rx="190" ry="120" fill="#0b121a" opacity=".7"/>
    <g opacity=".8"><path d="M50 150 Q110 80 190 110 L190 300 L50 300Z" fill="#122330" opacity=".5"/><path d="M350 120 Q300 70 220 100 L220 300 L350 300Z" fill="#0c1a26" opacity=".5"/></g>
    <circle cx="200" cy="230" r="150" fill="url(#f0)" opacity=".28"/>
    <g fill="#0a1118" opacity=".92">
      <ellipse cx="236" cy="350" rx="46" ry="88"/>
      <circle cx="236" cy="242" r="34"/>
      <path d="M212 208 Q196 160 226 196 Q240 176 252 210Z"/>
      <path d="M212 355 Q160 330 150 395 L210 410Z"/>
    </g>
    <g>
      <rect x="172" y="290" width="14" height="100" rx="4" fill="#c9b28a"/>
      <ellipse cx="179" cy="282" rx="17" ry="34" fill="#ffd88d" opacity=".9"/>
      <ellipse cx="179" cy="286" rx="34" ry="50" fill="url(#f0)" opacity=".6"/>
    </g>
    <g transform="translate(112 320)" opacity=".95">
      <ellipse cx="0" cy="42" rx="30" ry="36" fill="#77c8e8" opacity=".45"/>
      <circle cx="0" cy="2" r="28" fill="#8ed6ef" opacity=".55"/>
      <path d="M-22 -16 L-30 -70 L-6 -30Z" fill="#8ed6ef" opacity=".55"/>
      <path d="M20 -16 L30 -70 L6 -30Z" fill="#8ed6ef" opacity=".55"/>
      <circle cx="-9" cy="-2" r="6" fill="#1e6bbf"/><circle cx="10" cy="-2" r="6" fill="#ffc13b"/>
      <path d="M14 48 Q48 66 62 36 Q44 30 40 44" stroke="#8ed6ef" stroke-width="8" fill="none" opacity=".5" stroke-linecap="round"/>
    </g>
    <g fill="#ffd38a" opacity=".5"><circle cx="120" cy="100" r="2"/><circle cx="300" cy="180" r="2.5"/><circle cx="90" cy="260" r="1.8"/><circle cx="320" cy="320" r="2"/></g>
  </svg>`,
  // 1: piano + rain
  `<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#214052"/><stop offset=".6" stop-color="#152536"/><stop offset="1" stop-color="#09111a"/></linearGradient>
    <radialGradient id="l1"><stop offset="0" stop-color="#ffd894" stop-opacity=".8"/><stop offset="1" stop-color="#ffb166" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="520" fill="url(#g1)"/>
    <g stroke="#9bc9dd" stroke-width="1.2" opacity=".35">
      <path d="M30 0 L18 160 M70 0 L58 130 M110 0 L98 180 M150 0 L138 145 M340 0 L328 170 M300 0 L288 120 M260 0 L248 160"/>
    </g>
    <rect x="50" y="120" width="130" height="190" rx="6" fill="#0d1d2b" opacity=".7" stroke="#35566a"/>
    <rect x="62" y="132" width="106" height="166" fill="#1a3b52" opacity=".5"/>
    <circle cx="300" cy="130" r="38" fill="#e7f6ff" opacity=".25"/>
    <circle cx="300" cy="130" r="20" fill="#eaf8ff" opacity=".6"/>
    <g transform="translate(70 300)">
      <path d="M0 130 L0 60 Q0 20 60 10 L280 0 L280 30 Q280 60 240 62 L60 78 L60 130Z" fill="#080c10"/>
      <path d="M10 95 L260 78 L260 95 L10 112Z" fill="#dfd3b8"/>
      <g fill="#15171a"><rect x="40" y="88" width="12" height="24"/><rect x="76" y="86" width="12" height="24"/><rect x="112" y="84" width="12" height="24"/><rect x="148" y="82" width="12" height="24"/><rect x="184" y="80" width="12" height="24"/><rect x="220" y="78" width="12" height="24"/></g>
      <g stroke="#c9b78f" stroke-width="3" opacity=".8"><path d="M120 10 L120 -40 M145 8 L150 -38 M175 6 L190 -34"/></g>
    </g>
    <ellipse cx="240" cy="120" rx="120" ry="90" fill="url(#l1)" opacity=".3"/>
    <g transform="translate(200 250)">
      <ellipse cx="0" cy="50" rx="26" ry="34" fill="#7dc9e7" opacity=".4"/>
      <circle cx="0" cy="8" r="24" fill="#9cdcf2" opacity=".55"/>
      <path d="M-18 -8 L-24 -52 L-4 -20Z" fill="#9cdcf2" opacity=".55"/><path d="M16 -8 L26 -52 L4 -20Z" fill="#9cdcf2" opacity=".55"/>
      <circle cx="-8" cy="6" r="5" fill="#1e6bbf"/><circle cx="9" cy="6" r="5" fill="#ffc13b"/>
      <path d="M10 60 Q45 78 58 50" stroke="#7dc9e7" stroke-width="8" fill="none" opacity=".5" stroke-linecap="round"/>
    </g>
  </svg>`,
  // 2: bookshelf fort
  `<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g2"><stop offset="0" stop-color="#42331f"/><stop offset=".6" stop-color="#1c1710"/><stop offset="1" stop-color="#0a0805"/></linearGradient>
    <radialGradient id="l2"><stop offset="0" stop-color="#ffd18a"/><stop offset="1" stop-color="#ffb260" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="520" fill="url(#g2)"/>
    <g fill="#0c0a07" opacity=".85">
      <rect x="40" y="20" width="320" height="250"/>
      <rect x="50" y="30" width="300" height="12"/><rect x="50" y="90" width="300" height="12"/><rect x="50" y="150" width="300" height="12"/><rect x="50" y="210" width="300" height="12"/>
    </g>
    <g opacity=".7">
      <rect x="60" y="40" width="14" height="50" fill="#63343d"/><rect x="78" y="46" width="10" height="44" fill="#2e3d52"/><rect x="92" y="36" width="18" height="54" fill="#435e53"/><rect x="114" y="44" width="12" height="46" fill="#844f31"/><rect x="130" y="40" width="16" height="50" fill="#4a3050"/>
      <rect x="200" y="100" width="12" height="50" fill="#844f31"/><rect x="216" y="104" width="15" height="46" fill="#2e3d52"/><rect x="236" y="96" width="10" height="54" fill="#63343d"/>
      <rect x="70" y="220" width="16" height="30" fill="#2f4858"/><rect x="90" y="214" width="11" height="36" fill="#6b4b2a"/><rect x="106" y="222" width="14" height="28" fill="#3f5132"/>
    </g>
    <path d="M30 250 Q80 180 180 190 L280 198 Q350 210 370 270 L370 420 L30 420Z" fill="#b7a98e" opacity=".18"/>
    <path d="M45 280 Q120 210 210 220 L320 235 Q365 280 365 390 L35 390Z" fill="#cfc0a2" opacity=".14"/>
    <ellipse cx="210" cy="330" rx="160" ry="90" fill="url(#l2)" opacity=".2"/>
    <g transform="translate(190 300)">
      <ellipse cx="0" cy="52" rx="32" ry="42" fill="#7dc9e7" opacity=".4"/>
      <circle cx="0" cy="0" r="30" fill="#9cdcf2" opacity=".55"/>
      <path d="M-22 -12 L-32 -60 L-5 -25Z" fill="#9cdcf2" opacity=".55"/><path d="M20 -12 L32 -60 L5 -25Z" fill="#9cdcf2" opacity=".55"/>
      <circle cx="-10" cy="-2" r="6" fill="#1e6bbf"/><circle cx="11" cy="-2" r="6" fill="#ffc13b"/>
      <path d="M10 62 Q50 80 62 46" stroke="#7dc9e7" stroke-width="9" fill="none" opacity=".45" stroke-linecap="round"/>
    </g>
    <g transform="translate(260 250)" fill="#0c0a07" opacity=".85">
      <circle cx="0" cy="0" r="26"/><path d="M-30 30 Q0 6 30 30 L40 110 L-40 110Z"/>
    </g>
    <g fill="#ffd38a" opacity=".45"><circle cx="80" cy="100" r="2"/><circle cx="330" cy="180" r="2.4"/><circle cx="60" cy="360" r="1.8"/></g>
  </svg>`,
  // 3: dining locket
  `<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g3"><stop offset="0" stop-color="#4a2a2a"/><stop offset=".55" stop-color="#241315"/><stop offset="1" stop-color="#0d080a"/></linearGradient>
    <radialGradient id="l3"><stop offset="0" stop-color="#ffd79b"/><stop offset=".5" stop-color="#ffb266" stop-opacity=".45"/><stop offset="1" stop-color="#ff9d4d" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="520" fill="url(#g3)"/>
    <ellipse cx="200" cy="330" rx="180" ry="140" fill="#120a0b" opacity=".6"/>
    <ellipse cx="200" cy="300" rx="150" ry="70" fill="url(#l3)" opacity=".5"/>
    <g transform="translate(200 260)">
      <circle cx="0" cy="0" r="92" fill="#a8854c" opacity=".25"/>
      <circle cx="0" cy="0" r="78" fill="#1c1210" stroke="#d0a963" stroke-width="3"/>
      <circle cx="0" cy="0" r="66" fill="#2a1c19"/>
      <g transform="translate(0 -4)" opacity=".9">
        <path d="M-14 26 L14 26 L20 50 L-20 50Z" fill="#6c4a2e"/>
        <path d="M-26 26 L0 0 L26 26Z" fill="#4a3020"/>
        <circle cx="-24" cy="-2" r="16" fill="#7fc8e4" opacity=".55"/>
        <circle cx="-24" cy="-14" r="12" fill="#9cdcf2" opacity=".55"/>
        <path d="M-32 -6 L-38 -48 L-18 -18Z" fill="#9cdcf2" opacity=".55"/><path d="M-16 -6 L-8 -46 L-10 -18Z" fill="#9cdcf2" opacity=".55"/>
        <circle cx="36" cy="6" r="13" fill="#0a0c11" opacity=".7"/><path d="M24 20 Q36 0 48 20 L54 52 L18 52Z" fill="#0a0c11" opacity=".7"/>
      </g>
    </g>
    <g stroke="#d0a963" stroke-width="1" opacity=".3" fill="none">
      <circle cx="200" cy="260" r="110"/><circle cx="200" cy="260" r="120"/>
    </g>
    <g fill="#e6d2a6" opacity=".8" font-family="Georgia" font-size="10" font-style="italic" text-anchor="middle">
      <text x="200" y="430">for the small keeper of crumbs</text>
    </g>
    <g fill="#ffd38a" opacity=".4"><circle cx="90" cy="120" r="2"/><circle cx="320" cy="90" r="2.2"/><circle cx="70" cy="370" r="1.8"/></g>
  </svg>`,
  // 4: cellar storm
  `<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g4"><stop offset="0" stop-color="#2f3a3c"/><stop offset=".6" stop-color="#161d20"/><stop offset="1" stop-color="#080b0d"/></linearGradient>
    <radialGradient id="l4"><stop offset="0" stop-color="#ffcf85"/><stop offset="1" stop-color="#ffb15d" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="520" fill="url(#g4)"/>
    <g opacity=".25" stroke="#8fb2c1" stroke-width="1.5"><path d="M40 0 L20 120 M100 0 L84 90 M330 0 L310 140 M260 0 L246 100"/></g>
    <g fill="none" stroke="#9aa5a5" stroke-width="2" opacity=".35">
      <path d="M0 80 Q100 60 200 80 T400 70"/><path d="M0 90 Q110 70 210 90 T400 80"/>
    </g>
    <g fill="#0a0d0f" opacity=".8">
      <rect x="30" y="320" width="120" height="100" rx="4"/><rect x="290" y="330" width="90" height="120" rx="4"/>
    </g>
    <g transform="translate(200 280)">
      <rect x="-46" y="-10" width="92" height="120" rx="8" fill="#4e3422" opacity=".9"/>
      <rect x="-52" y="-18" width="104" height="18" rx="5" fill="#3b2718"/>
      <ellipse cx="0" cy="40" rx="80" ry="140" fill="url(#l4)" opacity=".22"/>
      <g transform="translate(0 88)">
        <ellipse cx="0" cy="0" rx="34" ry="28" fill="#7dc9e7" opacity=".4"/>
        <circle cx="0" cy="-24" r="26" fill="#9cdcf2" opacity=".55"/>
        <path d="M-20 -36 L-28 -80 L-6 -48Z" fill="#9cdcf2" opacity=".55"/><path d="M18 -36 L28 -80 L5 -48Z" fill="#9cdcf2" opacity=".55"/>
        <circle cx="-9" cy="-26" r="5" fill="#1e6bbf"/><circle cx="10" cy="-26" r="5" fill="#ffc13b"/>
      </g>
    </g>
    <g transform="translate(285 220)" opacity=".9">
      <rect x="0" y="0" width="34" height="42" rx="3" fill="#f3c67a" opacity=".75"/>
      <rect x="-4" y="-6" width="42" height="8" fill="#2b2118"/>
      <ellipse cx="17" cy="20" rx="80" ry="90" fill="url(#l4)" opacity=".45"/>
    </g>
    <g fill="#ffd38a" opacity=".35"><circle cx="70" cy="200" r="2"/><circle cx="330" cy="150" r="1.8"/></g>
  </svg>`,
  // 5: window waiting
  `<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g5"><stop offset="0" stop-color="#274458"/><stop offset=".6" stop-color="#122231"/><stop offset="1" stop-color="#080f17"/></linearGradient>
    <radialGradient id="l5"><stop offset="0" stop-color="#cfeaff" stop-opacity=".7"/><stop offset="1" stop-color="#7fc3e8" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="520" fill="url(#g5)"/>
    <g transform="translate(200 220)">
      <path d="M-105 10 Q-105 -80 0 -80 Q105 -80 105 10 L105 110 L-105 110Z" fill="#0c1a27" stroke="#3b5668" stroke-width="4"/>
      <path d="M-92 8 Q-92 -64 0 -64 Q92 -64 92 8 L92 96 L-92 96Z" fill="#24516b" opacity=".7"/>
      <circle cx="58" cy="-18" r="26" fill="#dff4ff" opacity=".55"/>
      <circle cx="58" cy="-18" r="52" fill="url(#l5)" opacity=".55"/>
      <g fill="#0c1a27" opacity=".8">
        <path d="M-92 70 Q-50 50 0 68 T92 62 L92 96 L-92 96Z"/>
        <rect x="-6" y="-64" width="12" height="160" fill="#122635"/><rect x="-92" y="-10" width="184" height="10" fill="#122635"/>
      </g>
      <g fill="#b8d6e3" opacity=".2"><path d="M-80 20 L-90 90 M-40 10 L-48 80 M70 0 L60 70"/></g>
    </g>
    <g transform="translate(200 390)">
      <ellipse cx="0" cy="10" rx="50" ry="46" fill="#7dc9e7" opacity=".35"/>
      <circle cx="0" cy="-22" r="34" fill="#9cdcf2" opacity=".55"/>
      <path d="M-26 -40 L-34 -92 L-7 -52Z" fill="#9cdcf2" opacity=".55"/><path d="M24 -40 L34 -92 L7 -52Z" fill="#9cdcf2" opacity=".55"/>
      <circle cx="-11" cy="-24" r="7" fill="#1e6bbf"/><circle cx="13" cy="-24" r="7" fill="#ffc13b"/>
      <path d="M18 28 Q58 46 70 10" stroke="#7dc9e7" stroke-width="10" fill="none" opacity=".45" stroke-linecap="round"/>
    </g>
    <g fill="#cfeaff" opacity=".35"><circle cx="70" cy="70" r="2"/><circle cx="330" cy="120" r="2.2"/><circle cx="90" cy="380" r="1.6"/></g>
  </svg>`,
  // 6: attic goodbye
  `<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g6"><stop offset="0" stop-color="#1c3550"/><stop offset=".5" stop-color="#132537"/><stop offset="1" stop-color="#080f16"/></linearGradient>
    <radialGradient id="l6"><stop offset="0" stop-color="#eaf8ff"/><stop offset=".35" stop-color="#a9d9f2" stop-opacity=".5"/><stop offset="1" stop-color="#7fc3e8" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="520" fill="url(#g6)"/>
    <g opacity=".4" stroke="#3e5568" stroke-width="8"><path d="M-20 140 L420 60 M-20 70 L420 160 M0 240 L400 190"/></g>
    <g opacity=".25" stroke="#53697a" stroke-width="4"><path d="M60 0 L150 520 M340 0 L250 520"/></g>
    <g transform="translate(200 150)">
      <rect x="-70" y="-60" width="140" height="120" rx="4" fill="#08131f" opacity=".7"/>
      <rect x="-58" y="-48" width="116" height="96" fill="#2b5d7c" opacity=".45"/>
      <path d="M-70 -60 L0 -100 L70 -60Z" fill="#08131f" opacity=".5"/>
      <circle cx="30" cy="-16" r="22" fill="#eaf8ff" opacity=".6"/>
      <circle cx="30" cy="-16" r="70" fill="url(#l6)" opacity=".4"/>
      <path d="M-58 -20 L58 -20 M0 -48 L0 48" stroke="#132b3c" stroke-width="5"/>
    </g>
    <path d="M110 150 L190 470 L340 470 L280 150Z" fill="#cfeeff" opacity=".06"/>
    <g transform="translate(200 400)">
      <ellipse cx="0" cy="16" rx="58" ry="26" fill="#0a121a" opacity=".7"/>
      <ellipse cx="0" cy="0" rx="48" ry="22" fill="#7dc9e7" opacity=".4"/>
      <circle cx="0" cy="-22" r="30" fill="#9cdcf2" opacity=".5"/>
      <path d="M-23 -36 L-30 -80 L-6 -48Z" fill="#9cdcf2" opacity=".5"/><path d="M22 -36 L31 -80 L6 -48Z" fill="#9cdcf2" opacity=".5"/>
      <circle cx="-10" cy="-24" r="6" fill="#1e6bbf" opacity=".8"/><circle cx="11" cy="-24" r="6" fill="#ffc13b" opacity=".8"/>
      <path d="M16 16 Q55 30 66 -2" stroke="#7dc9e7" stroke-width="9" fill="none" opacity=".4" stroke-linecap="round"/>
    </g>
    <g transform="translate(110 360)">
      <rect x="-8" y="-40" width="16" height="70" rx="4" fill="#dcc29a"/>
      <ellipse cx="0" cy="-48" rx="12" ry="24" fill="#ffe3a0" opacity=".85"/>
      <ellipse cx="0" cy="-50" rx="50" ry="64" fill="#ffcb74" opacity=".18"/>
    </g>
    <g fill="#dff4ff" opacity=".45"><circle cx="90" cy="100" r="2"/><circle cx="310" cy="240" r="2.2"/><circle cx="70" cy="300" r="1.6"/><circle cx="330" cy="430" r="1.8"/></g>
  </svg>`,
];
