// =====================================================================
// FOUNDATION - 1. COUNTING AND NUMBER RECOGNITION
// =====================================================================
let fp_cnState = { correct: 0, attempted: 0, answer: null, level: 'r' };
const FP_CN_MAX = { r: 10, g1: 100, g2: 200, g3: 1000 };
const FP_CN_LABEL = { r: 'Grade R (to 10)', g1: 'Grade 1 (to 100)', g2: 'Grade 2 (to 200)', g3: 'Grade 3 (to 1000)' };
function fp_renderCounting() {
  fp_cnState = { correct: 0, attempted: 0, answer: null, level: 'r' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔢 Counting and Number Recognition</h2>
      <p class="subtext">Before, after, or between? Choose a level to match where the child is at.</p>
      ${tutorHTML('fp_counting')}
      <div class="mcq-opts">
        ${Object.keys(FP_CN_MAX).map(l => `<div class="mcq-opt" id="fpcn-lvl-${l}" onclick="fp_setCNLevel('${l}')">${FP_CN_LABEL[l]}</div>`).join('')}
      </div>
      <div id="fpcn-score">${scoreHTML(fp_cnState)}</div>
      <div id="fpcn-question"></div>
      <div id="fpcn-feedback" class="feedback"></div>
    </div>
  `;
  fp_markCNLevel();
  fp_newCNQuestion();
}
function fp_setCNLevel(l) { fp_cnState.level = l; fp_markCNLevel(); fp_newCNQuestion(); }
function fp_markCNLevel() {
  Object.keys(FP_CN_MAX).forEach(l => document.getElementById('fpcn-lvl-' + l).classList.toggle('correct', fp_cnState.level === l));
}
function fp_newCNQuestion() {
  const max = FP_CN_MAX[fp_cnState.level];
  const sub = pick(['after', 'before', 'between']);
  let text, answer;
  if (sub === 'after') { const n = randInt(1, max - 1); text = `What number comes right after ${n}?`; answer = n + 1; }
  else if (sub === 'before') { const n = randInt(2, max); text = `What number comes right before ${n}?`; answer = n - 1; }
  else { const n = randInt(1, max - 2); text = `What number comes between ${n} and ${n + 2}?`; answer = n + 1; }
  fp_cnState.answer = answer;
  document.getElementById('fpcn-question').innerHTML = `
    <div class="q-box">${text} <input type="number" id="fpcn-in" autofocus style="width:90px;" /></div>
    <button class="action" onclick="fp_checkCN()">Check</button>
    <button class="secondary" onclick="fp_newCNQuestion()">Skip</button>
  `;
  document.getElementById('fpcn-feedback').className = 'feedback';
  const inputEl = document.getElementById('fpcn-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') fp_checkCN(); });
}
function fp_checkCN() {
  const v = parseInt(document.getElementById('fpcn-in').value);
  fp_cnState.attempted++;
  const fb = document.getElementById('fpcn-feedback');
  if (v === fp_cnState.answer) {
    fp_cnState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    const btn = document.querySelector('#fpcn-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newCNQuestion, 800);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${fp_cnState.answer}.`;
  }
  document.getElementById('fpcn-score').innerHTML = scoreHTML(fp_cnState);
}

// =====================================================================
// FOUNDATION - 2. ADDITION AND SUBTRACTION
// =====================================================================
let fp_asState = { correct: 0, attempted: 0, answer: null, level: 'g1' };
const FP_AS_MAX = { g1: 20, g2: 99, g3: 999 };
const FP_AS_LABEL = { g1: 'Grade 1 (within 20)', g2: 'Grade 2 (within 99)', g3: 'Grade 3 (within 999)' };
function fp_renderAddSub() {
  fp_asState = { correct: 0, attempted: 0, answer: null, level: 'g1' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">➕ Addition and Subtraction</h2>
      <p class="subtext">Choose a level, then fill in the missing answer.</p>
      ${tutorHTML('fp_addsub')}
      <div class="mcq-opts">
        ${Object.keys(FP_AS_MAX).map(l => `<div class="mcq-opt" id="fpas-lvl-${l}" onclick="fp_setASLevel('${l}')">${FP_AS_LABEL[l]}</div>`).join('')}
      </div>
      <div id="fpas-score">${scoreHTML(fp_asState)}</div>
      <div id="fpas-question"></div>
      <div id="fpas-feedback" class="feedback"></div>
    </div>
  `;
  fp_markASLevel();
  fp_newASQuestion();
}
function fp_setASLevel(l) { fp_asState.level = l; fp_markASLevel(); fp_newASQuestion(); }
function fp_markASLevel() {
  Object.keys(FP_AS_MAX).forEach(l => document.getElementById('fpas-lvl-' + l).classList.toggle('correct', fp_asState.level === l));
}
function fp_newASQuestion() {
  const max = FP_AS_MAX[fp_asState.level];
  const isAdd = Math.random() < 0.5;
  let a, b;
  if (isAdd) { a = randInt(1, max - 1); b = randInt(1, max - a); }
  else { a = randInt(1, max); b = randInt(0, a); }
  fp_asState.answer = isAdd ? a + b : a - b;
  document.getElementById('fpas-question').innerHTML = `
    <div class="q-box">${a} ${isAdd ? '+' : '-'} ${b} = <input type="number" id="fpas-in" autofocus /></div>
    <button class="action" onclick="fp_checkAS()">Check</button>
    <button class="secondary" onclick="fp_newASQuestion()">Skip</button>
  `;
  document.getElementById('fpas-feedback').className = 'feedback';
  const inputEl = document.getElementById('fpas-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') fp_checkAS(); });
}
function fp_checkAS() {
  const v = parseInt(document.getElementById('fpas-in').value);
  fp_asState.attempted++;
  const fb = document.getElementById('fpas-feedback');
  if (v === fp_asState.answer) {
    fp_asState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    const btn = document.querySelector('#fpas-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newASQuestion, 800);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${fp_asState.answer}.`;
  }
  document.getElementById('fpas-score').innerHTML = scoreHTML(fp_asState);
}

// =====================================================================
// FOUNDATION - 3. SKIP COUNTING
// =====================================================================
let fp_scState = { correct: 0, attempted: 0, answer: null, step: 2 };
function fp_renderSkipCount() {
  fp_scState = { correct: 0, attempted: 0, answer: null, step: 2 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔟 Skip Counting</h2>
      <p class="subtext">Choose a step size, then find the next number in the count.</p>
      ${tutorHTML('fp_skipcount')}
      <div class="mcq-opts">
        ${[2,3,4,5,10,20,25,50,100].map(s => `<div class="mcq-opt" id="fpsc-step-${s}" onclick="fp_setSCStep(${s})">${s}s</div>`).join('')}
      </div>
      <div id="fpsc-score">${scoreHTML(fp_scState)}</div>
      <div id="fpsc-question"></div>
      <div id="fpsc-feedback" class="feedback"></div>
    </div>
  `;
  fp_markSCStep();
  fp_newSCQuestion();
}
function fp_setSCStep(s) { fp_scState.step = s; fp_markSCStep(); fp_newSCQuestion(); }
function fp_markSCStep() {
  [2,3,4,5,10,20,25,50,100].forEach(s => document.getElementById('fpsc-step-' + s).classList.toggle('correct', fp_scState.step === s));
}
function fp_newSCQuestion() {
  const step = fp_scState.step;
  const startMultiple = randInt(0, 8);
  const start = startMultiple * step;
  const seq = [0,1,2,3].map(i => start + i * step);
  fp_scState.answer = start + 4 * step;
  document.getElementById('fpsc-question').innerHTML = `
    <div class="q-box">${seq.join(', ')}, ___</div>
    <input type="number" id="fpsc-in" autofocus />
    <button class="action" onclick="fp_checkSC()">Check</button>
    <button class="secondary" onclick="fp_newSCQuestion()">Skip</button>
  `;
  document.getElementById('fpsc-feedback').className = 'feedback';
  const inputEl = document.getElementById('fpsc-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') fp_checkSC(); });
}
function fp_checkSC() {
  const v = parseInt(document.getElementById('fpsc-in').value);
  fp_scState.attempted++;
  const fb = document.getElementById('fpsc-feedback');
  if (v === fp_scState.answer) {
    fp_scState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    const btn = document.querySelector('#fpsc-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newSCQuestion, 800);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${fp_scState.answer}.`;
  }
  document.getElementById('fpsc-score').innerHTML = scoreHTML(fp_scState);
}

// =====================================================================
// FOUNDATION - 4. SHAPE SORTING (straight vs curved sides)
// =====================================================================
const FP_SHAPES = [
  { name: 'Circle', icon: '⚪', kind: 'curved' },
  { name: 'Ball (sphere)', icon: '⚽', kind: 'curved' },
  { name: 'Triangle', icon: '🔺', kind: 'straight' },
  { name: 'Square', icon: '🟥', kind: 'straight' },
  { name: 'Rectangle', icon: '▬', kind: 'straight' },
  { name: 'Box (cube)', icon: '📦', kind: 'straight' },
  { name: 'Cylinder (tin can)', icon: '🥫', kind: 'curved' },
  { name: 'Cone (ice cream cone)', icon: '🍦', kind: 'curved' },
  { name: 'Star', icon: '⭐', kind: 'straight' },
];
let fp_shState = { shape: null, correct: 0, attempted: 0 };
function fp_renderShapes() {
  fp_shState = { shape: null, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔵 Shape Sorting</h2>
      <p class="subtext">Does the shape have straight sides, or is it round (curved)?</p>
      ${tutorHTML('fp_shapes')}
      <div id="fpsh-score">${scoreHTML(fp_shState)}</div>
      <div id="fpsh-question"></div>
      <div id="fpsh-feedback" class="feedback"></div>
    </div>
  `;
  fp_newSHQuestion();
}
function fp_newSHQuestion() {
  const shape = pick(FP_SHAPES);
  fp_shState.shape = shape;
  document.getElementById('fpsh-question').innerHTML = `
    <div class="q-box" style="font-size:2rem; text-align:center;">${shape.icon}<div style="font-size:1rem; margin-top:6px;">${shape.name}</div></div>
    <div class="mcq-opts">
      <div class="mcq-opt" onclick="fp_checkSH(this, 'straight')">Straight sides</div>
      <div class="mcq-opt" onclick="fp_checkSH(this, 'curved')">Round (curved)</div>
    </div>
    <button class="secondary small" onclick="fp_newSHQuestion()">New shape</button>
  `;
  document.getElementById('fpsh-feedback').className = 'feedback';
}
function fp_checkSH(el, val) {
  fp_shState.attempted++;
  const opts = document.querySelectorAll('#fpsh-question .mcq-opt');
  const fb = document.getElementById('fpsh-feedback');
  if (val === fp_shState.shape.kind) {
    fp_shState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New shape loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(fp_newSHQuestion, 1000);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. A ${fp_shState.shape.name.toLowerCase()} has ${fp_shState.shape.kind} sides.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('fpsh-score').innerHTML = scoreHTML(fp_shState);
}

// =====================================================================
// FOUNDATION - 5. SIMPLE PATTERNS (copy and extend)
// =====================================================================
const FP_PATTERNS = [
  { seq: ['🔴','🔵','🔴','🔵','🔴'], next: '🔵', opts: ['🔵','🔴','🟢'] },
  { seq: ['🟦','🟦','🟨','🟦','🟦'], next: '🟨', opts: ['🟨','🟦','🟩'] },
  { seq: ['⭐','⭐','🌙','⭐','⭐'], next: '🌙', opts: ['🌙','⭐','☀️'] },
  { seq: ['🔺','🔺','🔺','🔵','🔺','🔺'], next: '🔺', opts: ['🔵','🔺','🟩'] },
  { seq: ['🟢','🟡','🔴','🟢','🟡'], next: '🔴', opts: ['🔴','🟢','🟡'] },
  { seq: ['🐸','🐸','🦆','🐸','🐸'], next: '🦆', opts: ['🦆','🐸','🐢'] },
  { seq: ['🍎','🍌','🍎','🍌','🍎'], next: '🍌', opts: ['🍌','🍎','🍇'] },
  { seq: ['☀️','🌧️','☀️','🌧️','☀️'], next: '🌧️', opts: ['🌧️','☀️','⛅'] },
  { seq: ['🚗','🚗','🚲','🚗','🚗'], next: '🚲', opts: ['🚲','🚗','🚌'] },
  { seq: ['🚗','🚲','🚌','🚗','🚲'], next: '🚌', opts: ['🚌','🚗','🚲'] },
  { seq: ['🐝','🦋','🐝','🦋','🐝'], next: '🦋', opts: ['🦋','🐝','🐞'] },
  { seq: ['🐞','🐜','🐜','🐞','🐜'], next: '🐜', opts: ['🐜','🐞','🕷️'] },
  { seq: ['🔺','🔵','🟩','🔺','🔵'], next: '🟩', opts: ['🟩','🔺','🔵'] },
  { seq: ['🍕','🍔','🍕','🍔','🍕'], next: '🍔', opts: ['🍔','🍕','🌭'] },
  { seq: ['🍇','🍇','🍓','🍇','🍇'], next: '🍓', opts: ['🍓','🍇','🍑'] },
  { seq: ['🐠','🦈','🐠','🦈','🐠'], next: '🦈', opts: ['🦈','🐠','🐙'] },
  { seq: ['🌟','🌙','🌙','🌟','🌙'], next: '🌙', opts: ['🌙','🌟','✨'] },
  { seq: ['🟥','🟧','🟨','🟥','🟧'], next: '🟨', opts: ['🟨','🟥','🟧'] },
  { seq: ['⚽','🏀','⚽','🏀','⚽'], next: '🏀', opts: ['🏀','⚽','🎾'] },
  { seq: ['🐄','🐄','🐑','🐄','🐄'], next: '🐑', opts: ['🐑','🐄','🐖'] },
  { seq: ['🍦','🧁','🍦','🧁','🍦'], next: '🧁', opts: ['🧁','🍦','🍩'] },
  { seq: ['🚕','🚕','🚌','🚕','🚕'], next: '🚌', opts: ['🚌','🚕','🚓'] },
  { seq: ['☀️','☁️','🌧️','☀️','☁️'], next: '🌧️', opts: ['🌧️','☀️','☁️'] },
  { seq: ['🦁','🐘','🦁','🐘','🦁'], next: '🐘', opts: ['🐘','🦁','🦒'] },
  { seq: ['🦆','🐦','🐦','🦆','🐦'], next: '🐦', opts: ['🐦','🦆','🦢'] },
  { seq: ['🍉','🍉','🍊','🍉','🍉'], next: '🍊', opts: ['🍊','🍉','🍋'] },
  { seq: ['🐶','🐱','🐶','🐱','🐶'], next: '🐱', opts: ['🐱','🐶','🐹'] },
  { seq: ['🌸','🌸','🌼','🌸','🌸'], next: '🌼', opts: ['🌼','🌸','🌻'] },
];
let fp_ptState = { pattern: null, lastIdx: -1, correct: 0, attempted: 0 };
function fp_renderPatterns() {
  fp_ptState = { pattern: null, lastIdx: -1, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔁 Simple Patterns</h2>
      <p class="subtext">Look at the pattern. What comes next?</p>
      ${tutorHTML('fp_patterns')}
      <div id="fppt-score">${scoreHTML(fp_ptState)}</div>
      <div id="fppt-question"></div>
      <div id="fppt-feedback" class="feedback"></div>
    </div>
  `;
  fp_newPTQuestion();
}
function fp_newPTQuestion() {
  let idx;
  do { idx = randInt(0, FP_PATTERNS.length - 1); } while (idx === fp_ptState.lastIdx && FP_PATTERNS.length > 1);
  fp_ptState.lastIdx = idx;
  const pattern = FP_PATTERNS[idx];
  fp_ptState.pattern = pattern;
  const opts = shuffle(pattern.opts);
  document.getElementById('fppt-question').innerHTML = `
    <div class="q-box" style="font-size:1.6rem;">${pattern.seq.join(' ')} ___</div>
    <div class="mcq-opts">${opts.map(o => `<div class="mcq-opt" style="font-size:1.4rem;" onclick="fp_checkPT(this, '${o}')">${o}</div>`).join('')}</div>
    <button class="secondary small" onclick="fp_newPTQuestion()">New pattern</button>
  `;
  document.getElementById('fppt-feedback').className = 'feedback';
}
function fp_checkPT(el, val) {
  fp_ptState.attempted++;
  const opts = document.querySelectorAll('#fppt-question .mcq-opt');
  const fb = document.getElementById('fppt-feedback');
  if (val === fp_ptState.pattern.next) {
    fp_ptState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New pattern loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(fp_newPTQuestion, 1000);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The next one is ${fp_ptState.pattern.next}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('fppt-score').innerHTML = scoreHTML(fp_ptState);
}

// =====================================================================
// FOUNDATION - 6. MEASUREMENT BASICS
// =====================================================================
const FP_COMPARE_ITEMS = [
  { a: 'a pencil', b: 'a school bus', bigger: 'b', dim: 'longer' },
  { a: 'an elephant', b: 'a mouse', bigger: 'a', dim: 'heavier' },
  { a: 'a teaspoon', b: 'a bathtub', bigger: 'b', dim: 'holds more' },
  { a: 'a feather', b: 'a brick', bigger: 'b', dim: 'heavier' },
  { a: 'your finger', b: 'your arm', bigger: 'b', dim: 'longer' },
  { a: 'a cup', b: 'a swimming pool', bigger: 'b', dim: 'holds more' },
  { a: 'a bicycle', b: 'a car', bigger: 'b', dim: 'heavier' },
  { a: 'a shoe', b: 'a house', bigger: 'b', dim: 'longer' },
];
const FP_UNIT_ITEMS = [
  { item: 'the length of a pencil', unit: 'cm' },
  { item: 'the length of a classroom', unit: 'm' },
  { item: 'the distance between two towns', unit: 'km' },
  { item: 'the mass of an apple', unit: 'g' },
  { item: 'the mass of a person', unit: 'kg' },
  { item: 'a glass of juice', unit: 'ml' },
  { item: 'a bucket of water', unit: 'l' },
];
let fp_msState = { correct: 0, attempted: 0, mode: 'compare', item: null };
function fp_renderMeasure() {
  fp_msState = { correct: 0, attempted: 0, mode: 'compare', item: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">📏 Measurement Basics</h2>
      <p class="subtext">Compare informally, or choose a sensible formal unit.</p>
      ${tutorHTML('fp_measure')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fpms-mode-compare" onclick="fp_setMSMode('compare')">Compare</div>
        <div class="mcq-opt" id="fpms-mode-unit" onclick="fp_setMSMode('unit')">Choose the unit</div>
      </div>
      <div id="fpms-score">${scoreHTML(fp_msState)}</div>
      <div id="fpms-question"></div>
      <div id="fpms-feedback" class="feedback"></div>
    </div>
  `;
  fp_markMSMode();
  fp_newMSQuestion();
}
function fp_setMSMode(m) { fp_msState.mode = m; fp_markMSMode(); fp_newMSQuestion(); }
function fp_markMSMode() {
  document.getElementById('fpms-mode-compare').classList.toggle('correct', fp_msState.mode === 'compare');
  document.getElementById('fpms-mode-unit').classList.toggle('correct', fp_msState.mode === 'unit');
}
function fp_newMSQuestion() {
  if (fp_msState.mode === 'compare') {
    const item = pick(FP_COMPARE_ITEMS);
    fp_msState.item = item;
    document.getElementById('fpms-question').innerHTML = `
      <div class="q-box">Which is ${item.dim}, ${item.a} or ${item.b}?</div>
      <div class="mcq-opts">
        <div class="mcq-opt" onclick="fp_checkMS(this, 'a')">${item.a}</div>
        <div class="mcq-opt" onclick="fp_checkMS(this, 'b')">${item.b}</div>
      </div>
      <button class="secondary small" onclick="fp_newMSQuestion()">New question</button>
    `;
  } else {
    const item = pick(FP_UNIT_ITEMS);
    fp_msState.item = item;
    const allUnits = ['mm','cm','m','km','ml','l','g','kg'];
    const distractors = shuffle(allUnits.filter(u => u !== item.unit)).slice(0, 3);
    const options = shuffle([item.unit, ...distractors]);
    document.getElementById('fpms-question').innerHTML = `
      <div class="q-box">Which unit would you use to measure ${item.item}?</div>
      <div class="mcq-opts">${options.map(u => `<div class="mcq-opt" onclick="fp_checkMS(this, '${u}')">${u}</div>`).join('')}</div>
      <button class="secondary small" onclick="fp_newMSQuestion()">New question</button>
    `;
  }
  document.getElementById('fpms-feedback').className = 'feedback';
}
function fp_checkMS(el, val) {
  fp_msState.attempted++;
  const opts = document.querySelectorAll('#fpms-question .mcq-opt');
  const fb = document.getElementById('fpms-feedback');
  const correctVal = fp_msState.mode === 'compare' ? fp_msState.item.bigger : fp_msState.item.unit;
  if (val === correctVal) {
    fp_msState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New question loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(fp_newMSQuestion, 1000);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = fp_msState.mode === 'compare'
      ? `Not quite. ${fp_msState.item.bigger === 'a' ? fp_msState.item.a : fp_msState.item.b} is ${fp_msState.item.dim}.`
      : `Not quite. ${fp_msState.item.item} would usually be measured in ${fp_msState.item.unit}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('fpms-score').innerHTML = scoreHTML(fp_msState);
}

// =====================================================================
// FOUNDATION - 7. MONEY
// =====================================================================
const FP_COINS_SMALL = [
  { label: '5c', value: 5 }, { label: '10c', value: 10 }, { label: '20c', value: 20 },
  { label: '50c', value: 50 }, { label: 'R1', value: 100 }, { label: 'R2', value: 200 },
];
const FP_COINS_BIG = [
  { label: 'R1', value: 100 }, { label: 'R2', value: 200 }, { label: 'R5', value: 500 },
  { label: 'R10', value: 1000 }, { label: 'R20', value: 2000 },
];
const FP_NOTES = [
  { label: 'R10', value: 1000 }, { label: 'R20', value: 2000 },
  { label: 'R50', value: 5000 }, { label: 'R100', value: 10000 },
];
let fp_mnState = { correct: 0, attempted: 0, answer: null, level: 'small', picked: [] };
function fp_renderMoney() {
  fp_mnState = { correct: 0, attempted: 0, answer: null, level: 'small', picked: [] };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">💰 Money</h2>
      <p class="subtext">Add up the coins and notes shown, or work out change. Answer in Rand and cents combined, as cents, for example R1.50 is 150 (type the number of cents).</p>
      ${tutorHTML('fp_money')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fpmn-lvl-small" onclick="fp_setMNLevel('small')">Small coins (up to R2)</div>
        <div class="mcq-opt" id="fpmn-lvl-big" onclick="fp_setMNLevel('big')">Notes too (up to R20)</div>
        <div class="mcq-opt" id="fpmn-lvl-change" onclick="fp_setMNLevel('change')">Working out change</div>
      </div>
      <div id="fpmn-score">${scoreHTML(fp_mnState)}</div>
      <div id="fpmn-question"></div>
      <div id="fpmn-feedback" class="feedback"></div>
    </div>
  `;
  fp_markMNLevel();
  fp_newMNQuestion();
}
function fp_setMNLevel(l) { fp_mnState.level = l; fp_markMNLevel(); fp_newMNQuestion(); }
function fp_markMNLevel() {
  document.getElementById('fpmn-lvl-small').classList.toggle('correct', fp_mnState.level === 'small');
  document.getElementById('fpmn-lvl-big').classList.toggle('correct', fp_mnState.level === 'big');
  document.getElementById('fpmn-lvl-change').classList.toggle('correct', fp_mnState.level === 'change');
}
function fp_formatCents(c) {
  const rand = Math.floor(c / 100), cents = c % 100;
  if (rand === 0) return `${cents}c`;
  if (cents === 0) return `R${rand}`;
  return `R${rand}.${String(cents).padStart(2,'0')}`;
}
function fp_newMNQuestion() {
  document.getElementById('fpmn-feedback').className = 'feedback';
  if (fp_mnState.level === 'change') {
    const cost = randInt(1, 45) * 50;
    const note = FP_NOTES.find(n => n.value > cost) || FP_NOTES[FP_NOTES.length - 1];
    fp_mnState.answer = note.value - cost;
    document.getElementById('fpmn-question').innerHTML = `
      <div class="q-box" style="font-size:1.3rem;">An item costs <strong>${fp_formatCents(cost)}</strong>. You pay with a <strong>${note.label}</strong> note.</div>
      <div>How much change do you get? <input type="text" id="fpmn-in" placeholder="for example R1.50 or 150" autofocus /></div>
      <button class="action" onclick="fp_checkMN()">Check</button>
      <button class="secondary" onclick="fp_newMNQuestion()">Skip</button>
    `;
    return;
  }
  const pool = fp_mnState.level === 'small' ? FP_COINS_SMALL : FP_COINS_BIG;
  const count = randInt(2, 4);
  const picked = Array.from({length: count}, () => pick(pool));
  fp_mnState.picked = picked;
  fp_mnState.answer = picked.reduce((s, c) => s + c.value, 0);
  document.getElementById('fpmn-question').innerHTML = `
    <div class="q-box" style="font-size:1.4rem;">${picked.map(c => `<span style="display:inline-block; margin:4px 8px; padding:8px 12px; background:var(--sand-light); border-radius:10px; border:1.5px solid var(--sand);">${c.label}</span>`).join('')}</div>
    <div>How much money altogether? <input type="text" id="fpmn-in" placeholder="for example R1.50 or 150" autofocus /></div>
    <button class="action" onclick="fp_checkMN()">Check</button>
    <button class="secondary" onclick="fp_newMNQuestion()">Skip</button>
  `;
}
function fp_checkMN() {
  const raw = (document.getElementById('fpmn-in').value || '').trim().toUpperCase();
  fp_mnState.attempted++;
  const fb = document.getElementById('fpmn-feedback');
  let cents = null;
  if (raw.startsWith('R') && raw.includes('.')) {
    const [r, c] = raw.slice(1).split('.');
    cents = (parseInt(r) || 0) * 100 + (parseInt((c + '00').slice(0,2)) || 0);
  } else if (raw.startsWith('R')) {
    cents = (parseInt(raw.slice(1)) || 0) * 100;
  } else if (raw.includes('.')) {
    const [r, c] = raw.split('.');
    cents = (parseInt(r) || 0) * 100 + (parseInt((c + '00').slice(0,2)) || 0);
  } else {
    // bare number (with or without a trailing c) is treated as a cent total, matching the placeholder example
    cents = parseInt(raw);
  }
  const answerText = fp_formatCents(fp_mnState.answer);
  if (cents === fp_mnState.answer) {
    fp_mnState.correct++;
    fb.className = 'feedback good';
    fb.textContent = `Correct! That is ${answerText}. Next one.`;
    setTimeout(fp_newMNQuestion, 1100);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The total was ${answerText}.`;
  }
  document.getElementById('fpmn-score').innerHTML = scoreHTML(fp_mnState);
}

// =====================================================================
// FOUNDATION - 8. DATA HANDLING (pictograph reading)
// =====================================================================
const FP_PICTO_ITEMS = ['🍎','🍌','🍇','🍊'];
let fp_dtState = { data: null, correct: 0, attempted: 0, answer: null };
function fp_renderData() {
  fp_dtState = { data: null, correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">📊 Reading a Pictograph</h2>
      <p class="subtext">Each picture stands for 1. Count carefully to answer.</p>
      ${tutorHTML('fp_data')}
      <div id="fpdt-score">${scoreHTML(fp_dtState)}</div>
      <div id="fpdt-question"></div>
      <div id="fpdt-feedback" class="feedback"></div>
    </div>
  `;
  fp_newDTQuestion();
}
function fp_newDTQuestion() {
  const labels = ['Apples', 'Bananas', 'Grapes', 'Oranges'];
  let counts;
  do {
    counts = labels.map(() => randInt(1, 8));
  } while (new Set(counts).size < counts.length);
  fp_dtState.data = { labels, counts };
  const askMax = Math.random() < 0.5;
  let text, answer;
  if (askMax) {
    const maxIdx = counts.indexOf(Math.max(...counts));
    text = 'Which fruit has the most?';
    answer = labels[maxIdx];
  } else {
    const idx = randInt(0, labels.length - 1);
    text = `How many ${labels[idx].toLowerCase()} are there?`;
    answer = String(counts[idx]);
  }
  fp_dtState.answer = answer;
  const rows = labels.map((lbl, i) => `
    <div style="display:flex; align-items:center; gap:10px; margin:4px 0;">
      <div style="width:80px; font-weight:700; color:var(--ocean-dark);">${lbl}</div>
      <div>${Array(counts[i]).fill(FP_PICTO_ITEMS[i % FP_PICTO_ITEMS.length]).join(' ')}</div>
    </div>
  `).join('');
  const options = askMax
    ? shuffle(labels)
    : shuffle([...new Set([answer, String(Number(answer)+1), String(Math.max(0,Number(answer)-1)), String(Number(answer)+2)])]).slice(0,4);
  document.getElementById('fpdt-question').innerHTML = `
    <div>${rows}</div>
    <div class="q-box">${text}</div>
    <div class="mcq-opts">${options.map(o => `<div class="mcq-opt" onclick="fp_checkDT(this, '${o}')">${o}</div>`).join('')}</div>
    <button class="secondary small" onclick="fp_newDTQuestion()">New graph</button>
  `;
  document.getElementById('fpdt-feedback').className = 'feedback';
}
function fp_checkDT(el, val) {
  fp_dtState.attempted++;
  const opts = document.querySelectorAll('#fpdt-question .mcq-opt');
  const fb = document.getElementById('fpdt-feedback');
  if (val === fp_dtState.answer) {
    fp_dtState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New graph loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(fp_newDTQuestion, 1100);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${fp_dtState.answer}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('fpdt-score').innerHTML = scoreHTML(fp_dtState);
}

// =====================================================================
// FOUNDATION - 9. NUMBER BONDS
// =====================================================================
let fp_bnState = { correct: 0, attempted: 0, answer: null, target: 10 };
function fp_renderBonds() {
  fp_bnState = { correct: 0, attempted: 0, answer: null, target: 10 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🧩 Number Bonds</h2>
      <p class="subtext">Find the missing part that makes the target number.</p>
      ${tutorHTML('fp_bonds')}
      <div class="mcq-opts">
        ${[5, 10, 15, 20].map(t => `<div class="mcq-opt" id="fpbn-tgt-${t}" onclick="fp_setBNTarget(${t})">Bonds to ${t}</div>`).join('')}
      </div>
      <div id="fpbn-score">${scoreHTML(fp_bnState)}</div>
      <div id="fpbn-question"></div>
      <div id="fpbn-feedback" class="feedback"></div>
    </div>
  `;
  fp_markBNTarget();
  fp_newBNQuestion();
}
function fp_setBNTarget(t) { fp_bnState.target = t; fp_markBNTarget(); fp_newBNQuestion(); }
function fp_markBNTarget() {
  [5, 10, 15, 20].forEach(t => document.getElementById('fpbn-tgt-' + t).classList.toggle('correct', fp_bnState.target === t));
}
function fp_newBNQuestion() {
  const target = fp_bnState.target;
  const a = randInt(0, target);
  const b = target - a;
  const hideSecond = Math.random() < 0.5;
  fp_bnState.answer = hideSecond ? b : a;
  const shown = hideSecond ? `${a} + ? = ${target}` : `? + ${b} = ${target}`;
  document.getElementById('fpbn-question').innerHTML = `
    <div class="q-box" style="font-size:1.5rem;">${shown.replace('?', '<input type="number" id="fpbn-in" style="width:70px; font-size:1.3rem;" autofocus />')}</div>
    <button class="action" onclick="fp_checkBN()">Check</button>
    <button class="secondary" onclick="fp_newBNQuestion()">Skip</button>
  `;
  document.getElementById('fpbn-feedback').className = 'feedback';
  const inputEl = document.getElementById('fpbn-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') fp_checkBN(); });
}
function fp_checkBN() {
  const v = parseInt(document.getElementById('fpbn-in').value);
  fp_bnState.attempted++;
  const fb = document.getElementById('fpbn-feedback');
  if (v === fp_bnState.answer) {
    fp_bnState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    const btn = document.querySelector('#fpbn-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newBNQuestion, 800);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The missing number was ${fp_bnState.answer}.`;
  }
  document.getElementById('fpbn-score').innerHTML = scoreHTML(fp_bnState);
}

// =====================================================================
// FOUNDATION - 10. TEN FRAMES
// =====================================================================
let fp_tfState = { correct: 0, attempted: 0, mode: 'read', answer: null, clicked: [] };
function fp_renderTenFrame() {
  fp_tfState = { correct: 0, attempted: 0, mode: 'read', answer: null, clicked: [] };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔟 Ten Frames</h2>
      <p class="subtext">A ten frame helps you see numbers up to 10 at a glance.</p>
      ${tutorHTML('fp_tenframe')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fptf-mode-read" onclick="fp_setTFMode('read')">Read the frame</div>
        <div class="mcq-opt" id="fptf-mode-make" onclick="fp_setTFMode('make')">Make the number</div>
      </div>
      <div id="fptf-score">${scoreHTML(fp_tfState)}</div>
      <div id="fptf-question"></div>
      <div id="fptf-feedback" class="feedback"></div>
    </div>
  `;
  fp_markTFMode();
  fp_newTFQuestion();
}
function fp_setTFMode(m) { fp_tfState.mode = m; fp_markTFMode(); fp_newTFQuestion(); }
function fp_markTFMode() {
  document.getElementById('fptf-mode-read').classList.toggle('correct', fp_tfState.mode === 'read');
  document.getElementById('fptf-mode-make').classList.toggle('correct', fp_tfState.mode === 'make');
}
function fp_tfCells(filledCount, clickable) {
  let cells = '';
  for (let i = 0; i < 10; i++) {
    const isFilled = clickable ? fp_tfState.clicked.includes(i) : i < filledCount;
    cells += `<div class="tf-cell ${clickable ? 'clickable' : ''} ${isFilled ? 'filled' : ''}" ${clickable ? `onclick="fp_toggleTFCell(${i})"` : ''}>${isFilled ? '🔴' : ''}</div>`;
  }
  return cells;
}
function fp_toggleTFCell(i) {
  const idx = fp_tfState.clicked.indexOf(i);
  if (idx === -1) fp_tfState.clicked.push(i); else fp_tfState.clicked.splice(idx, 1);
  document.getElementById('fptf-frame').innerHTML = fp_tfCells(0, true);
}
function fp_newTFQuestion() {
  document.getElementById('fptf-feedback').className = 'feedback';
  if (fp_tfState.mode === 'read') {
    const count = randInt(1, 10);
    const askMore = Math.random() < 0.4 && count < 10;
    const question = askMore ? 'How many more counters to make 10?' : 'How many counters are there?';
    fp_tfState.answer = askMore ? 10 - count : count;
    const base = fp_tfState.answer;
    const options = shuffle([...new Set([base, base + 1, Math.max(0, base - 1), base + 2])]).slice(0, 4);
    document.getElementById('fptf-question').innerHTML = `
      <div class="tenframe">${fp_tfCells(count, false)}</div>
      <div class="q-box">${question}</div>
      <div class="mcq-opts">${options.map(o => `<div class="mcq-opt" onclick="fp_checkTF(this, ${o})">${o}</div>`).join('')}</div>
    `;
  } else {
    const target = randInt(1, 10);
    fp_tfState.answer = target;
    fp_tfState.clicked = [];
    document.getElementById('fptf-question').innerHTML = `
      <div class="q-box">Click the frame to show <strong>${target}</strong>.</div>
      <div class="tenframe" id="fptf-frame">${fp_tfCells(0, true)}</div>
      <button class="action" onclick="fp_checkTFMake()">Check</button>
      <button class="secondary" onclick="fp_newTFQuestion()">Skip</button>
    `;
  }
}
function fp_checkTF(el, val) {
  fp_tfState.attempted++;
  const opts = document.querySelectorAll('#fptf-question .mcq-opt');
  const fb = document.getElementById('fptf-feedback');
  if (val === fp_tfState.answer) {
    fp_tfState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    opts.forEach(o => o.onclick = null);
    setTimeout(fp_newTFQuestion, 1000);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${fp_tfState.answer}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('fptf-score').innerHTML = scoreHTML(fp_tfState);
}
function fp_checkTFMake() {
  fp_tfState.attempted++;
  const fb = document.getElementById('fptf-feedback');
  if (fp_tfState.clicked.length === fp_tfState.answer) {
    fp_tfState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(fp_newTFQuestion, 1000);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. You need ${fp_tfState.answer}, you have ${fp_tfState.clicked.length}.`;
  }
  document.getElementById('fptf-score').innerHTML = scoreHTML(fp_tfState);
}

// =====================================================================
// FOUNDATION - 11. PLACE VALUE RENAMING
// =====================================================================
let fp_rnState = { correct: 0, attempted: 0, level: 'g2', answer: null };
function fp_renderRenaming() {
  fp_rnState = { correct: 0, attempted: 0, level: 'g2', answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🧮 Place Value Renaming</h2>
      <p class="subtext">Break the number into its parts.</p>
      ${tutorHTML('fp_renaming')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fprn-lvl-g2" onclick="fp_setRNLevel('g2')">Grade 2 (tens and units)</div>
        <div class="mcq-opt" id="fprn-lvl-g3" onclick="fp_setRNLevel('g3')">Grade 3 (hundreds, tens and units)</div>
      </div>
      <div id="fprn-score">${scoreHTML(fp_rnState)}</div>
      <div id="fprn-question"></div>
      <div id="fprn-feedback" class="feedback"></div>
    </div>
  `;
  fp_markRNLevel();
  fp_newRNQuestion();
}
function fp_setRNLevel(l) { fp_rnState.level = l; fp_markRNLevel(); fp_newRNQuestion(); }
function fp_markRNLevel() {
  document.getElementById('fprn-lvl-g2').classList.toggle('correct', fp_rnState.level === 'g2');
  document.getElementById('fprn-lvl-g3').classList.toggle('correct', fp_rnState.level === 'g3');
}
function fp_newRNQuestion() {
  let num;
  if (fp_rnState.level === 'g2') {
    num = randInt(10, 99);
    const tens = Math.floor(num / 10), units = num % 10;
    fp_rnState.answer = [tens * 10, units];
    document.getElementById('fprn-question').innerHTML = `
      <div class="q-box" style="font-size:1.35rem;">${num} = <input type="number" id="fprn-in0" style="width:70px;" autofocus /> + <input type="number" id="fprn-in1" style="width:60px;" /></div>
      <button class="action" onclick="fp_checkRN()">Check</button>
      <button class="secondary" onclick="fp_newRNQuestion()">Skip</button>
    `;
  } else {
    num = randInt(100, 999);
    const hundreds = Math.floor(num / 100), tens = Math.floor((num % 100) / 10), units = num % 10;
    fp_rnState.answer = [hundreds * 100, tens * 10, units];
    document.getElementById('fprn-question').innerHTML = `
      <div class="q-box" style="font-size:1.35rem;">${num} = <input type="number" id="fprn-in0" style="width:80px;" autofocus /> + <input type="number" id="fprn-in1" style="width:70px;" /> + <input type="number" id="fprn-in2" style="width:60px;" /></div>
      <button class="action" onclick="fp_checkRN()">Check</button>
      <button class="secondary" onclick="fp_newRNQuestion()">Skip</button>
    `;
  }
  document.getElementById('fprn-feedback').className = 'feedback';
}
function fp_checkRN() {
  fp_rnState.attempted++;
  const fb = document.getElementById('fprn-feedback');
  const vals = fp_rnState.answer.map((_, i) => parseInt(document.getElementById('fprn-in' + i).value));
  const ok = vals.every((v, i) => v === fp_rnState.answer[i]);
  if (ok) {
    fp_rnState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    const btn = document.querySelector('#fprn-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newRNQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. It breaks down as ${fp_rnState.answer.join(' + ')}.`;
  }
  document.getElementById('fprn-score').innerHTML = scoreHTML(fp_rnState);
}

// =====================================================================
// FOUNDATION - 12. HUNDRED GRID
// =====================================================================
let fp_hgState = { correct: 0, attempted: 0, size: 100, blanks: [] };
function fp_renderHundredGrid() {
  fp_hgState = { correct: 0, attempted: 0, size: 100, blanks: [] };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">💯 Hundred Grid</h2>
      <p class="subtext">Fill in the missing numbers on the grid.</p>
      ${tutorHTML('fp_grid100')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fphg-size-50" onclick="fp_setHGSize(50)">1 to 50</div>
        <div class="mcq-opt" id="fphg-size-100" onclick="fp_setHGSize(100)">1 to 100</div>
      </div>
      <div id="fphg-score">${scoreHTML(fp_hgState)}</div>
      <div id="fphg-question"></div>
      <div id="fphg-feedback" class="feedback"></div>
    </div>
  `;
  fp_markHGSize();
  fp_newHGQuestion();
}
function fp_setHGSize(s) { fp_hgState.size = s; fp_markHGSize(); fp_newHGQuestion(); }
function fp_markHGSize() {
  document.getElementById('fphg-size-50').classList.toggle('correct', fp_hgState.size === 50);
  document.getElementById('fphg-size-100').classList.toggle('correct', fp_hgState.size === 100);
}
function fp_newHGQuestion() {
  const size = fp_hgState.size;
  const blankCount = Math.round(size * 0.2);
  const nums = Array.from({ length: size }, (_, i) => i + 1);
  const blanks = shuffle(nums).slice(0, blankCount);
  fp_hgState.blanks = blanks;
  let cells = '';
  for (let n = 1; n <= size; n++) {
    if (blanks.includes(n)) {
      cells += `<div class="ncell"><input type="number" id="fphg-c${n}" /></div>`;
    } else {
      cells += `<div class="ncell given">${n}</div>`;
    }
  }
  document.getElementById('fphg-question').innerHTML = `
    <div class="numgrid">${cells}</div>
    <button class="action" onclick="fp_checkHG()">Check all</button>
    <button class="secondary" onclick="fp_newHGQuestion()">New grid</button>
  `;
  document.getElementById('fphg-feedback').className = 'feedback';
}
function fp_checkHG() {
  fp_hgState.attempted++;
  let allRight = true;
  fp_hgState.blanks.forEach(n => {
    const inp = document.getElementById('fphg-c' + n);
    const cell = inp.parentElement;
    cell.classList.remove('right', 'wrongcell');
    if (parseInt(inp.value) === n) { cell.classList.add('right'); }
    else { cell.classList.add('wrongcell'); allRight = false; }
  });
  const fb = document.getElementById('fphg-feedback');
  if (allRight) {
    fp_hgState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'All correct! Nice work. Try a new grid.';
  } else {
    fb.className = 'feedback bad';
    fb.textContent = 'Some are not quite right yet, check the highlighted cells.';
  }
  document.getElementById('fphg-score').innerHTML = scoreHTML(fp_hgState);
}

// =====================================================================
// FOUNDATION - 13. TELLING TIME
// =====================================================================
let fp_tmState = { correct: 0, attempted: 0, mode: 'oclock', answer: null };
function fp_renderTellTime() {
  fp_tmState = { correct: 0, attempted: 0, mode: 'oclock', answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🕐 Telling Time</h2>
      <p class="subtext">Read the clock, or work out a simple elapsed time.</p>
      ${tutorHTML('fp_time')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fptm-mode-oclock" onclick="fp_setTMMode('oclock')">O'clock</div>
        <div class="mcq-opt" id="fptm-mode-half" onclick="fp_setTMMode('half')">Half past</div>
        <div class="mcq-opt" id="fptm-mode-quarter" onclick="fp_setTMMode('quarter')">Quarter past and to</div>
        <div class="mcq-opt" id="fptm-mode-elapsed" onclick="fp_setTMMode('elapsed')">Elapsed time</div>
      </div>
      <div id="fptm-score">${scoreHTML(fp_tmState)}</div>
      <div id="fptm-question"></div>
      <div id="fptm-feedback" class="feedback"></div>
    </div>
  `;
  fp_markTMMode();
  fp_newTMQuestion();
}
function fp_setTMMode(m) { fp_tmState.mode = m; fp_markTMMode(); fp_newTMQuestion(); }
function fp_markTMMode() {
  ['oclock', 'half', 'quarter', 'elapsed'].forEach(m => document.getElementById('fptm-mode-' + m).classList.toggle('correct', fp_tmState.mode === m));
}
function fp_timeLabel(h, m) {
  if (m === 0) return `${h} o'clock`;
  if (m === 30) return `half past ${h}`;
  if (m === 15) return `quarter past ${h}`;
  if (m === 45) { const next = (h % 12) + 1; return `quarter to ${next}`; }
  return `${h}:${String(m).padStart(2, '0')}`;
}
function fp_newTMQuestion() {
  document.getElementById('fptm-feedback').className = 'feedback';
  if (fp_tmState.mode === 'elapsed') {
    const startH = randInt(1, 12);
    const addH = randInt(1, 4);
    const endH = ((startH - 1 + addH) % 12) + 1;
    fp_tmState.answer = endH;
    document.getElementById('fptm-question').innerHTML = `
      <div class="q-box">It is ${startH} o'clock. What time will it be in ${addH} hour${addH > 1 ? 's' : ''}?</div>
      <div class="q-box" style="font-size:1.2rem;"><input type="number" id="fptm-in" style="width:70px;" autofocus /> o'clock</div>
      <button class="action" onclick="fp_checkTMElapsed()">Check</button>
      <button class="secondary" onclick="fp_newTMQuestion()">Skip</button>
    `;
    const inputEl = document.getElementById('fptm-in');
    inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') fp_checkTMElapsed(); });
  } else {
    const h = randInt(1, 12);
    const m = fp_tmState.mode === 'oclock' ? 0 : fp_tmState.mode === 'half' ? 30 : pick([15, 45]);
    fp_tmState.answer = fp_timeLabel(h, m);
    const wrongOpts = new Set();
    let guard = 0;
    while (wrongOpts.size < 3 && guard < 50) {
      guard++;
      const wh = randInt(1, 12);
      const wm = fp_tmState.mode === 'oclock' ? 0 : fp_tmState.mode === 'half' ? 30 : pick([15, 45]);
      const lbl = fp_timeLabel(wh, wm);
      if (lbl !== fp_tmState.answer) wrongOpts.add(lbl);
    }
    const options = shuffle([fp_tmState.answer, ...wrongOpts]);
    document.getElementById('fptm-question').innerHTML = `
      <div style="text-align:center;">${g4_clockSVG(h, m)}</div>
      <div class="q-box">What time does the clock show?</div>
      <div class="mcq-opts">${options.map(o => `<div class="mcq-opt" onclick="fp_checkTM(this, '${o}')">${o}</div>`).join('')}</div>
    `;
  }
}
function fp_checkTM(el, val) {
  fp_tmState.attempted++;
  const opts = document.querySelectorAll('#fptm-question .mcq-opt');
  const fb = document.getElementById('fptm-feedback');
  if (val === fp_tmState.answer) {
    fp_tmState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    opts.forEach(o => o.onclick = null);
    setTimeout(fp_newTMQuestion, 1100);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. It was ${fp_tmState.answer}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('fptm-score').innerHTML = scoreHTML(fp_tmState);
}
function fp_checkTMElapsed() {
  const v = parseInt(document.getElementById('fptm-in').value);
  fp_tmState.attempted++;
  const fb = document.getElementById('fptm-feedback');
  if (v === fp_tmState.answer) {
    fp_tmState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    const btn = document.querySelector('#fptm-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newTMQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${fp_tmState.answer} o'clock.`;
  }
  document.getElementById('fptm-score').innerHTML = scoreHTML(fp_tmState);
}

// =====================================================================
// FOUNDATION - 14. NUMBER BOND PYRAMID
// =====================================================================
let fp_pyState = { correct: 0, attempted: 0, level: 'easy', hiddenIdx: null, values: [], answer: null };
function fp_renderPyramid() {
  fp_pyState = { correct: 0, attempted: 0, level: 'easy', hiddenIdx: null, values: [], answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔺 Number Bond Pyramid</h2>
      <p class="subtext">Each brick is the sum of the two bricks below it. Find the missing number.</p>
      ${tutorHTML('fp_pyramid')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fppy-lvl-easy" onclick="fp_setPYLevel('easy')">Easy (2 bricks)</div>
        <div class="mcq-opt" id="fppy-lvl-challenge" onclick="fp_setPYLevel('challenge')">Challenge (3 bricks)</div>
      </div>
      <div id="fppy-score">${scoreHTML(fp_pyState)}</div>
      <div id="fppy-question"></div>
      <div id="fppy-feedback" class="feedback"></div>
    </div>
  `;
  fp_markPYLevel();
  fp_newPYQuestion();
}
function fp_setPYLevel(l) { fp_pyState.level = l; fp_markPYLevel(); fp_newPYQuestion(); }
function fp_markPYLevel() {
  document.getElementById('fppy-lvl-easy').classList.toggle('correct', fp_pyState.level === 'easy');
  document.getElementById('fppy-lvl-challenge').classList.toggle('correct', fp_pyState.level === 'challenge');
}
function fp_newPYQuestion() {
  let values;
  if (fp_pyState.level === 'easy') {
    const b0 = randInt(1, 9), b1 = randInt(1, 9);
    values = [b0, b1, b0 + b1];
  } else {
    const b0 = randInt(1, 9), b1 = randInt(1, 9), b2 = randInt(1, 9);
    const m0 = b0 + b1, m1 = b1 + b2, top = m0 + m1;
    values = [b0, b1, b2, m0, m1, top];
  }
  fp_pyState.values = values;
  const hiddenIdx = randInt(0, values.length - 1);
  fp_pyState.hiddenIdx = hiddenIdx;
  fp_pyState.answer = values[hiddenIdx];
  const brick = (i) => i === hiddenIdx
    ? `<div class="pbrick"><input type="number" id="fppy-in" autofocus /></div>`
    : `<div class="pbrick given">${values[i]}</div>`;
  let rows;
  if (fp_pyState.level === 'easy') {
    rows = `
      <div class="pyramid-row">${brick(2)}</div>
      <div class="pyramid-row">${brick(0)}${brick(1)}</div>
    `;
  } else {
    rows = `
      <div class="pyramid-row">${brick(5)}</div>
      <div class="pyramid-row">${brick(3)}${brick(4)}</div>
      <div class="pyramid-row">${brick(0)}${brick(1)}${brick(2)}</div>
    `;
  }
  document.getElementById('fppy-question').innerHTML = `
    <div class="pyramid">${rows}</div>
    <button class="action" onclick="fp_checkPY()">Check</button>
    <button class="secondary" onclick="fp_newPYQuestion()">New pyramid</button>
  `;
  document.getElementById('fppy-feedback').className = 'feedback';
  const inputEl = document.getElementById('fppy-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') fp_checkPY(); });
}
function fp_checkPY() {
  const v = parseInt(document.getElementById('fppy-in').value);
  fp_pyState.attempted++;
  const fb = document.getElementById('fppy-feedback');
  if (v === fp_pyState.answer) {
    fp_pyState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next pyramid.';
    const btn = document.querySelector('#fppy-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newPYQuestion, 1000);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The missing brick was ${fp_pyState.answer}.`;
  }
  document.getElementById('fppy-score').innerHTML = scoreHTML(fp_pyState);
}

// =====================================================================
// FOUNDATION - 15. POSITION AND DIRECTION
// =====================================================================
const FP_POS_ITEMS = ['🐶', '🐱', '🐰', '🐻', '🦊', '🐸', '🐵', '🐷', '🐨', '🐯'];
let fp_psState = { correct: 0, attempted: 0, seq: [], answer: null };
function fp_renderPosition() {
  fp_psState = { correct: 0, attempted: 0, seq: [], answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🚶 Position and Direction</h2>
      <p class="subtext">Look at the line of animals, then answer where things are.</p>
      ${tutorHTML('fp_position')}
      <div id="fpps-score">${scoreHTML(fp_psState)}</div>
      <div id="fpps-question"></div>
      <div id="fpps-feedback" class="feedback"></div>
    </div>
  `;
  fp_newPSQuestion();
}
function fp_newPSQuestion() {
  const seq = shuffle(FP_POS_ITEMS).slice(0, 4);
  fp_psState.seq = seq;
  const kind = pick(['first', 'last', 'front', 'behind', 'between']);
  let text, answer;
  if (kind === 'first') { text = 'Which animal is first in the line?'; answer = seq[0]; }
  else if (kind === 'last') { text = 'Which animal is last in the line?'; answer = seq[seq.length - 1]; }
  else if (kind === 'front') { const i = randInt(1, seq.length - 1); text = `Which animal is in front of the ${seq[i]}?`; answer = seq[i - 1]; }
  else if (kind === 'behind') { const i = randInt(0, seq.length - 2); text = `Which animal is behind the ${seq[i]}?`; answer = seq[i + 1]; }
  else { const i = randInt(0, seq.length - 3); text = `Which animal is between the ${seq[i]} and the ${seq[i + 2]}?`; answer = seq[i + 1]; }
  fp_psState.answer = answer;
  document.getElementById('fpps-question').innerHTML = `
    <div class="q-box" style="font-size:2rem; text-align:center; letter-spacing:14px;">${seq.join(' ')}</div>
    <div class="q-box">${text}</div>
    <div class="mcq-opts">${shuffle(seq).map(o => `<div class="mcq-opt" style="font-size:1.6rem;" onclick="fp_checkPS(this, '${o}')">${o}</div>`).join('')}</div>
  `;
  document.getElementById('fpps-feedback').className = 'feedback';
}
function fp_checkPS(el, val) {
  fp_psState.attempted++;
  const opts = document.querySelectorAll('#fpps-question .mcq-opt');
  const fb = document.getElementById('fpps-feedback');
  if (val === fp_psState.answer) {
    fp_psState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New line loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(fp_newPSQuestion, 1100);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${fp_psState.answer}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('fpps-score').innerHTML = scoreHTML(fp_psState);
}

// =====================================================================
// FOUNDATION - 16. NAME THE SHAPE
// =====================================================================
const FP_SHAPE_DEFS = [
  { name: 'Circle', sides: 0 },
  { name: 'Triangle', sides: 3 },
  { name: 'Square', sides: 4 },
  { name: 'Rectangle', sides: 4 },
  { name: 'Pentagon', sides: 5 },
  { name: 'Hexagon', sides: 6 },
];
function fp_shapeSVG(name) {
  const box = 'width="90" height="90" viewBox="0 0 100 100"';
  const fill = '#0284C7';
  const shapes = {
    Circle: `<circle cx="50" cy="50" r="42" fill="${fill}"/>`,
    Triangle: `<polygon points="50,10 90,90 10,90" fill="${fill}"/>`,
    Square: `<rect x="12" y="12" width="76" height="76" fill="${fill}"/>`,
    Rectangle: `<rect x="6" y="26" width="88" height="48" fill="${fill}"/>`,
    Pentagon: `<polygon points="50,8 92,40 76,90 24,90 8,40" fill="${fill}"/>`,
    Hexagon: `<polygon points="30,8 70,8 92,50 70,92 30,92 8,50" fill="${fill}"/>`,
  };
  return `<svg ${box}>${shapes[name]}</svg>`;
}
let fp_snState = { correct: 0, attempted: 0, mode: 'name', shape: null, answer: null };
function fp_renderShapeNames() {
  fp_snState = { correct: 0, attempted: 0, mode: 'name', shape: null, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔺 Name the Shape</h2>
      <p class="subtext">Name the shape, or count how many sides it has.</p>
      ${tutorHTML('fp_shapenames')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fpsn-mode-name" onclick="fp_setSNMode('name')">Name it</div>
        <div class="mcq-opt" id="fpsn-mode-sides" onclick="fp_setSNMode('sides')">Count the sides</div>
      </div>
      <div id="fpsn-score">${scoreHTML(fp_snState)}</div>
      <div id="fpsn-question"></div>
      <div id="fpsn-feedback" class="feedback"></div>
    </div>
  `;
  fp_markSNMode();
  fp_newSNQuestion();
}
function fp_setSNMode(m) { fp_snState.mode = m; fp_markSNMode(); fp_newSNQuestion(); }
function fp_markSNMode() {
  document.getElementById('fpsn-mode-name').classList.toggle('correct', fp_snState.mode === 'name');
  document.getElementById('fpsn-mode-sides').classList.toggle('correct', fp_snState.mode === 'sides');
}
function fp_newSNQuestion() {
  const pool = fp_snState.mode === 'sides' ? FP_SHAPE_DEFS.filter(s => s.sides > 0) : FP_SHAPE_DEFS;
  const shape = pick(pool);
  fp_snState.shape = shape;
  let text, answer, options;
  if (fp_snState.mode === 'name') {
    text = 'What is the name of this shape?';
    answer = shape.name;
    const distractors = shuffle(FP_SHAPE_DEFS.filter(s => s.name !== shape.name)).slice(0, 3).map(s => s.name);
    options = shuffle([shape.name, ...distractors]);
  } else {
    text = 'How many sides does this shape have?';
    answer = String(shape.sides);
    const base = shape.sides;
    options = shuffle([...new Set([base, base + 1, Math.max(1, base - 1), base + 2])]).slice(0, 4).map(String);
  }
  fp_snState.answer = answer;
  document.getElementById('fpsn-question').innerHTML = `
    <div class="q-box" style="text-align:center;">${fp_shapeSVG(shape.name)}</div>
    <div class="q-box">${text}</div>
    <div class="mcq-opts">${options.map(o => `<div class="mcq-opt" onclick="fp_checkSN(this, '${o}')">${o}</div>`).join('')}</div>
  `;
  document.getElementById('fpsn-feedback').className = 'feedback';
}
function fp_checkSN(el, val) {
  fp_snState.attempted++;
  const opts = document.querySelectorAll('#fpsn-question .mcq-opt');
  const fb = document.getElementById('fpsn-feedback');
  if (val === fp_snState.answer) {
    fp_snState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New shape loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(fp_newSNQuestion, 1000);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${fp_snState.answer}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('fpsn-score').innerHTML = scoreHTML(fp_snState);
}

// =====================================================================
// FOUNDATION - 17. PICTURE GRAPH (vertical picture bar graph)
// =====================================================================
const FP_GRAPH_SETS = [
  { items: [{ icon: '🍎', label: 'Apples' }, { icon: '🍌', label: 'Bananas' }, { icon: '🍇', label: 'Grapes' }] },
  { items: [{ icon: '🐶', label: 'Dogs' }, { icon: '🐱', label: 'Cats' }, { icon: '🐰', label: 'Rabbits' }] },
  { items: [{ icon: '⚽', label: 'Soccer balls' }, { icon: '🏀', label: 'Basketballs' }, { icon: '🎾', label: 'Tennis balls' }] },
  { items: [{ icon: '🚗', label: 'Cars' }, { icon: '🚌', label: 'Buses' }, { icon: '🚲', label: 'Bicycles' }] },
];
let fp_pgState = { correct: 0, attempted: 0, items: [], counts: [], answer: null };
function fp_renderPicGraph() {
  fp_pgState = { correct: 0, attempted: 0, items: [], counts: [], answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">📈 Picture Graph</h2>
      <p class="subtext">Each stack is made of real pictures. Count and compare them.</p>
      ${tutorHTML('fp_picgraph')}
      <div id="fppg-score">${scoreHTML(fp_pgState)}</div>
      <div id="fppg-question"></div>
      <div id="fppg-feedback" class="feedback"></div>
    </div>
  `;
  fp_newPGQuestion();
}
function fp_newPGQuestion() {
  const set = pick(FP_GRAPH_SETS);
  let counts;
  do {
    counts = set.items.map(() => randInt(1, 6));
  } while (new Set(counts).size < counts.length);
  fp_pgState.items = set.items;
  fp_pgState.counts = counts;
  const askType = pick(['count', 'most', 'least', 'total']);
  let text, answer, options;
  if (askType === 'count') {
    const idx = randInt(0, set.items.length - 1);
    text = `How many ${set.items[idx].label.toLowerCase()} are there?`;
    answer = String(counts[idx]);
    const base = counts[idx];
    options = shuffle([...new Set([base, base + 1, Math.max(0, base - 1), base + 2])]).slice(0, 4).map(String);
  } else if (askType === 'most') {
    const maxIdx = counts.indexOf(Math.max(...counts));
    text = 'Which picture has the most?';
    answer = set.items[maxIdx].label;
    options = shuffle(set.items.map(it => it.label));
  } else if (askType === 'least') {
    const minIdx = counts.indexOf(Math.min(...counts));
    text = 'Which picture has the least?';
    answer = set.items[minIdx].label;
    options = shuffle(set.items.map(it => it.label));
  } else {
    const total = counts.reduce((a, b) => a + b, 0);
    text = 'How many pictures are there altogether?';
    answer = String(total);
    options = shuffle([...new Set([total, total + 1, Math.max(0, total - 1), total + 2])]).slice(0, 4).map(String);
  }
  fp_pgState.answer = answer;
  const columns = set.items.map((it, i) => `
    <div style="display:inline-block; text-align:center; vertical-align:bottom; margin:0 12px 8px;">
      <div style="display:flex; flex-direction:column-reverse; align-items:center; gap:2px;">
        ${Array(counts[i]).fill(`<div style="font-size:1.6rem; line-height:1;">${it.icon}</div>`).join('')}
      </div>
      <div style="font-size:0.8rem; color:var(--text-soft); margin-top:4px; border-top:2px solid var(--border); padding-top:4px;">${it.label}</div>
    </div>
  `).join('');
  document.getElementById('fppg-question').innerHTML = `
    <div class="q-box" style="text-align:center;">${columns}</div>
    <div class="q-box">${text}</div>
    <div class="mcq-opts">${options.map(o => `<div class="mcq-opt" onclick="fp_checkPG(this, '${o}')">${o}</div>`).join('')}</div>
  `;
  document.getElementById('fppg-feedback').className = 'feedback';
}
function fp_checkPG(el, val) {
  fp_pgState.attempted++;
  const opts = document.querySelectorAll('#fppg-question .mcq-opt');
  const fb = document.getElementById('fppg-feedback');
  if (val === fp_pgState.answer) {
    fp_pgState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New graph loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(fp_newPGQuestion, 1100);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${fp_pgState.answer}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('fppg-score').innerHTML = scoreHTML(fp_pgState);
}

// =====================================================================
// FOUNDATION - 18. BREAKING UP METHOD (addition and subtraction)
// =====================================================================
let fp_buState = { correct: 0, attempted: 0, mode: 'add', a: 0, b: 0, answer: null };
function fp_renderBreakup() {
  fp_buState = { correct: 0, attempted: 0, mode: 'add', a: 0, b: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🧩 Breaking Up Method</h2>
      <p class="subtext">Break both numbers into tens and units, add or subtract each part, then combine.</p>
      ${tutorHTML('fp_breakup')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fpbu-mode-add" onclick="fp_setBUMode('add')">Addition</div>
        <div class="mcq-opt" id="fpbu-mode-sub" onclick="fp_setBUMode('sub')">Subtraction</div>
      </div>
      <div id="fpbu-score">${scoreHTML(fp_buState)}</div>
      <div id="fpbu-question"></div>
      <div id="fpbu-feedback" class="feedback"></div>
    </div>
  `;
  fp_markBUMode();
  fp_newBUQuestion();
}
function fp_setBUMode(m) { fp_buState.mode = m; fp_markBUMode(); fp_newBUQuestion(); }
function fp_markBUMode() {
  document.getElementById('fpbu-mode-add').classList.toggle('correct', fp_buState.mode === 'add');
  document.getElementById('fpbu-mode-sub').classList.toggle('correct', fp_buState.mode === 'sub');
}
function fp_newBUQuestion() {
  let a, b, tensA, unitsA, tensB, unitsB, sign;
  if (fp_buState.mode === 'add') {
    tensA = randInt(1, 8); unitsA = randInt(0, 9);
    tensB = randInt(1, 8); unitsB = randInt(0, 9);
    a = tensA * 10 + unitsA; b = tensB * 10 + unitsB;
    sign = '+';
  } else {
    unitsA = randInt(1, 9); unitsB = randInt(0, unitsA);
    tensA = randInt(3, 9); tensB = randInt(1, tensA - 1);
    a = tensA * 10 + unitsA; b = tensB * 10 + unitsB;
    sign = '-';
  }
  fp_buState.a = a; fp_buState.b = b;
  const partTens = fp_buState.mode === 'add' ? tensA * 10 + tensB * 10 : tensA * 10 - tensB * 10;
  const partUnits = fp_buState.mode === 'add' ? unitsA + unitsB : unitsA - unitsB;
  const total = fp_buState.mode === 'add' ? a + b : a - b;
  fp_buState.answer = [partTens, partUnits, total];
  document.getElementById('fpbu-question').innerHTML = `
    <div class="q-box" style="font-size:1.4rem; text-align:center;">
      ${a} ${sign} ${b}<br/>
      = (${tensA * 10} ${sign} ${tensB * 10}) ${sign} (${unitsA} ${sign} ${unitsB})<br/>
      = <input type="number" id="fpbu-in0" style="width:70px;" autofocus /> ${sign} <input type="number" id="fpbu-in1" style="width:60px;" /><br/>
      = <input type="number" id="fpbu-in2" style="width:80px;" />
    </div>
    <button class="action" onclick="fp_checkBU()">Check</button>
    <button class="secondary" onclick="fp_newBUQuestion()">New problem</button>
  `;
  document.getElementById('fpbu-feedback').className = 'feedback';
}
function fp_checkBU() {
  fp_buState.attempted++;
  const fb = document.getElementById('fpbu-feedback');
  const vals = fp_buState.answer.map((_, i) => parseInt(document.getElementById('fpbu-in' + i).value));
  const ok = vals.every((v, i) => v === fp_buState.answer[i]);
  if (ok) {
    fp_buState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    const btn = document.querySelector('#fpbu-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newBUQuestion, 1000);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. It breaks down as ${fp_buState.answer[0]} and ${fp_buState.answer[1]}, total ${fp_buState.answer[2]}.`;
  }
  document.getElementById('fpbu-score').innerHTML = scoreHTML(fp_buState);
}

// =====================================================================
// FOUNDATION - 19. BUILDING UP (BRIDGING THROUGH TEN)
// =====================================================================
let fp_brState = { correct: 0, attempted: 0, a: 0, b: 0, answer: null };
function fp_renderBridge10() {
  fp_brState = { correct: 0, attempted: 0, a: 0, b: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🌉 Building Up (Bridging Through 10)</h2>
      <p class="subtext">Split the second number so the first part makes 10, then add what is left.</p>
      ${tutorHTML('fp_bridge10')}
      <div id="fpbr-score">${scoreHTML(fp_brState)}</div>
      <div id="fpbr-question"></div>
      <div id="fpbr-feedback" class="feedback"></div>
    </div>
  `;
  fp_newBRQuestion();
}
function fp_newBRQuestion() {
  const a = randInt(6, 9);
  const gap = 10 - a;
  const b = randInt(gap + 1, 9);
  fp_brState.a = a; fp_brState.b = b;
  fp_brState.answer = [gap, b - gap, a + b];
  document.getElementById('fpbr-question').innerHTML = `
    <div class="q-box" style="font-size:1.4rem; text-align:center;">
      ${a} + ${b} = ?<br/>
      Break ${b} into two parts so the first part makes 10:<br/>
      ${a} + <input type="number" id="fpbr-in0" style="width:60px;" autofocus /> + <input type="number" id="fpbr-in1" style="width:60px;" /> = <input type="number" id="fpbr-in2" style="width:70px;" />
    </div>
    <button class="action" onclick="fp_checkBR()">Check</button>
    <button class="secondary" onclick="fp_newBRQuestion()">New problem</button>
  `;
  document.getElementById('fpbr-feedback').className = 'feedback';
}
function fp_checkBR() {
  fp_brState.attempted++;
  const fb = document.getElementById('fpbr-feedback');
  const vals = fp_brState.answer.map((_, i) => parseInt(document.getElementById('fpbr-in' + i).value));
  const ok = vals.every((v, i) => v === fp_brState.answer[i]);
  if (ok) {
    fp_brState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    const btn = document.querySelector('#fpbr-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newBRQuestion, 1000);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. First make 10 (add ${fp_brState.answer[0]}), then add ${fp_brState.answer[1]} more, total ${fp_brState.answer[2]}.`;
  }
  document.getElementById('fpbr-score').innerHTML = scoreHTML(fp_brState);
}

// =====================================================================
// FOUNDATION - 20. DOUBLING AND HALVING
// =====================================================================
let fp_dhState = { correct: 0, attempted: 0, mode: 'double', answer: null };
function fp_renderDoubleHalve() {
  fp_dhState = { correct: 0, attempted: 0, mode: 'double', answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🪞 Doubling and Halving</h2>
      <p class="subtext">Quick doubles and halves, plus using them as a strategy for bigger numbers.</p>
      ${tutorHTML('fp_doublehalve')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fpdh-mode-double" onclick="fp_setDHMode('double')">Doubles</div>
        <div class="mcq-opt" id="fpdh-mode-halve" onclick="fp_setDHMode('halve')">Halves</div>
        <div class="mcq-opt" id="fpdh-mode-near" onclick="fp_setDHMode('near')">Near doubles</div>
        <div class="mcq-opt" id="fpdh-mode-breakdouble" onclick="fp_setDHMode('breakdouble')">Break up to double</div>
        <div class="mcq-opt" id="fpdh-mode-breakhalve" onclick="fp_setDHMode('breakhalve')">Break up to halve</div>
      </div>
      <div id="fpdh-score">${scoreHTML(fp_dhState)}</div>
      <div id="fpdh-question"></div>
      <div id="fpdh-feedback" class="feedback"></div>
    </div>
  `;
  fp_markDHMode();
  fp_newDHQuestion();
}
function fp_setDHMode(m) { fp_dhState.mode = m; fp_markDHMode(); fp_newDHQuestion(); }
function fp_markDHMode() {
  ['double', 'halve', 'near', 'breakdouble', 'breakhalve'].forEach(m => document.getElementById('fpdh-mode-' + m).classList.toggle('correct', fp_dhState.mode === m));
}
function fp_newDHQuestion() {
  const mode = fp_dhState.mode;
  document.getElementById('fpdh-feedback').className = 'feedback';
  if (mode === 'double') {
    const n = randInt(1, 25);
    fp_dhState.answer = [n * 2];
    document.getElementById('fpdh-question').innerHTML = `
      <div class="q-box" style="font-size:1.4rem;">Double ${n} = <input type="number" id="fpdh-in0" style="width:70px;" autofocus /></div>
      <button class="action" onclick="fp_checkDH()">Check</button>
      <button class="secondary" onclick="fp_newDHQuestion()">Skip</button>
    `;
  } else if (mode === 'halve') {
    const n = randInt(1, 25) * 2;
    fp_dhState.answer = [n / 2];
    document.getElementById('fpdh-question').innerHTML = `
      <div class="q-box" style="font-size:1.4rem;">Half of ${n} = <input type="number" id="fpdh-in0" style="width:70px;" autofocus /></div>
      <button class="action" onclick="fp_checkDH()">Check</button>
      <button class="secondary" onclick="fp_newDHQuestion()">Skip</button>
    `;
  } else if (mode === 'near') {
    const a = randInt(2, 9);
    const b = a + 1;
    fp_dhState.answer = [a * 2, a * 2 + 1];
    document.getElementById('fpdh-question').innerHTML = `
      <div class="q-box" style="font-size:1.4rem; text-align:center;">
        ${a} + ${b} = ?<br/>
        Use double ${a}, then add 1:<br/>
        <input type="number" id="fpdh-in0" style="width:70px;" autofocus /> + 1 = <input type="number" id="fpdh-in1" style="width:70px;" />
      </div>
      <button class="action" onclick="fp_checkDH()">Check</button>
      <button class="secondary" onclick="fp_newDHQuestion()">Skip</button>
    `;
  } else if (mode === 'breakdouble') {
    const tens = randInt(1, 4) * 10;
    const units = randInt(1, 9);
    const n = tens + units;
    fp_dhState.answer = [tens * 2, units * 2, n * 2];
    document.getElementById('fpdh-question').innerHTML = `
      <div class="q-box" style="font-size:1.4rem; text-align:center;">
        Double ${n} = ?<br/>
        Break ${n} into ${tens} and ${units}:<br/>
        Double ${tens} = <input type="number" id="fpdh-in0" style="width:70px;" autofocus />,
        double ${units} = <input type="number" id="fpdh-in1" style="width:60px;" /><br/>
        Total = <input type="number" id="fpdh-in2" style="width:70px;" />
      </div>
      <button class="action" onclick="fp_checkDH()">Check</button>
      <button class="secondary" onclick="fp_newDHQuestion()">Skip</button>
    `;
  } else {
    const tens = randInt(1, 4) * 20;
    const units = randInt(1, 4) * 2;
    const n = tens + units;
    fp_dhState.answer = [tens / 2, units / 2, n / 2];
    document.getElementById('fpdh-question').innerHTML = `
      <div class="q-box" style="font-size:1.4rem; text-align:center;">
        Half of ${n} = ?<br/>
        Break ${n} into ${tens} and ${units}:<br/>
        Half of ${tens} = <input type="number" id="fpdh-in0" style="width:70px;" autofocus />,
        half of ${units} = <input type="number" id="fpdh-in1" style="width:60px;" /><br/>
        Total = <input type="number" id="fpdh-in2" style="width:70px;" />
      </div>
      <button class="action" onclick="fp_checkDH()">Check</button>
      <button class="secondary" onclick="fp_newDHQuestion()">Skip</button>
    `;
  }
}
function fp_checkDH() {
  fp_dhState.attempted++;
  const fb = document.getElementById('fpdh-feedback');
  const vals = fp_dhState.answer.map((_, i) => parseInt(document.getElementById('fpdh-in' + i).value));
  const ok = vals.every((v, i) => v === fp_dhState.answer[i]);
  if (ok) {
    fp_dhState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    const btn = document.querySelector('#fpdh-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newDHQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The correct answer was ${fp_dhState.answer.join(', ')}.`;
  }
  document.getElementById('fpdh-score').innerHTML = scoreHTML(fp_dhState);
}

// =====================================================================
// FOUNDATION - 21. COLUMN METHOD (carrying and borrowing)
// =====================================================================
let fp_clState = { correct: 0, attempted: 0, mode: 'add', a: 0, b: 0, answer: null };
function fp_renderColumn() {
  fp_clState = { correct: 0, attempted: 0, mode: 'add', a: 0, b: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">📶 Column Method</h2>
      <p class="subtext">The written method, stacking numbers by place value, carrying or borrowing between columns.</p>
      ${tutorHTML('fp_column')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="fpcl-mode-add" onclick="fp_setCLMode('add')">Addition (carrying)</div>
        <div class="mcq-opt" id="fpcl-mode-sub" onclick="fp_setCLMode('sub')">Subtraction (borrowing)</div>
      </div>
      <div id="fpcl-score">${scoreHTML(fp_clState)}</div>
      <div id="fpcl-question"></div>
      <div id="fpcl-feedback" class="feedback"></div>
    </div>
  `;
  fp_markCLMode();
  fp_newCLQuestion();
}
function fp_setCLMode(m) { fp_clState.mode = m; fp_markCLMode(); fp_newCLQuestion(); }
function fp_markCLMode() {
  document.getElementById('fpcl-mode-add').classList.toggle('correct', fp_clState.mode === 'add');
  document.getElementById('fpcl-mode-sub').classList.toggle('correct', fp_clState.mode === 'sub');
}
function fp_clStack(a, b, sign) {
  const pad = (n) => String(n).padStart(2, ' ');
  return `
    <div style="font-family:'Courier New', monospace; font-size:1.6rem; text-align:right; display:inline-block; line-height:1.5;">
      <div>&nbsp;&nbsp;${pad(a)}</div>
      <div>${sign} ${pad(b)}</div>
      <div style="border-top:3px solid var(--ocean-dark); margin-top:2px;">&nbsp;</div>
    </div>
  `;
}
function fp_newCLQuestion() {
  document.getElementById('fpcl-feedback').className = 'feedback';
  if (fp_clState.mode === 'add') {
    const unitsA = randInt(1, 9);
    const unitsB = randInt(Math.max(1, 10 - unitsA), 9);
    const tensA = randInt(1, 7);
    const tensB = randInt(1, 8 - tensA);
    const a = tensA * 10 + unitsA, b = tensB * 10 + unitsB;
    fp_clState.a = a; fp_clState.b = b;
    const unitsSum = unitsA + unitsB;
    const tensSum = tensA + tensB + 1;
    fp_clState.answer = [unitsSum, tensSum, a + b];
    document.getElementById('fpcl-question').innerHTML = `
      ${fp_clStack(a, b, '+')}
      <div class="q-box" style="font-size:1.2rem;">
        Units column: ${unitsA} + ${unitsB} = <input type="number" id="fpcl-in0" style="width:60px;" autofocus /> (write down the last digit, carry the ten)<br/>
        Tens column: ${tensA} + ${tensB} + 1 (the carried ten) = <input type="number" id="fpcl-in1" style="width:60px;" /><br/>
        Final answer: <input type="number" id="fpcl-in2" style="width:80px;" />
      </div>
      <button class="action" onclick="fp_checkCL()">Check</button>
      <button class="secondary" onclick="fp_newCLQuestion()">New problem</button>
    `;
  } else {
    const unitsA = randInt(0, 8);
    const unitsB = randInt(unitsA + 1, 9);
    const tensA = randInt(2, 9);
    const tensB = randInt(1, tensA - 1);
    const a = tensA * 10 + unitsA, b = tensB * 10 + unitsB;
    fp_clState.a = a; fp_clState.b = b;
    const unitsDiff = (unitsA + 10) - unitsB;
    const tensDiff = (tensA - 1) - tensB;
    fp_clState.answer = [unitsDiff, tensDiff, a - b];
    document.getElementById('fpcl-question').innerHTML = `
      ${fp_clStack(a, b, '-')}
      <div class="q-box" style="font-size:1.2rem;">
        ${unitsA} is smaller than ${unitsB}, so rename: borrow a ten from the tens column.<br/>
        Units column: (${unitsA} + 10) - ${unitsB} = <input type="number" id="fpcl-in0" style="width:60px;" autofocus /><br/>
        Tens column: (${tensA} - 1) - ${tensB} = <input type="number" id="fpcl-in1" style="width:60px;" /><br/>
        Final answer: <input type="number" id="fpcl-in2" style="width:80px;" />
      </div>
      <button class="action" onclick="fp_checkCL()">Check</button>
      <button class="secondary" onclick="fp_newCLQuestion()">New problem</button>
    `;
  }
}
function fp_checkCL() {
  fp_clState.attempted++;
  const fb = document.getElementById('fpcl-feedback');
  const vals = fp_clState.answer.map((_, i) => parseInt(document.getElementById('fpcl-in' + i).value));
  const ok = vals.every((v, i) => v === fp_clState.answer[i]);
  if (ok) {
    fp_clState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    const btn = document.querySelector('#fpcl-question .action');
    if (btn) btn.onclick = null;
    setTimeout(fp_newCLQuestion, 1000);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${fp_clState.answer[2]}.`;
  }
  document.getElementById('fpcl-score').innerHTML = scoreHTML(fp_clState);
}
