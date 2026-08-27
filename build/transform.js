const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const g4Raw = fs.readFileSync(path.join(ROOT, 'practice_app_grade4.html'), 'utf8');
const g6Raw = fs.readFileSync(path.join(ROOT, 'practice_app.html'), 'utf8');

function extractBetween(text, startMarker, endMarker) {
  const s = text.indexOf(startMarker);
  const e = text.indexOf(endMarker, s);
  if (s === -1 || e === -1) throw new Error('marker not found: ' + startMarker + ' / ' + endMarker);
  return text.slice(s, e);
}

// ---- Extract the activity-implementation slice (skip header/registry, skip init call) ----
const g4Body = extractBetween(
  g4Raw,
  '// =====================================================================\n// 1. PLACE VALUE EXPLORER',
  '\n// ---------- init ----------'
);
const g6Body = extractBetween(
  g6Raw,
  '// =====================================================================\n// 1. PLACE VALUE DETECTIVE',
  '\n// ---------- init ----------'
);

function prefixIdentifiers(src, ids, prefix) {
  let out = src;
  // sort longest first so no partial-name issues (not strictly needed with \b but safer)
  const sorted = [...ids].sort((a, b) => b.length - a.length);
  for (const id of sorted) {
    const re = new RegExp('\\b' + id + '\\b', 'g');
    out = out.replace(re, prefix + id);
  }
  return out;
}

function prefixQuotedKeys(src, keys, prefix, patterns) {
  // patterns: functions that take a quoted-string form of the key we must rename, e.g. tutorHTML('key')
  let out = src;
  for (const key of keys) {
    for (const pat of patterns) {
      const re = new RegExp(pat.replace('KEY', key), 'g');
      out = out.replace(re, (m) => m.replace(`'${key}'`, `'${prefix}${key}'`));
    }
  }
  return out;
}

// =====================================================================
// GRADE 4 -> level "4"
// =====================================================================
const G4_IDS = [
  'renderPlaceValue','newPVQuestion','checkPV','pvState',
  'renderCompare','newCPQuestion','checkCP','cpState',
  'renderDoubleHalf','setDHLevel','markDHLevel','newDHQuestion','checkDH','dhState',
  'renderFillTen','newFTQuestion','checkFT','ftState',
  'renderAddSub','setASDigits','markASDigits','newASQuestion','checkAS','asState',
  'renderMultiply','setMPMode','markMPMode','newMPQuestion','checkMP','mpState',
  'renderDivide','setDVMode','markDVMode','newDVQuestion','checkDV','dvState',
  'renderNumSentence','newNSQuestion','checkNS','nsState',
  'renderTables','renderTTPicker','toggleTable','newTTQuestion','checkTT','ttState',
  'renderCompareFrac','fracValue','newCFQuestion','checkCF','cfState',
  'renderAddFrac','newAFQuestion','checkAF','afState',
  'renderLength','renderCapacity','renderMass','renderMeasure','newMSQuestion','checkMS','measState','MEASURE_CONFIG',
  'clockSVG','renderTime','setTMMode','markTMMode','newTMQuestion','checkTM','tmState',
  'renderShapes3D','setS3Level','markS3Level','newS3Question','checkS3','s3State','SHAPES_3D',
  'renderSymmetry','newSYQuestion','checkSY','syState','SYMMETRY_SHAPES',
  'renderGridRef','newGRQuestion','checkGR','grState','GRID_ITEMS',
  'angleSVG','renderAngles','newANQuestion','checkAN','anState',
  'renderTranslate','newTRQuestion','pickTR','checkTR','trState',
  'renderNumPattern','setNPLevel','markNPLevel','newNPQuestion','checkNP','npState',
  'patternCount','renderPatternStep','renderGeoPattern','setGPLevel','markGPLevel','newGPQuestion','checkGP','gpState',
];
const G4_KEYS = [
  'placevalue','compare','doublehalf','fillten','addsub','multiply','divide','numsentence',
  'tables','comparefrac','addfrac','length','capacity','mass','time','shapes3d','symmetry',
  'gridref','angles','translate','numpattern','geopattern',
];

let g4Out = prefixIdentifiers(g4Body, G4_IDS, 'g4_');
// quoted-key occurrences: tutorHTML('key'), levelNote(ACTIVITIES.key) uses bare property not quoted -> handle separately
g4Out = prefixQuotedKeys(g4Out, G4_KEYS, 'g4_', ["tutorHTML\\('KEY'\\)", "renderMeasure\\('KEY'"]);
// ACTIVITIES.<key> bare property access (levelNote(ACTIVITIES.time) etc.)
for (const key of G4_KEYS) {
  g4Out = g4Out.replace(new RegExp('ACTIVITIES\\.' + key + '\\b', 'g'), 'ACTIVITIES.g4_' + key);
}
// MEASURE_CONFIG object keys + measState.kind literal values ('length','capacity','mass')
for (const key of ['length', 'capacity', 'mass']) {
  // object literal key inside g4_MEASURE_CONFIG = { length: {...} }  -> only these three keys, safe since unique object
  g4Out = g4Out.replace(new RegExp('(g4_MEASURE_CONFIG = \\{[\\s\\S]*?\\n\\})', ''), (m) => m); // no-op placeholder
}
// Direct approach: within the MEASURE_CONFIG block and renderLength/Capacity/Mass calls, replace the literal quoted key
g4Out = g4Out.replace(/const g4_MEASURE_CONFIG = \{[\s\S]*?\n\};/, (block) => {
  return block
    .replace(/\blength:/, 'g4_length:')
    .replace(/\bcapacity:/, 'g4_capacity:')
    .replace(/\bmass:/, 'g4_mass:');
});
g4Out = g4Out
  .replace(/renderMeasure\('length'/, "renderMeasure('g4_length'")
  .replace(/renderMeasure\('capacity'/, "renderMeasure('g4_capacity'")
  .replace(/renderMeasure\('mass'/, "renderMeasure('g4_mass'")
  .replace(/g4_MEASURE_CONFIG\[measState\.kind\]/, 'g4_MEASURE_CONFIG[g4_measState.kind]');
// (measState already prefixed to g4_measState by identifier pass; fix the [ ] lookup which the identifier
// pass would have already turned into g4_MEASURE_CONFIG[g4_measState.kind] via word-boundary replace on measState)

fs.writeFileSync(path.join(__dirname, 'g4_body.js'), g4Out);

// =====================================================================
// GRADE 6 -> level "6"
// =====================================================================
const G6_IDS = [
  'renderPlaceValue','newPVQuestion','checkPV','pvState',
  'renderRounding','newRDQuestion','checkRD','rdState',
  'renderBonds','newBondQuestion','checkBond','bondState',
  'renderTables','renderTTPicker','toggleTable','newTTQuestion','checkTT','ttState',
  'renderFactFamily','newFFQuestion','normalizeFact','checkFF','ffState',
  'renderEquivFrac','newEFQuestion','checkEF','efState',
  'renderFDP','clearFDP','updateFDPReadout','newFDPTarget','fdpTarget',
  'renderFracOps','newFOQuestion','checkFO','foState',
  'renderRatio','newRAQuestion','checkRA','raState','RATIO_TEMPLATES',
  'renderShapes','newSHQuestion','checkSH','shState','SHAPES',
  'renderMirror','buildMirrorGrid','clearMirror','checkMirror','mmState','MIRROR_SHAPES',
  'renderDataBars','renderDBRows','renameDB','bumpDB','resetDB','renderDBChart','dbState',
  'renderWordProblems','newWPQuestion','checkWP','wpState','WORD_PROBLEM_TEMPLATES',
];
const G6_KEYS = [
  'placevalue','rounding','bonds','tables','factfamily','equivfrac','fdp','fracops',
  'ratio','shapes','mirror','databars','wordprobs',
];

let g6Out = prefixIdentifiers(g6Body, G6_IDS, 'g6_');
g6Out = prefixQuotedKeys(g6Out, G6_KEYS, 'g6_', ["tutorHTML\\('KEY'\\)"]);
// GROOVY -> BEACH (shared beach palette)
g6Out = g6Out.replace(/\bGROOVY\b/g, 'BEACH');
// cosmetic hex color alignment with the beach theme
g6Out = g6Out.replace(/#EA580C/g, '#E11D48').replace(/#D7C9EF/g, '#D9EEF3');

fs.writeFileSync(path.join(__dirname, 'g6_body.js'), g6Out);

console.log('G4 output chars:', g4Out.length);
console.log('G6 output chars:', g6Out.length);
console.log('--- sanity: leftover unprefixed identifiers? ---');
for (const id of G4_IDS) {
  const re = new RegExp('(?<!g4_)\\b' + id + '\\b', 'g');
  const matches = g4Out.match(re);
  if (matches) console.log('G4 leftover', id, matches.length);
}
for (const id of G6_IDS) {
  const re = new RegExp('(?<!g6_)\\b' + id + '\\b', 'g');
  const matches = g6Out.match(re);
  if (matches) console.log('G6 leftover', id, matches.length);
}
