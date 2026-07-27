/* Sage Stage — default English packs (design: docs/english-widgets-design.md §4.4, §9).
   Pure data, like templates.js. One envelope (sage-pack@1), six kinds eventually;
   two are here now — phonics (phoneme tiles) and genre (the genre toolkit,
   docs/genre-toolkit-design.md §13). Everything here is either our own wording
   or Crown-copyright material used under the Open Government Licence v3 — branded
   scheme content (RWI, Little Wandle, Jolly Phonics…) is never shipped; schools
   paste their scheme's wording into their own packs (§11).

   The genre packs' criteria use National Curriculum terminology (fronted
   adverbial, relative clause, expanded noun phrase, modal verb) freely — that is
   Crown copyright under OGL — but the criteria themselves are worded here, and no
   scheme's phrasing appears. `model` is empty in every one of them on purpose: a
   school's WAGOLL is a school's own, and a published model text is somebody's
   copyright (genre-toolkit-design.md §3). */
window.SAGE_ENGLISH_PACKS = [
  {
    format: 'sage-pack@1',
    kind: 'phonics',
    id: 'letters-and-sounds-2007',
    name: 'Letters and Sounds (2007)',
    author: 'Sage Stage',
    note: 'GPC teaching order and tricky words from the DfE "Letters and Sounds" (2007) — Crown copyright, Open Government Licence v3. Phase 1 is oral (no graphemes); Phase 4 introduces adjacent consonants, no new GPCs; split digraphs use a_e notation.',
    phases: [
      {
        id: '2', name: 'Phase 2',
        sets: [
          ['s', 'a', 't', 'p'],
          ['i', 'n', 'm', 'd'],
          ['g', 'o', 'c', 'k'],
          ['ck', 'e', 'u', 'r'],
          ['h', 'b', 'f', 'ff', 'l', 'll', 'ss'],
        ],
        tricky: ['the', 'to', 'I', 'no', 'go', 'into'],
      },
      {
        id: '3', name: 'Phase 3',
        sets: [
          ['j', 'v', 'w', 'x'],
          ['y', 'z', 'zz', 'qu'],
          ['ch', 'sh', 'th', 'ng'],
          ['ai', 'ee', 'igh', 'oa'],
          ['oo', 'ar', 'or', 'ur'],
          ['ow', 'oi', 'ear', 'air'],
          ['ure', 'er'],
        ],
        tricky: ['he', 'she', 'we', 'me', 'be', 'was', 'you', 'they', 'all', 'are', 'my', 'her'],
      },
      {
        id: '4', name: 'Phase 4',
        sets: [], // adjacent consonants — no new GPCs; the tray stays cumulative
        tricky: ['said', 'have', 'like', 'so', 'do', 'some', 'come', 'were', 'there', 'little', 'one', 'when', 'out', 'what'],
      },
      {
        id: '5', name: 'Phase 5',
        sets: [
          ['ay', 'ou', 'ie', 'ea'],
          ['oy', 'ir', 'ue', 'aw'],
          ['wh', 'ph', 'ew', 'oe'],
          ['au', 'a_e', 'e_e', 'i_e'],
          ['o_e', 'u_e'],
        ],
        tricky: ['oh', 'their', 'people', 'Mr', 'Mrs', 'looked', 'called', 'asked', 'could'],
      },
    ],
  },

  // ---------------------------------------------------------------- genre packs
  // Four of the twelve in §9's list, chosen to span the text types so the widget
  // is proven against real variety rather than four flavours of the same shape:
  // one story, one recount-shaped report, one non-fiction explanation, one
  // argument. The other eight are a data-only follow-up.
  //
  // Bands are ks1 (Reception–Y2), lks2 (Y3–4), uks2 (Y5–6). Three, not seven: a
  // criterion does not change between Year 3 and Year 4, and a criterion the
  // class has outgrown is one the teacher deletes rather than one we predicted.
  {
    format: 'sage-pack@1',
    kind: 'genre',
    id: 'narrative',
    name: 'Narrative',
    author: 'Sage Stage',
    note: 'Story writing across the primary range. The KS1 criteria are about getting a whole story down; the upper KS2 ones are about controlling how it lands on a reader.',
    items: [
      { t: 'A beginning that says who and where', band: 'ks1' },
      { t: 'Joining words: and, but, so', band: 'ks1' },
      { t: 'A capital letter and a full stop in every sentence', band: 'ks1' },
      { t: 'Describing words for the characters', band: 'ks1' },
      { t: 'A problem the character has to solve', band: 'ks1' },
      { t: 'An opening that sets the scene', band: 'lks2' },
      { t: 'Fronted adverbials with a comma', band: 'lks2' },
      { t: 'Expanded noun phrases to describe', band: 'lks2' },
      { t: 'Speech inside inverted commas', band: 'lks2' },
      { t: 'Paragraphs to show a change of time or place', band: 'lks2' },
      { t: 'An ending that solves the problem', band: 'lks2' },
      { t: 'An opening that hooks — action, speech or setting', band: 'uks2' },
      { t: 'Relative clauses to add detail', band: 'uks2' },
      { t: 'Show, don’t tell: feelings through action', band: 'uks2' },
      { t: 'Sentence lengths varied for pace', band: 'uks2' },
      { t: 'Dialogue that moves the story on', band: 'uks2' },
      { t: 'An ending that echoes the opening', band: 'uks2' },
    ],
    structure: [
      { box: 'Opening', hint: 'Who, where, when — and a reason to read on' },
      { box: 'Build-up', hint: 'Something starts to go wrong' },
      { box: 'Problem', hint: 'The moment it all goes wrong' },
      { box: 'Resolution', hint: 'How it is put right' },
      { box: 'Ending', hint: 'How things are now, and what changed' },
    ],
    language: {
      openers: ['Early one morning', 'Without warning', 'As soon as', 'Long before dawn',
        'Deep in the forest', 'The moment she turned', 'By the time anyone noticed',
        'Somewhere behind them'],
      connectives: ['meanwhile', 'suddenly', 'until then', 'at last', 'moments later',
        'all the while', 'no sooner', 'even so'],
      vocabulary: ['glanced', 'hesitated', 'trembling', 'deserted', 'whispered', 'edged',
        'frantic', 'gloom', 'brittle', 'sank'],
    },
    model: '',
  },
  {
    format: 'sage-pack@1',
    kind: 'genre',
    id: 'newspaper-report',
    name: 'Newspaper report',
    author: 'Sage Stage',
    note: 'The recount shape at its most disciplined. KS1 works on ordering what happened; KS2 on the tone and the sourcing that make it read like a newspaper rather than a diary.',
    items: [
      { t: 'A headline that makes you want to read on', band: 'ks1' },
      { t: 'Who it happened to, and where', band: 'ks1' },
      { t: 'What happened, in order', band: 'ks1' },
      { t: 'A picture with a caption', band: 'ks1' },
      { t: 'The 5 Ws in the opening paragraph', band: 'lks2' },
      { t: 'Past tense all the way through', band: 'lks2' },
      { t: 'Third person — the reporter never says I or we', band: 'lks2' },
      { t: 'A quote from a witness in inverted commas', band: 'lks2' },
      { t: 'A paragraph for each part of the story', band: 'lks2' },
      { t: 'A headline using wordplay or alliteration', band: 'uks2' },
      { t: 'A subheading that adds information', band: 'uks2' },
      { t: 'A formal, impersonal tone', band: 'uks2' },
      { t: 'Direct and reported speech from more than one source', band: 'uks2' },
      { t: 'A closing paragraph that looks ahead', band: 'uks2' },
    ],
    structure: [
      { box: 'Headline', hint: 'Short and punchy — present tense' },
      { box: 'Opening', hint: 'Who, what, where, when, why — in two sentences' },
      { box: 'What happened', hint: 'The events in the order they happened' },
      { box: 'Quote', hint: 'A witness or an expert speaks' },
      { box: 'Closing', hint: 'What happens next?' },
    ],
    language: {
      openers: ['Yesterday evening', 'Earlier this week', 'Witnesses report that',
        'In a dramatic turn', 'Shortly after midday', 'Local residents say',
        'According to police', 'For the second time this month'],
      connectives: ['however', 'meanwhile', 'as a result', 'furthermore', 'in addition',
        'nevertheless', 'consequently', 'at the same time'],
      vocabulary: ['eyewitness', 'incident', 'reportedly', 'investigation', 'alleged',
        'dramatic', 'scene', 'official', 'confirmed', 'appealed'],
    },
    model: '',
  },
  {
    format: 'sage-pack@1',
    kind: 'genre',
    id: 'explanation',
    name: 'Explanation',
    author: 'Sage Stage',
    note: 'How and why something works — the genre science, history and geography write-ups actually live in. Cross-curricular by nature (§13 of the English set design).',
    items: [
      { t: 'A title that says what you are explaining', band: 'ks1' },
      { t: 'The steps in the right order', band: 'ks1' },
      { t: 'Using “because” to give a reason', band: 'ks1' },
      { t: 'A labelled picture', band: 'ks1' },
      { t: 'An opening that says what is being explained', band: 'lks2' },
      { t: 'Present tense all the way through', band: 'lks2' },
      { t: 'Time connectives to sequence the steps', band: 'lks2' },
      { t: 'Causal conjunctions: because, so, so that', band: 'lks2' },
      { t: 'A diagram with labels', band: 'lks2' },
      { t: 'A general opening statement', band: 'uks2' },
      { t: 'Technical vocabulary used accurately', band: 'uks2' },
      { t: 'The passive voice where the doer does not matter', band: 'uks2' },
      { t: 'Subordinate clauses to pack in detail', band: 'uks2' },
      { t: 'A closing that says why it matters', band: 'uks2' },
    ],
    structure: [
      { box: 'Title', hint: 'A question, or a naming phrase' },
      { box: 'What it is', hint: 'One sentence saying what is being explained' },
      { box: 'How it works', hint: 'Each stage in order, each with its reason' },
      { box: 'Why it matters', hint: 'What it means for the reader' },
    ],
    language: {
      openers: ['This happens when', 'The process begins', 'Before this can happen',
        'At this stage', 'Once this is complete', 'The reason for this is',
        'In simple terms', 'To understand this'],
      connectives: ['because', 'so that', 'which means', 'consequently', 'therefore',
        'as a result', 'in order to', 'this causes'],
      vocabulary: ['process', 'stage', 'cause', 'effect', 'function', 'system', 'source',
        'transfer', 'convert', 'rely on'],
    },
    model: '',
  },
  {
    format: 'sage-pack@1',
    kind: 'genre',
    id: 'persuasion',
    name: 'Persuasion',
    author: 'Sage Stage',
    note: 'Argument and persuasive writing. The upper KS2 criteria are the ones that separate persuading from shouting: the counter-argument answered, and emotive language chosen rather than sprayed.',
    items: [
      { t: 'A title that tells the reader what you want', band: 'ks1' },
      { t: 'Reasons for what you think', band: 'ks1' },
      { t: 'Using “because” to explain a reason', band: 'ks1' },
      { t: 'Words that sound sure: best, must, should', band: 'ks1' },
      { t: 'An opening that states your view clearly', band: 'lks2' },
      { t: 'A reason in each paragraph', band: 'lks2' },
      { t: 'Facts and figures to back a reason up', band: 'lks2' },
      { t: 'Rhetorical questions to make the reader think', band: 'lks2' },
      { t: 'A closing that repeats what you want', band: 'lks2' },
      { t: 'A strong opening — a question, a statistic or a bold claim', band: 'uks2' },
      { t: 'The other side acknowledged, then answered', band: 'uks2' },
      { t: 'Emotive language chosen on purpose', band: 'uks2' },
      { t: 'The rule of three for emphasis', band: 'uks2' },
      { t: 'Modal verbs to press the point', band: 'uks2' },
      { t: 'A closing call to action', band: 'uks2' },
    ],
    structure: [
      { box: 'Title', hint: 'What you want the reader to do' },
      { box: 'Your view', hint: 'State it in one clear sentence' },
      { box: 'Reason', hint: 'The strongest one first, with evidence' },
      { box: 'Another reason', hint: 'A second reason, with evidence' },
      { box: 'The other side', hint: 'Name what they would say, then answer it' },
      { box: 'Call to action', hint: 'Exactly what the reader should do now' },
    ],
    language: {
      openers: ['It is clear that', 'Imagine a world where', 'Surely nobody would argue',
        'Consider this for a moment', 'The evidence is overwhelming', 'Every one of us',
        'How much longer', 'There is no doubt'],
      connectives: ['furthermore', 'in addition', 'however', 'above all', 'therefore',
        'not only that', 'on the other hand', 'most importantly'],
      vocabulary: ['essential', 'unacceptable', 'vital', 'urgently', 'undeniably',
        'shocking', 'deserve', 'demand', 'protect', 'future'],
    },
    model: '',
  },
];
