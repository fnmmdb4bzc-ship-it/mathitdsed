// =====================================================================
// 1. PLACE VALUE EXPLORER (4 digit numbers)
// =====================================================================
let g4_pvState = { correct: 0, attempted: 0, answer: null };
function g4_renderPlaceValue() {
  g4_pvState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔢 Place Value Explorer</h2>
      <p class="subtext">What is the <em>value</em> of the highlighted digit? Not just its name, its real value in the number.</p>
      ${tutorHTML('g4_placevalue')}
      <div id="pv-score">${scoreHTML(g4_pvState)}</div>
      <div id="pv-question"></div>
      <div id="pv-feedback" class="feedback"></div>
    </div>
  `;
  g4_newPVQuestion();
}
function g4_newPVQuestion() {
  const num = randInt(1000, 9999);
  const numStr = String(num);
  const pos = randInt(0, 3);
  const digit = parseInt(numStr[pos]);
  const placeValueExp = numStr.length - 1 - pos;
  const correct = digit * Math.pow(10, placeValueExp);
  g4_pvState.answer = correct;
  const display = numStr.split('').map((d, i) => i === pos ? `<span style="color:#E11D48; text-decoration:underline;">${d}</span>` : d).join('');
  let options = [correct, digit, correct + Math.pow(10, placeValueExp), Math.max(1, correct - Math.pow(10, placeValueExp))];
  options = [...new Set(options)];
  while (options.length < 4) options.push(correct + randInt(1, 9));
  const finalOpts = shuffle(options.slice(0, 4));
  document.getElementById('pv-question').innerHTML = `
    <div class="q-box">In the number <strong>${display}</strong>, what is the value of the underlined digit?</div>
    <div class="mcq-opts">${finalOpts.map(o => `<div class="mcq-opt" onclick="g4_checkPV(this, ${o})">${o.toLocaleString('en-ZA').replace(/,/g,' ')}</div>`).join('')}</div>
    <button class="secondary small" onclick="g4_newPVQuestion()">Skip, new number</button>
  `;
  document.getElementById('pv-feedback').className = 'feedback';
}
function g4_checkPV(el, val) {
  g4_pvState.attempted++;
  const opts = document.querySelectorAll('#pv-question .mcq-opt');
  const fb = document.getElementById('pv-feedback');
  if (val === g4_pvState.answer) {
    g4_pvState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Yes, that is right! New question loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g4_newPVQuestion, 1100);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The correct value is ${g4_pvState.answer.toLocaleString('en-ZA').replace(/,/g,' ')}. Look at which column that digit sits in.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('pv-score').innerHTML = scoreHTML(g4_pvState);
}

// =====================================================================
// 2. COMPARE AND ORDER
// =====================================================================
let g4_cpState = { correct: 0, attempted: 0, answer: null };
function g4_renderCompare() {
  g4_cpState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">⚖️ Compare and Order</h2>
      <p class="subtext">Choose the sign that belongs between the two numbers.</p>
      ${tutorHTML('g4_compare')}
      <div id="cp-score">${scoreHTML(g4_cpState)}</div>
      <div id="cp-question"></div>
      <div id="cp-feedback" class="feedback"></div>
    </div>
  `;
  g4_newCPQuestion();
}
function g4_newCPQuestion() {
  let a = randInt(100, 9999), b = randInt(100, 9999);
  if (Math.random() < 0.25) b = a;
  g4_cpState.answer = a === b ? '=' : (a > b ? '>' : '<');
  document.getElementById('cp-question').innerHTML = `
    <div class="q-box">${a.toLocaleString('en-ZA').replace(/,/g,' ')} &nbsp; ___ &nbsp; ${b.toLocaleString('en-ZA').replace(/,/g,' ')}</div>
    <div class="mcq-opts">
      <div class="mcq-opt" onclick="g4_checkCP(this, '<')" style="font-size:1.3rem;">&lt;</div>
      <div class="mcq-opt" onclick="g4_checkCP(this, '>')" style="font-size:1.3rem;">&gt;</div>
      <div class="mcq-opt" onclick="g4_checkCP(this, '=')" style="font-size:1.3rem;">=</div>
    </div>
    <button class="secondary small" onclick="g4_newCPQuestion()">New numbers</button>
  `;
  document.getElementById('cp-feedback').className = 'feedback';
}
function g4_checkCP(el, val) {
  g4_cpState.attempted++;
  const opts = document.querySelectorAll('#cp-question .mcq-opt');
  const fb = document.getElementById('cp-feedback');
  if (val === g4_cpState.answer) {
    g4_cpState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New question loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g4_newCPQuestion, 900);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The correct sign was ${g4_cpState.answer}. Start from the leftmost digit of each number.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('cp-score').innerHTML = scoreHTML(g4_cpState);
}

// =====================================================================
// 3. DOUBLE AND HALF
// =====================================================================
let g4_dhState = { correct: 0, attempted: 0, answer: null, level: 1 };
function g4_renderDoubleHalf() {
  g4_dhState = { correct: 0, attempted: 0, answer: null, level: 1 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🪞 Double and Half</h2>
      <p class="subtext">Double the number, or find half of it.</p>
      ${tutorHTML('g4_doublehalf')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="dh-lvl-1" onclick="g4_setDHLevel(1)">Level 1</div>
        <div class="mcq-opt" id="dh-lvl-2" onclick="g4_setDHLevel(2)">Level 2</div>
        <div class="mcq-opt" id="dh-lvl-3" onclick="g4_setDHLevel(3)">Level 3</div>
      </div>
      <div id="dh-score">${scoreHTML(g4_dhState)}</div>
      <div id="dh-question"></div>
      <div id="dh-feedback" class="feedback"></div>
    </div>
  `;
  g4_markDHLevel();
  g4_newDHQuestion();
}
function g4_setDHLevel(l) { g4_dhState.level = l; g4_markDHLevel(); g4_newDHQuestion(); }
function g4_markDHLevel() {
  [1,2,3].forEach(l => document.getElementById('dh-lvl-' + l).classList.toggle('correct', g4_dhState.level === l));
}
function g4_newDHQuestion() {
  const isDouble = Math.random() < 0.5;
  let n;
  if (g4_dhState.level === 1) n = randInt(1, 25) * (isDouble ? 1 : 2);
  else if (g4_dhState.level === 2) n = randInt(10, 60) * (isDouble ? 1 : 2);
  else n = randInt(50, 250) * (isDouble ? 1 : 2);
  g4_dhState.answer = isDouble ? n * 2 : n / 2;
  document.getElementById('dh-question').innerHTML = `
    <div class="q-box">${isDouble ? `Double ${n}` : `Half of ${n}`} = <input type="number" id="dh-in" autofocus /></div>
    <button class="action" onclick="g4_checkDH()">Check</button>
    <button class="secondary" onclick="g4_newDHQuestion()">Skip</button>
  `;
  document.getElementById('dh-feedback').className = 'feedback';
  const inputEl = document.getElementById('dh-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g4_checkDH(); });
}
function g4_checkDH() {
  const v = parseFloat(document.getElementById('dh-in').value);
  g4_dhState.attempted++;
  const fb = document.getElementById('dh-feedback');
  if (v === g4_dhState.answer) {
    g4_dhState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newDHQuestion, 800);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g4_dhState.answer}.`;
  }
  document.getElementById('dh-score').innerHTML = scoreHTML(g4_dhState);
}

// =====================================================================
// 4. FILLING UP TENS
// =====================================================================
let g4_ftState = { correct: 0, attempted: 0, answer: null };
function g4_renderFillTen() {
  g4_ftState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🎯 Filling Up Tens</h2>
      <p class="subtext">How much more does the number need to reach the next friendly number?</p>
      ${tutorHTML('g4_fillten')}
      <div id="ft-score">${scoreHTML(g4_ftState)}</div>
      <div id="ft-question"></div>
      <div id="ft-feedback" class="feedback"></div>
    </div>
  `;
  g4_newFTQuestion();
}
function g4_newFTQuestion() {
  const mode = pick(['ten', 'hundred']);
  let start, target;
  if (mode === 'ten') { target = randInt(2, 99) * 10; start = target - randInt(1, 9); }
  else { target = randInt(2, 19) * 100; start = target - randInt(1, 99); }
  g4_ftState.answer = target - start;
  document.getElementById('ft-question').innerHTML = `
    <div class="q-box">${start} + ___ = ${target}</div>
    <input type="number" id="ft-in" autofocus />
    <button class="action" onclick="g4_checkFT()">Check</button>
    <button class="secondary" onclick="g4_newFTQuestion()">Skip</button>
  `;
  document.getElementById('ft-feedback').className = 'feedback';
  const inputEl = document.getElementById('ft-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g4_checkFT(); });
}
function g4_checkFT() {
  const v = parseInt(document.getElementById('ft-in').value);
  g4_ftState.attempted++;
  const fb = document.getElementById('ft-feedback');
  if (v === g4_ftState.answer) {
    g4_ftState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newFTQuestion, 800);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g4_ftState.answer}.`;
  }
  document.getElementById('ft-score').innerHTML = scoreHTML(g4_ftState);
}

// =====================================================================
// 5. ADD AND SUBTRACT BLITZ
// =====================================================================
let g4_asState = { correct: 0, attempted: 0, answer: null, digits: 4 };
function g4_renderAddSub() {
  g4_asState = { correct: 0, attempted: 0, answer: null, digits: 4 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">➕ Add and Subtract Blitz</h2>
      <p class="subtext">Choose a level. Work it out on paper first if you need to, then type the answer.</p>
      ${tutorHTML('g4_addsub')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="as-d2" onclick="g4_setASDigits(2)">2 digit</div>
        <div class="mcq-opt" id="as-d3" onclick="g4_setASDigits(3)">3 digit</div>
        <div class="mcq-opt" id="as-d4" onclick="g4_setASDigits(4)">4 digit</div>
      </div>
      <div id="as-score">${scoreHTML(g4_asState)}</div>
      <div id="as-question"></div>
      <div id="as-feedback" class="feedback"></div>
    </div>
  `;
  g4_markASDigits();
  g4_newASQuestion();
}
function g4_setASDigits(d) { g4_asState.digits = d; g4_markASDigits(); g4_newASQuestion(); }
function g4_markASDigits() {
  [2,3,4].forEach(d => document.getElementById('as-d' + d).classList.toggle('correct', g4_asState.digits === d));
}
function g4_newASQuestion() {
  const isAdd = Math.random() < 0.5;
  const lo = Math.pow(10, g4_asState.digits - 1), hi = Math.pow(10, g4_asState.digits) - 1;
  let a = randInt(lo, hi), b = randInt(lo, hi);
  if (!isAdd && b > a) [a, b] = [b, a];
  g4_asState.answer = isAdd ? a + b : a - b;
  document.getElementById('as-question').innerHTML = `
    <div class="q-box">${a} ${isAdd ? '+' : '-'} ${b} = <input type="number" id="as-in" autofocus /></div>
    <button class="action" onclick="g4_checkAS()">Check</button>
    <button class="secondary" onclick="g4_newASQuestion()">Skip</button>
  `;
  document.getElementById('as-feedback').className = 'feedback';
  const inputEl = document.getElementById('as-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g4_checkAS(); });
}
function g4_checkAS() {
  const v = parseInt(document.getElementById('as-in').value);
  g4_asState.attempted++;
  const fb = document.getElementById('as-feedback');
  if (v === g4_asState.answer) {
    g4_asState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newASQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g4_asState.answer}.`;
  }
  document.getElementById('as-score').innerHTML = scoreHTML(g4_asState);
}

// =====================================================================
// 6. MULTIPLICATION PRACTICE
// =====================================================================
let g4_mpState = { correct: 0, attempted: 0, answer: null, mode: '2x1' };
function g4_renderMultiply() {
  g4_mpState = { correct: 0, attempted: 0, answer: null, mode: '2x1' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">✖️ Multiplication Practice</h2>
      <p class="subtext">Choose your level, then answer as many as you can.</p>
      ${tutorHTML('g4_multiply')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="mp-mode-2x1" onclick="g4_setMPMode('2x1')">2 digit by 1 digit</div>
        <div class="mcq-opt" id="mp-mode-2x2" onclick="g4_setMPMode('2x2')">2 digit by 2 digit</div>
      </div>
      <div id="mp-score">${scoreHTML(g4_mpState)}</div>
      <div id="mp-question"></div>
      <div id="mp-feedback" class="feedback"></div>
    </div>
  `;
  g4_markMPMode();
  g4_newMPQuestion();
}
function g4_setMPMode(mode) { g4_mpState.mode = mode; g4_markMPMode(); g4_newMPQuestion(); }
function g4_markMPMode() {
  document.getElementById('mp-mode-2x1').classList.toggle('correct', g4_mpState.mode === '2x1');
  document.getElementById('mp-mode-2x2').classList.toggle('correct', g4_mpState.mode === '2x2');
}
function g4_newMPQuestion() {
  let a, b;
  if (g4_mpState.mode === '2x1') { a = randInt(11, 99); b = randInt(2, 9); }
  else { a = randInt(11, 99); b = randInt(11, 99); }
  g4_mpState.answer = a * b;
  document.getElementById('mp-question').innerHTML = `
    <div class="q-box">${a} &times; ${b} = <input type="number" id="mp-in" autofocus /></div>
    <button class="action" onclick="g4_checkMP()">Check</button>
    <button class="secondary" onclick="g4_newMPQuestion()">Skip</button>
  `;
  document.getElementById('mp-feedback').className = 'feedback';
  const inputEl = document.getElementById('mp-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g4_checkMP(); });
}
function g4_checkMP() {
  const v = parseInt(document.getElementById('mp-in').value);
  g4_mpState.attempted++;
  const fb = document.getElementById('mp-feedback');
  if (v === g4_mpState.answer) {
    g4_mpState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newMPQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g4_mpState.answer}.`;
  }
  document.getElementById('mp-score').innerHTML = scoreHTML(g4_mpState);
}

// =====================================================================
// 7. DIVISION PRACTICE
// =====================================================================
let g4_dvState = { correct: 0, attempted: 0, answer: null, remainder: 0, mode: 'exact' };
function g4_renderDivide() {
  g4_dvState = { correct: 0, attempted: 0, answer: null, remainder: 0, mode: 'exact' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">➗ Division Practice</h2>
      <p class="subtext">A 3 digit number divided by a 1 digit number. Think about the matching multiplication fact.</p>
      ${tutorHTML('g4_divide')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="dv-mode-exact" onclick="g4_setDVMode('exact')">Exact answer</div>
        <div class="mcq-opt" id="dv-mode-rem" onclick="g4_setDVMode('remainder')">With a remainder</div>
      </div>
      <div id="dv-score">${scoreHTML(g4_dvState)}</div>
      <div id="dv-question"></div>
      <div id="dv-feedback" class="feedback"></div>
    </div>
  `;
  g4_markDVMode();
  g4_newDVQuestion();
}
function g4_setDVMode(m) { g4_dvState.mode = m; g4_markDVMode(); g4_newDVQuestion(); }
function g4_markDVMode() {
  document.getElementById('dv-mode-exact').classList.toggle('correct', g4_dvState.mode === 'exact');
  document.getElementById('dv-mode-rem').classList.toggle('correct', g4_dvState.mode === 'remainder');
}
function g4_newDVQuestion() {
  const divisor = randInt(2, 9);
  let quotient, dividend, remainder = 0;
  if (g4_dvState.mode === 'exact') {
    do { quotient = randInt(12, 99); dividend = divisor * quotient; } while (dividend < 100 || dividend > 999);
  } else {
    do {
      quotient = randInt(12, 99);
      remainder = randInt(1, divisor - 1);
      dividend = divisor * quotient + remainder;
    } while (dividend < 100 || dividend > 999);
  }
  g4_dvState.answer = quotient; g4_dvState.remainder = remainder;
  document.getElementById('dv-question').innerHTML = `
    <div class="q-box">${dividend} &divide; ${divisor} = ___ ${g4_dvState.mode === 'remainder' ? 'remainder ___' : ''}</div>
    Answer: <input type="number" id="dv-in" autofocus style="width:80px;" />
    ${g4_dvState.mode === 'remainder' ? 'Remainder: <input type="number" id="dv-rem" style="width:80px;" />' : ''}
    <button class="action" onclick="g4_checkDV()">Check</button>
    <button class="secondary" onclick="g4_newDVQuestion()">Skip</button>
  `;
  document.getElementById('dv-feedback').className = 'feedback';
  const inputEl = document.getElementById('dv-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g4_checkDV(); });
}
function g4_checkDV() {
  const v = parseInt(document.getElementById('dv-in').value);
  const remEl = document.getElementById('dv-rem');
  const r = remEl ? parseInt(remEl.value) : 0;
  g4_dvState.attempted++;
  const fb = document.getElementById('dv-feedback');
  const ok = g4_dvState.mode === 'exact' ? (v === g4_dvState.answer) : (v === g4_dvState.answer && r === g4_dvState.remainder);
  if (ok) {
    g4_dvState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newDVQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = g4_dvState.mode === 'exact' ? `Not quite. The answer was ${g4_dvState.answer}.` : `Not quite. The answer was ${g4_dvState.answer} remainder ${g4_dvState.remainder}.`;
  }
  document.getElementById('dv-score').innerHTML = scoreHTML(g4_dvState);
}

// =====================================================================
// 8. NUMBER SENTENCES
// =====================================================================
let g4_nsState = { correct: 0, attempted: 0, answer: null };
function g4_renderNumSentence() {
  g4_nsState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🧩 Number Sentences</h2>
      <p class="subtext">Find the missing number that makes the sentence true.</p>
      ${tutorHTML('g4_numsentence')}
      <div id="ns-score">${scoreHTML(g4_nsState)}</div>
      <div id="ns-question"></div>
      <div id="ns-feedback" class="feedback"></div>
    </div>
  `;
  g4_newNSQuestion();
}
function g4_newNSQuestion() {
  const op = pick(['+', '-', 'x', '/']);
  let text, answer;
  if (op === '+') { const a = randInt(10, 200), b = randInt(10, 200); text = `${a} + ___ = ${a + b}`; answer = b; }
  else if (op === '-') { const a = randInt(50, 300), b = randInt(10, a - 1); text = `${a} - ___ = ${a - b}`; answer = b; }
  else if (op === 'x') { const a = randInt(2, 12), b = randInt(2, 12); text = `${a} &times; ___ = ${a * b}`; answer = b; }
  else { const b = randInt(2, 9), q = randInt(2, 12); text = `___ &divide; ${b} = ${q}`; answer = b * q; }
  g4_nsState.answer = answer;
  document.getElementById('ns-question').innerHTML = `
    <div class="q-box">${text}</div>
    <input type="number" id="ns-in" autofocus />
    <button class="action" onclick="g4_checkNS()">Check</button>
    <button class="secondary" onclick="g4_newNSQuestion()">Skip</button>
  `;
  document.getElementById('ns-feedback').className = 'feedback';
  const inputEl = document.getElementById('ns-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g4_checkNS(); });
}
function g4_checkNS() {
  const v = parseInt(document.getElementById('ns-in').value);
  g4_nsState.attempted++;
  const fb = document.getElementById('ns-feedback');
  if (v === g4_nsState.answer) {
    g4_nsState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newNSQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The missing number was ${g4_nsState.answer}.`;
  }
  document.getElementById('ns-score').innerHTML = scoreHTML(g4_nsState);
}

// =====================================================================
// 9. TIMES TABLES BLITZ
// =====================================================================
let g4_ttState = { correct: 0, attempted: 0, answer: null, tables: [2,5,10] };
function g4_renderTables() {
  g4_ttState = { correct: 0, attempted: 0, answer: null, tables: [2,5,10] };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">📐 Times Tables Blitz</h2>
      <p class="subtext">Choose which tables to focus on, then answer as fast as you can.</p>
      ${tutorHTML('g4_tables')}
      <div id="tt-picker"></div>
      <div id="tt-score">${scoreHTML(g4_ttState)}</div>
      <div id="tt-question"></div>
      <div id="tt-feedback" class="feedback"></div>
    </div>
  `;
  g4_renderTTPicker();
  g4_newTTQuestion();
}
function g4_renderTTPicker() {
  const all = [2,3,4,5,6,7,8,9,10,11,12];
  document.getElementById('tt-picker').innerHTML = `
    <div class="mcq-opts" style="margin-bottom:6px;">
      ${all.map(n => `<div class="mcq-opt ${g4_ttState.tables.includes(n) ? 'correct' : ''}" style="padding:6px 12px;" onclick="g4_toggleTable(${n})">${n} times</div>`).join('')}
    </div>
  `;
}
function g4_toggleTable(n) {
  if (g4_ttState.tables.includes(n)) { if (g4_ttState.tables.length > 1) g4_ttState.tables = g4_ttState.tables.filter(x => x !== n); }
  else { g4_ttState.tables.push(n); }
  g4_renderTTPicker();
}
function g4_newTTQuestion() {
  const a = pick(g4_ttState.tables);
  const b = randInt(1, 12);
  g4_ttState.answer = a * b;
  document.getElementById('tt-question').innerHTML = `
    <div class="q-box">${a} &times; ${b} = <input type="number" id="tt-in" autofocus /></div>
    <button class="action" onclick="g4_checkTT()">Check</button>
    <button class="secondary" onclick="g4_newTTQuestion()">Skip</button>
  `;
  document.getElementById('tt-feedback').className = 'feedback';
  const inputEl = document.getElementById('tt-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g4_checkTT(); });
}
function g4_checkTT() {
  const v = parseInt(document.getElementById('tt-in').value);
  g4_ttState.attempted++;
  const fb = document.getElementById('tt-feedback');
  if (v === g4_ttState.answer) {
    g4_ttState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newTTQuestion, 600);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g4_ttState.answer}.`;
    setTimeout(g4_newTTQuestion, 1500);
  }
  document.getElementById('tt-score').innerHTML = scoreHTML(g4_ttState);
}

// =====================================================================
// 10. COMPARE FRACTIONS
// =====================================================================
let g4_cfState = { answer: null, correct: 0, attempted: 0 };
function g4_renderCompareFrac() {
  g4_cfState = { answer: null, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🍕 Compare Fractions</h2>
      <p class="subtext">Look at the two pictures. Which fraction is bigger, or are they equal?</p>
      ${tutorHTML('g4_comparefrac')}
      <div id="cf-score">${scoreHTML(g4_cfState)}</div>
      <div id="cf-question"></div>
      <div id="cf-feedback" class="feedback"></div>
    </div>
  `;
  g4_newCFQuestion();
}
function g4_fracValue(n, d) { return n / d; }
function g4_newCFQuestion() {
  const denoms = [2,3,4,5,6,7,8];
  const d1 = pick(denoms), d2 = pick(denoms);
  const n1 = randInt(1, d1 - 1), n2 = randInt(1, d2 - 1);
  const v1 = g4_fracValue(n1, d1), v2 = g4_fracValue(n2, d2);
  g4_cfState.answer = Math.abs(v1 - v2) < 0.0001 ? 'equal' : (v1 > v2 ? 'left' : 'right');
  document.getElementById('cf-question').innerHTML = `
    <div style="display:flex; gap:24px; flex-wrap:wrap; margin:14px 0;">
      <div><div class="fraclabel">${n1}/${d1}</div>${fracBar(n1, d1)}</div>
      <div><div class="fraclabel">${n2}/${d2}</div>${fracBar(n2, d2)}</div>
    </div>
    <div class="mcq-opts">
      <div class="mcq-opt" onclick="g4_checkCF(this, 'left')">Left is bigger</div>
      <div class="mcq-opt" onclick="g4_checkCF(this, 'right')">Right is bigger</div>
      <div class="mcq-opt" onclick="g4_checkCF(this, 'equal')">They are equal</div>
    </div>
    <button class="secondary small" onclick="g4_newCFQuestion()">New fractions</button>
  `;
  document.getElementById('cf-feedback').className = 'feedback';
}
function g4_checkCF(el, val) {
  g4_cfState.attempted++;
  const opts = document.querySelectorAll('#cf-question .mcq-opt');
  const fb = document.getElementById('cf-feedback');
  if (val === g4_cfState.answer) {
    g4_cfState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New question loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g4_newCFQuestion, 1100);
  } else {
    el.classList.add('wrong');
    const answerText = g4_cfState.answer === 'equal' ? 'they are equal' : (g4_cfState.answer === 'left' ? 'the left one is bigger' : 'the right one is bigger');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. Look at the shaded parts again, ${answerText}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('cf-score').innerHTML = scoreHTML(g4_cfState);
}

// =====================================================================
// 11. ADD AND SUBTRACT FRACTIONS (same denominator)
// =====================================================================
let g4_afState = { num: 0, den: 0, correct: 0, attempted: 0 };
function g4_renderAddFrac() {
  g4_afState = { num: 0, den: 0, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🍰 Add and Subtract Fractions</h2>
      <p class="subtext">Same denominator throughout. Type your answer as a fraction, for example 3/4.</p>
      ${tutorHTML('g4_addfrac')}
      <div id="af-score">${scoreHTML(g4_afState)}</div>
      <div id="af-question"></div>
      <div id="af-feedback" class="feedback"></div>
    </div>
  `;
  g4_newAFQuestion();
}
function g4_newAFQuestion() {
  const den = pick([2,3,4,5,6,7,8]);
  const isAdd = Math.random() < 0.5;
  let n1, n2, num;
  if (isAdd) { n1 = randInt(1, den - 1); n2 = randInt(1, den - n1); num = n1 + n2; }
  else { n1 = randInt(1, den - 1); n2 = randInt(1, n1); num = n1 - n2; }
  g4_afState.num = num; g4_afState.den = den;
  document.getElementById('af-question').innerHTML = `
    <div class="q-box">${n1}/${den} ${isAdd ? '+' : '-'} ${n2}/${den} = <input type="text" id="af-in" placeholder="for example 5/${den}" style="width:90px;" /></div>
    <button class="action" onclick="g4_checkAF()">Check</button>
    <button class="secondary" onclick="g4_newAFQuestion()">Skip</button>
  `;
  document.getElementById('af-feedback').className = 'feedback';
}
function g4_checkAF() {
  const raw = (document.getElementById('af-in').value || '').trim();
  const parts = raw.split('/');
  g4_afState.attempted++;
  const fb = document.getElementById('af-feedback');
  let ok = false;
  if (parts.length === 2) {
    const un = parseInt(parts[0]), ud = parseInt(parts[1]);
    if (!isNaN(un) && !isNaN(ud) && ud !== 0) ok = un * g4_afState.den === g4_afState.num * ud;
  } else if (parts.length === 1 && parseInt(parts[0]) === 0 && g4_afState.num === 0) {
    ok = true;
  }
  if (ok) {
    g4_afState.correct++;
    fb.className = 'feedback good';
    fb.textContent = `Correct! (${g4_afState.num}/${g4_afState.den}). Next one.`;
    setTimeout(g4_newAFQuestion, 1100);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g4_afState.num}/${g4_afState.den}.`;
  }
  document.getElementById('af-score').innerHTML = scoreHTML(g4_afState);
}

// =====================================================================
// 12, 13, 14. MEASUREMENT (length, capacity, mass) share one engine
// =====================================================================
const g4_MEASURE_CONFIG = {
  g4_length: { units: [['mm','cm',10], ['cm','m',100], ['m','km',1000]] },
  g4_capacity: { units: [['ml','l',1000]] },
  g4_mass: { units: [['g','kg',1000]] },
};
let g4_measState = { correct: 0, attempted: 0, answer: null, kind: null };
function g4_renderLength() { g4_renderMeasure('g4_length', '📏', 'Length'); }
function g4_renderCapacity() { g4_renderMeasure('g4_capacity', '🧃', 'Capacity and Volume'); }
function g4_renderMass() { g4_renderMeasure('g4_mass', '🏋️', 'Mass'); }
function g4_renderMeasure(kind, icon, title) {
  g4_measState = { correct: 0, attempted: 0, answer: null, kind };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">${icon} ${title}</h2>
      <p class="subtext">Convert between units. Fill in the missing number.</p>
      ${tutorHTML(kind)}
      <div id="ms-score">${scoreHTML(g4_measState)}</div>
      <div id="ms-question"></div>
      <div id="ms-feedback" class="feedback"></div>
    </div>
  `;
  g4_newMSQuestion();
}
function g4_newMSQuestion() {
  const cfg = g4_MEASURE_CONFIG[g4_measState.kind];
  const [small, big, factor] = pick(cfg.units);
  const smallToBig = Math.random() < 0.5;
  let qText, answer;
  if (smallToBig) {
    const bigVal = randInt(1, 20);
    const smallVal = bigVal * factor;
    qText = `${smallVal} ${small} = ___ ${big}`;
    answer = bigVal;
  } else {
    const bigVal = randInt(1, 20);
    const smallVal = bigVal * factor;
    qText = `${bigVal} ${big} = ___ ${small}`;
    answer = smallVal;
  }
  g4_measState.answer = answer;
  document.getElementById('ms-question').innerHTML = `
    <div class="q-box">${qText}</div>
    <input type="number" id="ms-in" autofocus />
    <button class="action" onclick="g4_checkMS()">Check</button>
    <button class="secondary" onclick="g4_newMSQuestion()">Skip</button>
  `;
  document.getElementById('ms-feedback').className = 'feedback';
  const inputEl = document.getElementById('ms-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g4_checkMS(); });
}
function g4_checkMS() {
  const v = parseFloat(document.getElementById('ms-in').value);
  g4_measState.attempted++;
  const fb = document.getElementById('ms-feedback');
  if (v === g4_measState.answer) {
    g4_measState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newMSQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g4_measState.answer}.`;
  }
  document.getElementById('ms-score').innerHTML = scoreHTML(g4_measState);
}

// =====================================================================
// 15. TIME
// =====================================================================
let g4_tmState = { correct: 0, attempted: 0, answerMin: null, mode: 'read' };
function g4_clockSVG(h, m) {
  const hourAngle = (h % 12) * 30 + m * 0.5;
  const minAngle = m * 6;
  const cx = 60, cy = 60, r = 54;
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const ang = i * 30 * Math.PI / 180;
    const x1 = cx + (r - 6) * Math.sin(ang), y1 = cy - (r - 6) * Math.cos(ang);
    const x2 = cx + r * Math.sin(ang), y2 = cy - r * Math.cos(ang);
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0284C7" stroke-width="2"/>`);
  }
  const hx = cx + 28 * Math.sin(hourAngle * Math.PI / 180), hy = cy - 28 * Math.cos(hourAngle * Math.PI / 180);
  const mx = cx + 42 * Math.sin(minAngle * Math.PI / 180), my = cy - 42 * Math.cos(minAngle * Math.PI / 180);
  return `<svg width="140" height="140" viewBox="0 0 120 120">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#075985" stroke-width="3"/>
    ${ticks.join('')}
    <line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#075985" stroke-width="4" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="#FB7185" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="3" fill="#075985"/>
  </svg>`;
}
function g4_renderTime() {
  g4_tmState = { correct: 0, attempted: 0, answerMin: null, mode: 'read' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🕐 Time</h2>
      ${levelNote(ACTIVITIES.g4_time)}
      <p class="subtext">Read the clock, or work out how much time has passed.</p>
      ${tutorHTML('g4_time')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="tm-mode-read" onclick="g4_setTMMode('read')">Read the clock</div>
        <div class="mcq-opt" id="tm-mode-elapsed" onclick="g4_setTMMode('elapsed')">Elapsed time</div>
      </div>
      <div id="tm-score">${scoreHTML(g4_tmState)}</div>
      <div id="tm-question"></div>
      <div id="tm-feedback" class="feedback"></div>
    </div>
  `;
  g4_markTMMode();
  g4_newTMQuestion();
}
function g4_setTMMode(m) { g4_tmState.mode = m; g4_markTMMode(); g4_newTMQuestion(); }
function g4_markTMMode() {
  document.getElementById('tm-mode-read').classList.toggle('correct', g4_tmState.mode === 'read');
  document.getElementById('tm-mode-elapsed').classList.toggle('correct', g4_tmState.mode === 'elapsed');
}
function g4_newTMQuestion() {
  if (g4_tmState.mode === 'read') {
    const h = randInt(1, 12), m = pick([0,5,10,15,20,25,30,35,40,45,50,55]);
    g4_tmState.answerMin = h * 60 + m; // encode for exact matching, but we ask for hour and minute separately
    g4_tmState.h = h; g4_tmState.m = m;
    document.getElementById('tm-question').innerHTML = `
      <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
        ${g4_clockSVG(h, m)}
        <div>
          Hour: <input type="number" id="tm-h" style="width:70px;" min="1" max="12" />
          Minutes: <input type="number" id="tm-m" style="width:70px;" min="0" max="59" />
        </div>
      </div>
      <button class="action" onclick="g4_checkTM()">Check</button>
      <button class="secondary" onclick="g4_newTMQuestion()">New time</button>
    `;
  } else {
    const startH = randInt(1, 11), startM = pick([0,15,30,45]);
    const durMin = pick([15,20,30,45,60,90,120]);
    let totalStart = startH * 60 + startM;
    g4_tmState.answerMin = durMin;
    g4_tmState.startText = `${startH}:${String(startM).padStart(2,'0')}`;
    const endTotal = totalStart + durMin;
    const endH = Math.floor(endTotal / 60) % 12 || 12;
    const endM = endTotal % 60;
    g4_tmState.endText = `${endH}:${String(endM).padStart(2,'0')}`;
    document.getElementById('tm-question').innerHTML = `
      <div class="q-box">A movie starts at ${g4_tmState.startText} and ends at ${g4_tmState.endText}. How many minutes long is the movie?</div>
      <input type="number" id="tm-elapsed" autofocus />
      <button class="action" onclick="g4_checkTM()">Check</button>
      <button class="secondary" onclick="g4_newTMQuestion()">New question</button>
    `;
  }
  document.getElementById('tm-feedback').className = 'feedback';
}
function g4_checkTM() {
  const fb = document.getElementById('tm-feedback');
  g4_tmState.attempted++;
  if (g4_tmState.mode === 'read') {
    const h = parseInt(document.getElementById('tm-h').value);
    const m = parseInt(document.getElementById('tm-m').value);
    if (h === g4_tmState.h && m === g4_tmState.m) {
      g4_tmState.correct++;
      fb.className = 'feedback good';
      fb.textContent = 'Correct! Next one.';
      setTimeout(g4_newTMQuestion, 900);
    } else {
      fb.className = 'feedback bad';
      fb.textContent = `Not quite. The clock shows ${g4_tmState.h}:${String(g4_tmState.m).padStart(2,'0')}.`;
    }
  } else {
    const v = parseInt(document.getElementById('tm-elapsed').value);
    if (v === g4_tmState.answerMin) {
      g4_tmState.correct++;
      fb.className = 'feedback good';
      fb.textContent = 'Correct! Next one.';
      setTimeout(g4_newTMQuestion, 900);
    } else {
      fb.className = 'feedback bad';
      fb.textContent = `Not quite. The movie was ${g4_tmState.answerMin} minutes long.`;
    }
  }
  document.getElementById('tm-score').innerHTML = scoreHTML(g4_tmState);
}

// =====================================================================
// 16. 3D OBJECT PROPERTIES (verified geometric facts)
// =====================================================================
const g4_SHAPES_3D = [
  { name: 'Cube', icon: '🧊', flat: 6, curved: 0, edges: 12, vertices: 8 },
  { name: 'Rectangular prism', icon: '📦', flat: 6, curved: 0, edges: 12, vertices: 8 },
  { name: 'Triangular prism', icon: '🍫', flat: 5, curved: 0, edges: 9, vertices: 6 },
  { name: 'Square pyramid', icon: '🏛️', flat: 5, curved: 0, edges: 8, vertices: 5 },
  { name: 'Triangular pyramid', icon: '🔻', flat: 4, curved: 0, edges: 6, vertices: 4 },
  { name: 'Cylinder', icon: '🥫', flat: 2, curved: 1, edges: 2, vertices: 0 },
  { name: 'Cone', icon: '🍦', flat: 1, curved: 1, edges: 1, vertices: 1 },
  { name: 'Sphere', icon: '⚽', flat: 0, curved: 1, edges: 0, vertices: 0 },
];
let g4_s3State = { shape: null, field: null, answer: null, correct: 0, attempted: 0, level: 'easy' };
function g4_renderShapes3D() {
  g4_s3State = { shape: null, field: null, answer: null, correct: 0, attempted: 0, level: 'easy' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">📦 3D Object Properties</h2>
      <p class="subtext">Multiple choice. Think about flat faces and curved surfaces.</p>
      ${tutorHTML('g4_shapes3d')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="s3-lvl-easy" onclick="g4_setS3Level('easy')">Faces and surfaces</div>
        <div class="mcq-opt" id="s3-lvl-hard" onclick="g4_setS3Level('hard')">Challenge: edges and vertices</div>
      </div>
      <div id="s3-score">${scoreHTML(g4_s3State)}</div>
      <div id="s3-question"></div>
      <div id="s3-feedback" class="feedback"></div>
    </div>
  `;
  g4_markS3Level();
  g4_newS3Question();
}
function g4_setS3Level(l) { g4_s3State.level = l; g4_markS3Level(); g4_newS3Question(); }
function g4_markS3Level() {
  document.getElementById('s3-lvl-easy').classList.toggle('correct', g4_s3State.level === 'easy');
  document.getElementById('s3-lvl-hard').classList.toggle('correct', g4_s3State.level === 'hard');
}
function g4_newS3Question() {
  const shape = pick(g4_SHAPES_3D);
  const field = g4_s3State.level === 'easy' ? pick(['flat', 'curved']) : pick(['edges', 'vertices']);
  g4_s3State.shape = shape; g4_s3State.field = field; g4_s3State.answer = shape[field];
  const labels = { flat: 'flat faces', curved: 'curved surfaces', edges: 'edges', vertices: 'vertices' };
  const label = labels[field];
  const options = shuffle([...new Set([shape[field], Math.max(0, shape[field]-1), shape[field]+1, shape[field]+2])]).slice(0,4);
  document.getElementById('s3-question').innerHTML = `
    <div class="q-box">${shape.icon} How many ${label} does a <strong>${shape.name}</strong> have?</div>
    <div class="mcq-opts">${options.map(o => `<div class="mcq-opt" onclick="g4_checkS3(this, ${o})">${o}</div>`).join('')}</div>
    <button class="secondary small" onclick="g4_newS3Question()">New question</button>
  `;
  document.getElementById('s3-feedback').className = 'feedback';
}
function g4_checkS3(el, val) {
  g4_s3State.attempted++;
  const opts = document.querySelectorAll('#s3-question .mcq-opt');
  const fb = document.getElementById('s3-feedback');
  const labels = { flat: 'flat faces', curved: 'curved surfaces', edges: 'edges', vertices: 'vertices' };
  const label = labels[g4_s3State.field];
  if (val === g4_s3State.answer) {
    g4_s3State.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New question loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g4_newS3Question, 1000);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. A ${g4_s3State.shape.name} has ${g4_s3State.answer} ${label}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('s3-score').innerHTML = scoreHTML(g4_s3State);
}

// =====================================================================
// 17. SYMMETRY
// =====================================================================
let g4_syState = { correct: 0, attempted: 0, answer: null };
const g4_SYMMETRY_SHAPES = [
  { grid: [[0,1,0],[1,1,1],[0,1,0]], symmetric: true, cols: 3 },
  { grid: [[1,1],[1,1]], symmetric: true, cols: 2 },
  { grid: [[1,0,0],[1,1,0],[1,1,1]], symmetric: false, cols: 3 },
  { grid: [[0,1,1,1],[1,1,1,1]], symmetric: false, cols: 4 },
  { grid: [[1,0,1],[0,1,0],[1,0,1]], symmetric: true, cols: 3 },
  { grid: [[1,1,0],[0,1,0],[0,1,1]], symmetric: false, cols: 3 },
  { grid: [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1]], symmetric: true, cols: 5 },
];
function g4_renderSymmetry() {
  g4_syState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🦋 Symmetry</h2>
      <p class="subtext">Imagine folding the shape down the middle dashed line. Do both sides match exactly?</p>
      ${tutorHTML('g4_symmetry')}
      <div id="sy-score">${scoreHTML(g4_syState)}</div>
      <div id="sy-question"></div>
      <div id="sy-feedback" class="feedback"></div>
    </div>
  `;
  g4_newSYQuestion();
}
function g4_newSYQuestion() {
  const shape = pick(g4_SYMMETRY_SHAPES);
  g4_syState.shape = shape;
  g4_syState.answer = shape.symmetric;
  const mid = (shape.cols - 1) / 2;
  let html = `<div class="pattern-grid" style="grid-template-columns: repeat(${shape.cols}, 26px);">`;
  shape.grid.forEach(row => {
    row.forEach((cell, c) => {
      const isMid = Math.abs(c - mid) < 0.01;
      html += `<div class="blk ${cell ? 'on' : ''}" style="${isMid ? 'box-shadow: 0 0 0 2px #D9A441;' : ''}"></div>`;
    });
  });
  html += '</div>';
  document.getElementById('sy-question').innerHTML = `
    <div>${html}</div>
    <div class="mcq-opts">
      <div class="mcq-opt" onclick="g4_checkSY(this, true)">Yes, it has a line of symmetry</div>
      <div class="mcq-opt" onclick="g4_checkSY(this, false)">No, it does not</div>
    </div>
    <button class="secondary small" onclick="g4_newSYQuestion()">New shape</button>
  `;
  document.getElementById('sy-feedback').className = 'feedback';
}
function g4_checkSY(el, val) {
  g4_syState.attempted++;
  const opts = document.querySelectorAll('#sy-question .mcq-opt');
  const fb = document.getElementById('sy-feedback');
  if (val === g4_syState.answer) {
    g4_syState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New shape loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g4_newSYQuestion, 1100);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. This shape ${g4_syState.answer ? 'does' : 'does not'} have a line of symmetry down the marked line.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('sy-score').innerHTML = scoreHTML(g4_syState);
}

// =====================================================================
// 18. GRID REFERENCES
// =====================================================================
let g4_grState = { correct: 0, attempted: 0, col: 0, row: 0 };
const g4_GRID_ITEMS = ['🏖️','⛵','🐚','🦀','🌴','⭐'];
function g4_renderGridRef() {
  g4_grState = { correct: 0, attempted: 0, col: 0, row: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🗺️ Grid References</h2>
      ${levelNote(ACTIVITIES.g4_gridref)}
      <p class="subtext">Type the grid reference of the marked object, letter first, then number, for example C3.</p>
      ${tutorHTML('g4_gridref')}
      <div id="gr-score">${scoreHTML(g4_grState)}</div>
      <div id="gr-question"></div>
      <div id="gr-feedback" class="feedback"></div>
    </div>
  `;
  g4_newGRQuestion();
}
function g4_newGRQuestion() {
  const cols = 5, rows = 5;
  const letters = ['A','B','C','D','E'];
  const c = randInt(0, cols - 1), r = randInt(0, rows - 1);
  g4_grState.col = c; g4_grState.row = r;
  const item = pick(g4_GRID_ITEMS);
  let html = `<div class="posgrid" style="grid-template-columns: 42px repeat(${cols}, 42px);">`;
  html += `<div class="pcell headcell"></div>`;
  letters.forEach(l => html += `<div class="pcell headcell">${l}</div>`);
  for (let rr = rows - 1; rr >= 0; rr--) {
    html += `<div class="pcell headcell">${rr + 1}</div>`;
    for (let cc = 0; cc < cols; cc++) {
      html += `<div class="pcell">${(cc === c && rr === r) ? item : ''}</div>`;
    }
  }
  html += '</div>';
  document.getElementById('gr-question').innerHTML = `
    <div>${html}</div>
    <div class="q-box">What is the grid reference of ${item}?</div>
    <input type="text" id="gr-in" placeholder="for example C3" autofocus />
    <button class="action" onclick="g4_checkGR()">Check</button>
    <button class="secondary" onclick="g4_newGRQuestion()">New position</button>
  `;
  document.getElementById('gr-feedback').className = 'feedback';
}
function g4_checkGR() {
  const letters = ['A','B','C','D','E'];
  const raw = (document.getElementById('gr-in').value || '').trim().toUpperCase();
  g4_grState.attempted++;
  const fb = document.getElementById('gr-feedback');
  const correctRef = letters[g4_grState.col] + (g4_grState.row + 1);
  if (raw === correctRef) {
    g4_grState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newGRQuestion, 1000);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The correct reference was ${correctRef}.`;
  }
  document.getElementById('gr-score').innerHTML = scoreHTML(g4_grState);
}

// =====================================================================
// 19. ANGLES (Grade 5 preview)
// =====================================================================
let g4_anState = { correct: 0, attempted: 0, answer: null };
function g4_angleSVG(deg) {
  const cx = 20, cy = 100, len = 90;
  const rad = deg * Math.PI / 180;
  const x2 = cx + len * Math.cos(rad), y2 = cy - len * Math.sin(rad);
  return `<svg width="200" height="120" viewBox="0 0 200 120">
    <line x1="${cx}" y1="${cy}" x2="${cx + len}" y2="${cy}" stroke="#075985" stroke-width="4" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#FB7185" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="#0284C7"/>
  </svg>`;
}
function g4_renderAngles() {
  g4_anState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">📐 Angles</h2>
      ${levelNote(ACTIVITIES.g4_angles)}
      <p class="subtext">Is the angle a right angle, smaller than a right angle, or bigger than a right angle?</p>
      ${tutorHTML('g4_angles')}
      <div id="an-score">${scoreHTML(g4_anState)}</div>
      <div id="an-question"></div>
      <div id="an-feedback" class="feedback"></div>
    </div>
  `;
  g4_newANQuestion();
}
function g4_newANQuestion() {
  const cat = pick(['acute', 'right', 'obtuse']);
  let deg;
  if (cat === 'acute') deg = randInt(20, 75);
  else if (cat === 'right') deg = 90;
  else deg = randInt(105, 160);
  g4_anState.answer = cat;
  document.getElementById('an-question').innerHTML = `
    <div>${g4_angleSVG(deg)}</div>
    <div class="mcq-opts">
      <div class="mcq-opt" onclick="g4_checkAN(this, 'acute')">Smaller than a right angle</div>
      <div class="mcq-opt" onclick="g4_checkAN(this, 'right')">A right angle</div>
      <div class="mcq-opt" onclick="g4_checkAN(this, 'obtuse')">Bigger than a right angle</div>
    </div>
    <button class="secondary small" onclick="g4_newANQuestion()">New angle</button>
  `;
  document.getElementById('an-feedback').className = 'feedback';
}
function g4_checkAN(el, val) {
  g4_anState.attempted++;
  const opts = document.querySelectorAll('#an-question .mcq-opt');
  const fb = document.getElementById('an-feedback');
  const labels = { acute: 'smaller than a right angle', right: 'a right angle', obtuse: 'bigger than a right angle' };
  if (val === g4_anState.answer) {
    g4_anState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New angle loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g4_newANQuestion, 1100);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. This angle is ${labels[g4_anState.answer]}. Compare it to the corner of a book or piece of paper, that is a right angle.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('an-score').innerHTML = scoreHTML(g4_anState);
}

// =====================================================================
// 20. TRANSLATIONS (Grade 5 preview)
// =====================================================================
let g4_trState = { correct: 0, attempted: 0, startCol: 0, startRow: 0, dCol: 0, dRow: 0, picked: null };
function g4_renderTranslate() {
  g4_trState = { correct: 0, attempted: 0, startCol: 0, startRow: 0, dCol: 0, dRow: 0, picked: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🧭 Translations</h2>
      ${levelNote(ACTIVITIES.g4_translate)}
      <p class="subtext">Start at the star. Follow the instruction, then click the square it lands on.</p>
      ${tutorHTML('g4_translate')}
      <div id="tr-score">${scoreHTML(g4_trState)}</div>
      <div id="tr-question"></div>
      <div id="tr-feedback" class="feedback"></div>
    </div>
  `;
  g4_newTRQuestion();
}
function g4_newTRQuestion() {
  const size = 6;
  const startCol = randInt(0, size - 1), startRow = randInt(0, size - 1);
  let dCol, dRow, tries = 0;
  do {
    dCol = randInt(-3, 3); dRow = randInt(-3, 3);
    tries++;
  } while ((dCol === 0 && dRow === 0 || startCol + dCol < 0 || startCol + dCol >= size || startRow + dRow < 0 || startRow + dRow >= size) && tries < 200);
  g4_trState = { ...g4_trState, startCol, startRow, dCol, dRow, size, picked: null };
  const rightText = dCol > 0 ? `${dCol} right` : (dCol < 0 ? `${-dCol} left` : '');
  const vertText = dRow > 0 ? `${dRow} up` : (dRow < 0 ? `${-dRow} down` : '');
  const instr = [rightText, vertText].filter(Boolean).join(' and ');
  let html = `<div class="posgrid" id="tr-grid" style="grid-template-columns: repeat(${size}, 42px);">`;
  for (let rr = size - 1; rr >= 0; rr--) {
    for (let cc = 0; cc < size; cc++) {
      const isStart = cc === startCol && rr === startRow;
      html += `<div class="pcell clickable ${isStart ? 'start' : ''}" data-col="${cc}" data-row="${rr}" onclick="g4_pickTR(this, ${cc}, ${rr})">${isStart ? '⭐' : ''}</div>`;
    }
  }
  html += '</div>';
  document.getElementById('tr-question').innerHTML = `
    <div class="q-box">Move the star ${instr}. Click the square it lands on.</div>
    ${html}
    <button class="action" onclick="g4_checkTR()">Check</button>
    <button class="secondary" onclick="g4_newTRQuestion()">New move</button>
  `;
  document.getElementById('tr-feedback').className = 'feedback';
}
function g4_pickTR(el, c, r) {
  document.querySelectorAll('#tr-grid .pcell').forEach(p => p.classList.remove('picked'));
  el.classList.add('picked');
  g4_trState.picked = { c, r };
}
function g4_checkTR() {
  g4_trState.attempted++;
  const fb = document.getElementById('tr-feedback');
  const targetCol = g4_trState.startCol + g4_trState.dCol, targetRow = g4_trState.startRow + g4_trState.dRow;
  if (!g4_trState.picked) {
    fb.className = 'feedback info';
    fb.textContent = 'Click a square on the grid first.';
    return;
  }
  if (g4_trState.picked.c === targetCol && g4_trState.picked.r === targetRow) {
    g4_trState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next move.';
    setTimeout(g4_newTRQuestion, 1000);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = 'Not quite. Count the squares again, one at a time, in each direction.';
  }
  document.getElementById('tr-score').innerHTML = scoreHTML(g4_trState);
}

// =====================================================================
// 21. NUMBER PATTERNS
// =====================================================================
let g4_npState = { answer: null, correct: 0, attempted: 0, level: 'simple' };
function g4_renderNumPattern() {
  g4_npState = { answer: null, correct: 0, attempted: 0, level: 'simple' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔁 Number Patterns</h2>
      <p class="subtext">Work out the rule, then find the next number in the sequence.</p>
      ${tutorHTML('g4_numpattern')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="np-lvl-simple" onclick="g4_setNPLevel('simple')">Simple</div>
        <div class="mcq-opt" id="np-lvl-medium" onclick="g4_setNPLevel('medium')">Medium</div>
        <div class="mcq-opt" id="np-lvl-complex" onclick="g4_setNPLevel('complex')">Complex</div>
      </div>
      <div id="np-score">${scoreHTML(g4_npState)}</div>
      <div id="np-question"></div>
      <div id="np-feedback" class="feedback"></div>
    </div>
  `;
  g4_markNPLevel();
  g4_newNPQuestion();
}
function g4_setNPLevel(l) { g4_npState.level = l; g4_markNPLevel(); g4_newNPQuestion(); }
function g4_markNPLevel() {
  ['simple','medium','complex'].forEach(l => document.getElementById('np-lvl-' + l).classList.toggle('correct', g4_npState.level === l));
}
function g4_newNPQuestion() {
  let seq = [];
  if (g4_npState.level === 'simple') {
    const start = randInt(1, 30), step = randInt(1, 5);
    const down = Math.random() < 0.4;
    seq = [0,1,2,3,4].map(i => down ? start + (30 - start > 0 ? 40 : 0) - i * step : start + i * step);
    if (down) { const s2 = randInt(60, 99); seq = [0,1,2,3,4].map(i => s2 - i * step); }
  } else if (g4_npState.level === 'medium') {
    const type = pick(['add', 'subtract', 'multiply']);
    if (type === 'add') { const start = randInt(1, 50), step = randInt(6, 15); seq = [0,1,2,3,4].map(i => start + i * step); }
    else if (type === 'subtract') { const start = randInt(80, 200), step = randInt(6, 15); seq = [0,1,2,3,4].map(i => start - i * step); }
    else { const start = randInt(1, 5), step = 2; seq = [0,1,2,3,4].map(i => start * Math.pow(step, i)); }
  } else {
    const type = pick(['multiply3', 'increasingdiff', 'twostep']);
    if (type === 'multiply3') { const start = randInt(1, 4); seq = [0,1,2,3,4].map(i => start * Math.pow(3, i)); }
    else if (type === 'increasingdiff') { let cur = randInt(1, 5); seq = [cur]; let d = randInt(1, 3); for (let i = 0; i < 4; i++) { cur += d; seq.push(cur); d += 1; } }
    else { let cur = randInt(1, 6); seq = [cur]; for (let i = 0; i < 4; i++) { cur = cur * 2 + 1; seq.push(cur); } }
  }
  g4_npState.answer = seq[4];
  document.getElementById('np-question').innerHTML = `
    <div class="q-box">${seq.slice(0,4).join(', ')}, <input type="number" id="np-in" style="width:90px;" autofocus /></div>
    <button class="action" onclick="g4_checkNP()">Check</button>
    <button class="secondary" onclick="g4_newNPQuestion()">New pattern</button>
  `;
  document.getElementById('np-feedback').className = 'feedback';
  const inputEl = document.getElementById('np-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g4_checkNP(); });
}
function g4_checkNP() {
  const v = parseInt(document.getElementById('np-in').value);
  g4_npState.attempted++;
  const fb = document.getElementById('np-feedback');
  if (v === g4_npState.answer) {
    g4_npState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newNPQuestion, 1000);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The next number was ${g4_npState.answer}.`;
  }
  document.getElementById('np-score').innerHTML = scoreHTML(g4_npState);
}

// =====================================================================
// 22. GROWING (GEOMETRIC) PATTERNS
// =====================================================================
let g4_gpState = { type: null, answer: null, correct: 0, attempted: 0, level: 'simple' };
function g4_patternCount(type, n) {
  if (type === 'triangle') return n * (n + 1) / 2;
  if (type === 'square') return n * n;
  if (type === 'staircase') return 2 * n - 1;
  if (type === 'cross') return 4 * n - 3;
  if (type === 'hollow') return n === 1 ? 1 : 4 * (n - 1);
  return n;
}
function g4_renderPatternStep(type, n) {
  let html = '';
  if (type === 'square') {
    html = `<div class="pattern-grid" style="grid-template-columns: repeat(${n}, 22px);">`;
    for (let i = 0; i < n * n; i++) html += '<div class="blk on"></div>';
    html += '</div>';
  } else if (type === 'triangle') {
    html = `<div class="pattern-grid" style="grid-template-columns: repeat(${n}, 22px);">`;
    for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) html += `<div class="blk ${c <= r ? 'on' : ''}" style="visibility:${c <= r ? 'visible' : 'hidden'};"></div>`;
    html += '</div>';
  } else if (type === 'staircase') {
    html = `<div class="pattern-grid" style="grid-template-columns: repeat(${n}, 22px);">`;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) html += `<div class="blk ${(r === 0 || c === 0) ? 'on' : ''}"></div>`;
    html += '</div>';
  } else if (type === 'cross') {
    const size = 2 * n - 1;
    const mid = n - 1;
    html = `<div class="pattern-grid" style="grid-template-columns: repeat(${size}, 22px);">`;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) html += `<div class="blk ${(r === mid || c === mid) ? 'on' : ''}"></div>`;
    html += '</div>';
  } else if (type === 'hollow') {
    html = `<div class="pattern-grid" style="grid-template-columns: repeat(${n}, 22px);">`;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const on = r === 0 || c === 0 || r === n - 1 || c === n - 1; html += `<div class="blk ${on ? 'on' : ''}"></div>`; }
    html += '</div>';
  }
  return html;
}
function g4_renderGeoPattern() {
  g4_gpState = { type: null, answer: null, correct: 0, attempted: 0, level: 'simple' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔶 Growing Patterns</h2>
      <p class="subtext">Count the blocks in each step. How many blocks will the next step have?</p>
      ${tutorHTML('g4_geopattern')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="gp-lvl-simple" onclick="g4_setGPLevel('simple')">Simple</div>
        <div class="mcq-opt" id="gp-lvl-medium" onclick="g4_setGPLevel('medium')">Medium</div>
        <div class="mcq-opt" id="gp-lvl-complex" onclick="g4_setGPLevel('complex')">Complex</div>
      </div>
      <div id="gp-score">${scoreHTML(g4_gpState)}</div>
      <div id="gp-question"></div>
      <div id="gp-feedback" class="feedback"></div>
    </div>
  `;
  g4_markGPLevel();
  g4_newGPQuestion();
}
function g4_setGPLevel(l) { g4_gpState.level = l; g4_markGPLevel(); g4_newGPQuestion(); }
function g4_markGPLevel() {
  ['simple','medium','complex'].forEach(l => document.getElementById('gp-lvl-' + l).classList.toggle('correct', g4_gpState.level === l));
}
function g4_newGPQuestion() {
  const pools = { simple: ['staircase'], medium: ['triangle', 'square'], complex: ['cross', 'hollow'] };
  g4_gpState.type = pick(pools[g4_gpState.level]);
  const nextStep = 4;
  g4_gpState.answer = g4_patternCount(g4_gpState.type, nextStep);
  const stepsHTML = [1,2,3].map(n => `
    <div class="pattern-step">
      ${g4_renderPatternStep(g4_gpState.type, n)}
      <div class="count">Step ${n}: ${g4_patternCount(g4_gpState.type, n)}</div>
    </div>
  `).join('');
  document.getElementById('gp-question').innerHTML = `
    <div>${stepsHTML}</div>
    <div class="q-box">How many blocks will step 4 have? <input type="number" id="gp-in" style="width:90px;" /></div>
    <button class="action" onclick="g4_checkGP()">Check</button>
    <button class="secondary" onclick="g4_newGPQuestion()">New pattern</button>
  `;
  document.getElementById('gp-feedback').className = 'feedback';
}
function g4_checkGP() {
  const v = parseInt(document.getElementById('gp-in').value);
  g4_gpState.attempted++;
  const fb = document.getElementById('gp-feedback');
  if (v === g4_gpState.answer) {
    g4_gpState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g4_newGPQuestion, 1100);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. Step 4 has ${g4_gpState.answer} blocks. Try counting step 3 again and see how many more are added.`;
  }
  document.getElementById('gp-score').innerHTML = scoreHTML(g4_gpState);
}
