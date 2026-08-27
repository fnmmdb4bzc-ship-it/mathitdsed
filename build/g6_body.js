// =====================================================================
// 1. PLACE VALUE DETECTIVE
// =====================================================================
let g6_pvState = { correct: 0, attempted: 0, answer: null };
function g6_renderPlaceValue() {
  g6_pvState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔢 Place Value Detective</h2>
      <p class="subtext">What is the <em>value</em> of the highlighted digit? Not just its name, its real value in the number.</p>
      ${tutorHTML('g6_placevalue')}
      <div id="pv-score">${scoreHTML(g6_pvState)}</div>
      <div id="pv-question"></div>
      <div id="pv-feedback" class="feedback"></div>
    </div>
  `;
  g6_newPVQuestion();
}
function g6_newPVQuestion() {
  const digits = randInt(3, 5);
  let num = randInt(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
  const numStr = String(num);
  const pos = randInt(0, numStr.length - 1); // index from left
  const digit = parseInt(numStr[pos]);
  const placeValueExp = numStr.length - 1 - pos;
  const correct = digit * Math.pow(10, placeValueExp);
  g6_pvState.answer = correct;

  // build highlighted display
  const display = numStr.split('').map((d, i) =>
    i === pos ? `<span style="color:#E11D48; text-decoration:underline;">${d}</span>` : d
  ).join('');

  const options = shuffle([
    correct,
    digit, // common error: value of digit ignoring place
    correct + Math.pow(10, placeValueExp), // off by one place step
    Math.max(1, correct - Math.pow(10, placeValueExp)),
  ].filter((v, i, arr) => arr.indexOf(v) === i).concat(correct)).filter((v,i,arr)=>arr.indexOf(v)===i);
  // ensure exactly 4 unique options including correct
  while (options.length < 4) options.push(correct + randInt(1,9));
  const finalOpts = shuffle(options.slice(0, 4).includes(correct) ? options.slice(0,4) : [correct, ...options.slice(0,3)]);

  document.getElementById('pv-question').innerHTML = `
    <div class="q-box">In the number <strong>${display}</strong>, what is the value of the underlined digit?</div>
    <div class="mcq-opts">
      ${finalOpts.map(o => `<div class="mcq-opt" onclick="g6_checkPV(this, ${o})">${o.toLocaleString('en-ZA').replace(/,/g,' ')}</div>`).join('')}
    </div>
    <button class="secondary small" onclick="g6_newPVQuestion()">Skip, new number</button>
  `;
  document.getElementById('pv-feedback').className = 'feedback';
}
function g6_checkPV(el, val) {
  g6_pvState.attempted++;
  const opts = document.querySelectorAll('#pv-question .mcq-opt');
  const fb = document.getElementById('pv-feedback');
  if (val === g6_pvState.answer) {
    g6_pvState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Yes, that is right! New question loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g6_newPVQuestion, 1100);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The correct value is ${g6_pvState.answer.toLocaleString('en-ZA').replace(/,/g,' ')}. Look at which column that digit sits in.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('pv-score').innerHTML = scoreHTML(g6_pvState);
}

// =====================================================================
// 2. ROUNDING
// =====================================================================
let g6_rdState = { correct: 0, attempted: 0, ans10: null, ans100: null };
function g6_renderRounding() {
  g6_rdState = { correct: 0, attempted: 0, ans10: null, ans100: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🎯 Round It</h2>
      <p class="subtext">Round the number to the nearest 10, then the nearest 100.</p>
      ${tutorHTML('g6_rounding')}
      <div id="rd-score">${scoreHTML(g6_rdState)}</div>
      <div id="rd-question"></div>
      <div id="rd-feedback" class="feedback"></div>
    </div>
  `;
  g6_newRDQuestion();
}
function g6_newRDQuestion() {
  const num = randInt(105, 986);
  g6_rdState.ans10 = Math.round(num / 10) * 10;
  g6_rdState.ans100 = Math.round(num / 100) * 100;
  document.getElementById('rd-question').innerHTML = `
    <div class="q-box">Number: ${num}</div>
    <div>
      Nearest 10: <input type="number" id="rd-in10" />
      Nearest 100: <input type="number" id="rd-in100" />
    </div>
    <button class="action" onclick="g6_checkRD()">Check</button>
    <button class="secondary" onclick="g6_newRDQuestion()">New number</button>
  `;
  document.getElementById('rd-feedback').className = 'feedback';
}
function g6_checkRD() {
  const v10 = parseInt(document.getElementById('rd-in10').value);
  const v100 = parseInt(document.getElementById('rd-in100').value);
  g6_rdState.attempted++;
  const fb = document.getElementById('rd-feedback');
  const ok10 = v10 === g6_rdState.ans10, ok100 = v100 === g6_rdState.ans100;
  if (ok10 && ok100) {
    g6_rdState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Both correct!';
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Nearest 10 should be ${g6_rdState.ans10}, nearest 100 should be ${g6_rdState.ans100}. ${!ok10 ? 'Check the units digit for rounding to 10.' : ''} ${!ok100 ? 'Check the tens digit for rounding to 100.' : ''}`;
  }
  document.getElementById('rd-score').innerHTML = scoreHTML(g6_rdState);
}

// =====================================================================
// 3. NUMBER BONDS BLITZ
// =====================================================================
let g6_bondState = { correct: 0, attempted: 0, answer: null };
function g6_renderBonds() {
  g6_bondState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">⚡ Number Bonds Blitz</h2>
      <p class="subtext">Fill in the missing number as fast as you can. Press Enter or click Check.</p>
      ${tutorHTML('g6_bonds')}
      <div id="bd-score">${scoreHTML(g6_bondState)}</div>
      <div id="bd-question"></div>
      <div id="bd-feedback" class="feedback"></div>
    </div>
  `;
  g6_newBondQuestion();
}
function g6_newBondQuestion() {
  const target = pick([10, 20]);
  const a = randInt(1, target - 1);
  const b = target - a;
  const blankIsA = Math.random() < 0.5;
  g6_bondState.answer = blankIsA ? a : b;
  const exprHTML = blankIsA
    ? `<input type="number" id="bd-in" autofocus /> + ${b} = ${target}`
    : `${a} + <input type="number" id="bd-in" autofocus /> = ${target}`;
  document.getElementById('bd-question').innerHTML = `
    <div class="q-box">${exprHTML}</div>
    <button class="action" onclick="g6_checkBond()">Check</button>
    <button class="secondary" onclick="g6_newBondQuestion()">Skip</button>
  `;
  document.getElementById('bd-feedback').className = 'feedback';
  const inputEl = document.getElementById('bd-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g6_checkBond(); });
}
function g6_checkBond() {
  const v = parseInt(document.getElementById('bd-in').value);
  g6_bondState.attempted++;
  const fb = document.getElementById('bd-feedback');
  if (v === g6_bondState.answer) {
    g6_bondState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g6_newBondQuestion, 700);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g6_bondState.answer}.`;
    setTimeout(g6_newBondQuestion, 1600);
  }
  document.getElementById('bd-score').innerHTML = scoreHTML(g6_bondState);
}

// =====================================================================
// 4. TIMES TABLES BLITZ
// =====================================================================
let g6_ttState = { correct: 0, attempted: 0, answer: null, tables: [2,5,10] };
function g6_renderTables() {
  g6_ttState = { correct: 0, attempted: 0, answer: null, tables: [2,5,10] };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">✖️ Times Tables Blitz</h2>
      <p class="subtext">Choose which tables to focus on, then answer as fast as you can.</p>
      ${tutorHTML('g6_tables')}
      <div id="tt-picker"></div>
      <div id="tt-score">${scoreHTML(g6_ttState)}</div>
      <div id="tt-question"></div>
      <div id="tt-feedback" class="feedback"></div>
    </div>
  `;
  g6_renderTTPicker();
  g6_newTTQuestion();
}
function g6_renderTTPicker() {
  const all = [2,3,4,5,6,7,8,9,10,11,12];
  document.getElementById('tt-picker').innerHTML = `
    <div class="mcq-opts" style="margin-bottom:6px;">
      ${all.map(n => `<div class="mcq-opt ${g6_ttState.tables.includes(n) ? 'correct' : ''}" style="padding:6px 12px;" onclick="g6_toggleTable(${n})">${n} times</div>`).join('')}
    </div>
  `;
}
function g6_toggleTable(n) {
  if (g6_ttState.tables.includes(n)) {
    if (g6_ttState.tables.length > 1) g6_ttState.tables = g6_ttState.tables.filter(x => x !== n);
  } else {
    g6_ttState.tables.push(n);
  }
  g6_renderTTPicker();
}
function g6_newTTQuestion() {
  const a = pick(g6_ttState.tables);
  const b = randInt(1, 12);
  g6_ttState.answer = a * b;
  document.getElementById('tt-question').innerHTML = `
    <div class="q-box">${a} &times; ${b} = <input type="number" id="tt-in" autofocus /></div>
    <button class="action" onclick="g6_checkTT()">Check</button>
    <button class="secondary" onclick="g6_newTTQuestion()">Skip</button>
  `;
  document.getElementById('tt-feedback').className = 'feedback';
  const inputEl = document.getElementById('tt-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g6_checkTT(); });
}
function g6_checkTT() {
  const v = parseInt(document.getElementById('tt-in').value);
  g6_ttState.attempted++;
  const fb = document.getElementById('tt-feedback');
  if (v === g6_ttState.answer) {
    g6_ttState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g6_newTTQuestion, 600);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g6_ttState.answer}.`;
    setTimeout(g6_newTTQuestion, 1500);
  }
  document.getElementById('tt-score').innerHTML = scoreHTML(g6_ttState);
}

// =====================================================================
// 5. FACT FAMILY BUILDER
// =====================================================================
let g6_ffState = { nums: [], type: 'add', correctFacts: [] };
function g6_renderFactFamily() {
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔺 Fact Family Builder</h2>
      <p class="subtext">Given the 3 numbers, type all 4 related facts, in any order. Use x, divide, plus or minus as needed.</p>
      ${tutorHTML('g6_factfamily')}
      <div id="ff-question"></div>
      <div id="ff-feedback" class="feedback"></div>
    </div>
  `;
  g6_newFFQuestion();
}
function g6_newFFQuestion() {
  g6_ffState.type = pick(['add', 'mult']);
  let a, b, c;
  if (g6_ffState.type === 'add') {
    a = randInt(2, 15); b = randInt(2, 15); c = a + b;
    g6_ffState.correctFacts = [`${a}+${b}=${c}`, `${b}+${a}=${c}`, `${c}-${a}=${b}`, `${c}-${b}=${a}`];
  } else {
    a = randInt(2, 9); b = randInt(2, 9); c = a * b;
    g6_ffState.correctFacts = [`${a}x${b}=${c}`, `${b}x${a}=${c}`, `${c}/${a}=${b}`, `${c}/${b}=${a}`];
  }
  g6_ffState.nums = [a, b, c];
  document.getElementById('ff-question').innerHTML = `
    <div class="q-box">Numbers: ${a}, ${b}, ${c}</div>
    <div style="display:flex; flex-direction:column; gap:8px; max-width:280px;">
      ${[1,2,3,4].map(i => `<input type="text" id="ff-fact${i}" placeholder="fact ${i}, for example ${g6_ffState.type==='add' ? '3+4=7' : '3x4=12'}" />`).join('')}
    </div>
    <button class="action" onclick="g6_checkFF()">Check</button>
    <button class="secondary" onclick="g6_newFFQuestion()">New numbers</button>
  `;
  document.getElementById('ff-feedback').className = 'feedback';
}
function g6_normalizeFact(s) {
  return s.replace(/\s+/g, '').replace(/×/g, 'x').replace(/\*/g, 'x').replace(/÷/g, '/').toLowerCase();
}
function g6_checkFF() {
  const entered = [1,2,3,4].map(i => g6_normalizeFact(document.getElementById('ff-fact' + i).value || ''));
  const correctSet = g6_ffState.correctFacts.map(g6_normalizeFact);
  const matched = entered.filter(e => e && correctSet.includes(e));
  const uniqueMatched = [...new Set(matched)];
  const fb = document.getElementById('ff-feedback');
  if (uniqueMatched.length === 4) {
    fb.className = 'feedback good';
    fb.textContent = 'All 4 facts correct! Great work.';
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `You got ${uniqueMatched.length} of 4. The full family is ${g6_ffState.correctFacts.join(', ')}.`;
  }
}

// =====================================================================
// 6. EQUIVALENT FRACTIONS
// =====================================================================
let g6_efState = { fromNum: 0, fromDen: 0, toDen: 0, answer: 0, correct: 0, attempted: 0 };
function g6_renderEquivFrac() {
  g6_efState = { fromNum: 0, fromDen: 0, toDen: 0, answer: 0, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🍰 Equivalent Fractions</h2>
      <p class="subtext">Find the missing numerator to make an equivalent fraction.</p>
      ${tutorHTML('g6_equivfrac')}
      <div id="ef-score">${scoreHTML(g6_efState)}</div>
      <div id="ef-question"></div>
      <div id="ef-feedback" class="feedback"></div>
    </div>
  `;
  g6_newEFQuestion();
}
function g6_newEFQuestion() {
  const fromDen = pick([2,3,4,5,6]);
  const fromNum = randInt(1, fromDen - 1);
  const toDen = fromDen * pick([2,3,4]);
  g6_efState.fromNum = fromNum; g6_efState.fromDen = fromDen; g6_efState.toDen = toDen;
  g6_efState.answer = fromNum * (toDen / fromDen);
  document.getElementById('ef-question').innerHTML = `
    <div class="q-box">${fromNum}/${fromDen} = <input type="number" id="ef-in" style="width:70px;" /> / ${toDen}</div>
    <button class="action" onclick="g6_checkEF()">Check</button>
    <button class="secondary" onclick="g6_newEFQuestion()">Skip</button>
  `;
  document.getElementById('ef-feedback').className = 'feedback';
}
function g6_checkEF() {
  const v = parseInt(document.getElementById('ef-in').value);
  g6_efState.attempted++;
  const fb = document.getElementById('ef-feedback');
  if (v === g6_efState.answer) {
    g6_efState.correct++;
    fb.className = 'feedback good';
    fb.textContent = `Correct! ${g6_efState.fromNum}/${g6_efState.fromDen} equals ${g6_efState.answer}/${g6_efState.toDen}. Next one.`;
    setTimeout(g6_newEFQuestion, 1100);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. Think: ${g6_efState.fromDen} times what equals ${g6_efState.toDen}? Then do the same to the top. Answer: ${g6_efState.answer}.`;
  }
  document.getElementById('ef-score').innerHTML = scoreHTML(g6_efState);
}

// =====================================================================
// 7. FRACTION, DECIMAL, PERCENTAGE GRID
// =====================================================================
let g6_fdpTarget = null;
function g6_renderFDP() {
  g6_fdpTarget = null;
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">💯 Fraction, Decimal, Percentage Grid</h2>
      <p class="subtext">Click squares to shade them. Watch the fraction, decimal and percentage update live. Try New Target to be given an amount to shade.</p>
      ${tutorHTML('g6_fdp')}
      <div id="fdp-target"></div>
      <div class="gridwrap"><div class="hundred-grid" id="fdp-grid"></div></div>
      <div class="readout" id="fdp-readout"></div>
      <button class="secondary" onclick="g6_clearFDP()">Clear grid</button>
      <button class="action" onclick="g6_newFDPTarget()">New Target</button>
      <div id="fdp-feedback" class="feedback"></div>
    </div>
  `;
  const grid = document.getElementById('fdp-grid');
  for (let i = 0; i < 100; i++) {
    const c = document.createElement('div');
    c.className = 'cell';
    c.dataset.i = i;
    c.onclick = () => { c.classList.toggle('shaded'); g6_updateFDPReadout(); };
    grid.appendChild(c);
  }
  g6_updateFDPReadout();
}
function g6_clearFDP() {
  document.querySelectorAll('#fdp-grid .cell.shaded').forEach(c => c.classList.remove('shaded'));
  g6_updateFDPReadout();
}
function g6_updateFDPReadout() {
  const count = document.querySelectorAll('#fdp-grid .cell.shaded').length;
  const g = gcd(count || 1, 100);
  const simpNum = count === 0 ? 0 : count / g;
  const simpDen = count === 0 ? 1 : 100 / g;
  document.getElementById('fdp-readout').innerHTML = `
    <div class="box"><div class="val">${count}/100</div><div class="lbl">Fraction</div></div>
    <div class="box"><div class="val">${simpNum}/${simpDen}</div><div class="lbl">Simplified</div></div>
    <div class="box"><div class="val">0,${String(count).padStart(2,'0')}</div><div class="lbl">Decimal</div></div>
    <div class="box"><div class="val">${count}%</div><div class="lbl">Percentage</div></div>
  `;
  if (g6_fdpTarget !== null) {
    const fb = document.getElementById('fdp-feedback');
    if (count === g6_fdpTarget) {
      fb.className = 'feedback good';
      fb.textContent = `Spot on, that is ${g6_fdpTarget}% shaded!`;
    } else {
      fb.className = 'feedback info';
      fb.textContent = `Target: shade ${g6_fdpTarget}% (${g6_fdpTarget} squares). Currently: ${count} squares.`;
    }
  }
}
function g6_newFDPTarget() {
  g6_fdpTarget = pick([5,10,15,20,25,30,40,50,60,65,75,80,90]);
  g6_clearFDP();
  document.getElementById('fdp-target').innerHTML = `<div class="q-box">Shade ${g6_fdpTarget}% of the grid</div>`;
}

// =====================================================================
// 8. FRACTION ADD AND SUBTRACT
// =====================================================================
let g6_foState = { num: 0, den: 0, correct: 0, attempted: 0 };
function g6_renderFracOps() {
  g6_foState = { num: 0, den: 0, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">➕ Fraction Add and Subtract</h2>
      <p class="subtext">Same denominator throughout. Type your answer as a fraction, for example 3/4. Do not worry about simplifying.</p>
      ${tutorHTML('g6_fracops')}
      <div id="fo-score">${scoreHTML(g6_foState)}</div>
      <div id="fo-question"></div>
      <div id="fo-feedback" class="feedback"></div>
    </div>
  `;
  g6_newFOQuestion();
}
function g6_newFOQuestion() {
  const den = pick([4,5,6,8,10,12]);
  const isAdd = Math.random() < 0.5;
  let n1 = randInt(1, den - 1), n2 = randInt(1, den - 1);
  let num;
  if (isAdd) { num = n1 + n2; }
  else { if (n2 > n1) [n1, n2] = [n2, n1]; num = n1 - n2; }
  g6_foState.num = num; g6_foState.den = den;
  document.getElementById('fo-question').innerHTML = `
    <div class="q-box">${n1}/${den} ${isAdd ? '+' : '-'} ${n2}/${den} = <input type="text" id="fo-in" placeholder="for example 5/${den}" style="width:90px;" /></div>
    <button class="action" onclick="g6_checkFO()">Check</button>
    <button class="secondary" onclick="g6_newFOQuestion()">Skip</button>
  `;
  document.getElementById('fo-feedback').className = 'feedback';
}
function g6_checkFO() {
  const raw = (document.getElementById('fo-in').value || '').trim();
  const parts = raw.split('/');
  g6_foState.attempted++;
  const fb = document.getElementById('fo-feedback');
  let ok = false;
  if (parts.length === 2) {
    const un = parseInt(parts[0]), ud = parseInt(parts[1]);
    if (!isNaN(un) && !isNaN(ud) && ud !== 0) {
      ok = un * g6_foState.den === g6_foState.num * ud; // cross multiply equivalence
    }
  } else if (parts.length === 1 && parseInt(parts[0]) === 0 && g6_foState.num === 0) {
    ok = true;
  }
  if (ok) {
    g6_foState.correct++;
    fb.className = 'feedback good';
    fb.textContent = `Correct! (${g6_foState.num}/${g6_foState.den}). Next one.`;
    setTimeout(g6_newFOQuestion, 1100);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g6_foState.num}/${g6_foState.den}.`;
  }
  document.getElementById('fo-score').innerHTML = scoreHTML(g6_foState);
}

// =====================================================================
// 9. RATIO WORD PROBLEMS
// =====================================================================
let g6_raState = { answer: 0, correct: 0, attempted: 0 };
function g6_renderRatio() {
  g6_raState = { answer: 0, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">⚖️ Ratio Word Problems</h2>
      <p class="subtext">Group counters in your head, or with real ones, before typing the answer.</p>
      ${tutorHTML('g6_ratio')}
      <div id="ra-score">${scoreHTML(g6_raState)}</div>
      <div id="ra-question"></div>
      <div id="ra-feedback" class="feedback"></div>
    </div>
  `;
  g6_newRAQuestion();
}
const g6_RATIO_TEMPLATES = [
  (p1, p2, mult) => ({ q: `A fruit bowl has apples and bananas in the ratio ${p1} to ${p2}. If there are ${p1*mult} apples, how many bananas are there?`, a: p2 * mult }),
  (p1, p2, mult) => ({ q: `A recipe uses flour and sugar in the ratio ${p1} to ${p2}. If you use ${p1*mult} cups of flour, how much sugar, in cups, do you need?`, a: p2 * mult }),
  (p1, p2, mult) => ({ q: `In a class, the ratio of boys to girls is ${p1} to ${p2}. If there are ${p1*mult} boys, how many girls are there?`, a: p2 * mult }),
  (p1, p2, mult) => ({ q: `A necklace uses red and blue beads in the ratio ${p1} to ${p2}. If there are ${p2*mult} blue beads, how many red beads are there?`, a: p1 * mult }),
];
function g6_newRAQuestion() {
  const p1 = randInt(1, 5), p2 = randInt(1, 5);
  const mult = randInt(2, 6);
  const t = pick(g6_RATIO_TEMPLATES)(p1, p2, mult);
  g6_raState.answer = t.a;
  document.getElementById('ra-question').innerHTML = `
    <div class="q-box">${t.q}</div>
    <input type="number" id="ra-in" />
    <button class="action" onclick="g6_checkRA()">Check</button>
    <button class="secondary" onclick="g6_newRAQuestion()">New problem</button>
  `;
  document.getElementById('ra-feedback').className = 'feedback';
}
function g6_checkRA() {
  const v = parseInt(document.getElementById('ra-in').value);
  g6_raState.attempted++;
  const fb = document.getElementById('ra-feedback');
  if (v === g6_raState.answer) {
    g6_raState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct!';
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g6_raState.answer}.`;
  }
  document.getElementById('ra-score').innerHTML = scoreHTML(g6_raState);
}

// =====================================================================
// 10. SHAPE PROPERTY QUIZ
// =====================================================================
const g6_SHAPES = [
  { name: 'Triangle', sides: 3, vertices: 3, equalSides: 'depends' },
  { name: 'Square', sides: 4, vertices: 4, equalSides: 'Yes' },
  { name: 'Rectangle', sides: 4, vertices: 4, equalSides: 'No, opposite sides equal' },
  { name: 'Pentagon', sides: 5, vertices: 5, equalSides: 'depends' },
  { name: 'Hexagon', sides: 6, vertices: 6, equalSides: 'depends' },
  { name: 'Octagon', sides: 8, vertices: 8, equalSides: 'depends' },
];
let g6_shState = { shape: null, field: null, answer: null, correct: 0, attempted: 0 };
function g6_renderShapes() {
  g6_shState = { shape: null, field: null, answer: null, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔷 Shape Property Quiz</h2>
      <p class="subtext">Multiple choice. How many sides or vertices does the shape have?</p>
      ${tutorHTML('g6_shapes')}
      <div id="sh-score">${scoreHTML(g6_shState)}</div>
      <div id="sh-question"></div>
      <div id="sh-feedback" class="feedback"></div>
    </div>
  `;
  g6_newSHQuestion();
}
function g6_newSHQuestion() {
  const shape = pick(g6_SHAPES);
  const field = pick(['sides', 'vertices']);
  g6_shState.shape = shape; g6_shState.field = field; g6_shState.answer = shape[field];
  const options = shuffle([...new Set([shape[field], shape[field]-1, shape[field]+1, shape[field]+2])]).slice(0,4);
  document.getElementById('sh-question').innerHTML = `
    <div class="q-box">How many ${field} does a <strong>${shape.name}</strong> have?</div>
    <div class="mcq-opts">${options.map(o => `<div class="mcq-opt" onclick="g6_checkSH(this, ${o})">${o}</div>`).join('')}</div>
    <button class="secondary small" onclick="g6_newSHQuestion()">New question</button>
  `;
  document.getElementById('sh-feedback').className = 'feedback';
}
function g6_checkSH(el, val) {
  g6_shState.attempted++;
  const opts = document.querySelectorAll('#sh-question .mcq-opt');
  const fb = document.getElementById('sh-feedback');
  if (val === g6_shState.answer) {
    g6_shState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New question loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g6_newSHQuestion, 1000);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. A ${g6_shState.shape.name} has ${g6_shState.answer} ${g6_shState.field}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('sh-score').innerHTML = scoreHTML(g6_shState);
}

// =====================================================================
// 11. MIRROR MATCH
// =====================================================================
const g6_MIRROR_SHAPES = [
  [[0,1],[1,1],[2,1],[2,2],[2,3]],
  [[0,1],[0,2],[0,3],[1,2],[2,2]],
  [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]],
  [[1,2],[2,1],[2,2],[2,3],[3,2]],
  [[0,3],[1,3],[2,0],[2,1],[2,2],[2,3]],
];
let g6_mmState = { shape: null, userCells: new Set() };
function g6_renderMirror() {
  g6_mmState.shape = pick(g6_MIRROR_SHAPES);
  g6_mmState.userCells = new Set();
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🪞 Mirror Match</h2>
      <p class="subtext">The blue squares on the left are the shape. Click squares on the right of the orange mirror line to build the reflection.</p>
      ${tutorHTML('g6_mirror')}
      <div class="gridwrap"><div class="mirror-grid" id="mm-grid"></div></div>
      <button class="action" onclick="g6_checkMirror()">Check</button>
      <button class="secondary" onclick="g6_renderMirror()">New Shape</button>
      <button class="secondary" onclick="g6_clearMirror()">Clear my side</button>
      <div id="mm-feedback" class="feedback"></div>
    </div>
  `;
  g6_buildMirrorGrid();
}
function g6_buildMirrorGrid() {
  const grid = document.getElementById('mm-grid');
  grid.innerHTML = '';
  const rows = 5, cols = 12;
  const givenSet = new Set(g6_mmState.shape.map(([r,c]) => `${r},${c}`));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (c === 5) cell.classList.add('mirrorline');
      const key = `${r},${c}`;
      if (givenSet.has(key)) {
        cell.classList.add('given');
      } else if (c >= 6) {
        cell.classList.add('clickable');
        cell.onclick = () => {
          if (g6_mmState.userCells.has(key)) { g6_mmState.userCells.delete(key); cell.classList.remove('userfill'); }
          else { g6_mmState.userCells.add(key); cell.classList.add('userfill'); }
        };
      }
      grid.appendChild(cell);
    }
  }
}
function g6_clearMirror() {
  g6_mmState.userCells.clear();
  document.querySelectorAll('#mm-grid .cell.userfill').forEach(c => c.classList.remove('userfill'));
}
function g6_checkMirror() {
  const expected = new Set(g6_mmState.shape.map(([r,c]) => `${r},${11-c}`));
  const fb = document.getElementById('mm-feedback');
  const missing = [...expected].filter(k => !g6_mmState.userCells.has(k)).length;
  const extra = [...g6_mmState.userCells].filter(k => !expected.has(k)).length;
  if (missing === 0 && extra === 0) {
    fb.className = 'feedback good';
    fb.textContent = 'Perfect reflection!';
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite yet: ${missing} square(s) missing, ${extra} extra square(s). Remember, same row, mirrored column.`;
  }
}

// =====================================================================
// 12. TALLY AND BAR CHART BUILDER
// =====================================================================
let g6_dbState = { labels: ['Apple','Banana','Grapes','Orange','Other'], counts: [0,0,0,0,0] };
function g6_renderDataBars() {
  g6_dbState = { labels: ['Apple','Banana','Grapes','Orange','Other'], counts: [0,0,0,0,0] };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">📊 Tally and Bar Chart Builder</h2>
      <p class="subtext">Rename the categories if you like, for example for a different survey, then click plus 1 each time someone picks that answer. The bar chart builds itself live.</p>
      ${tutorHTML('g6_databars')}
      <div id="db-rows"></div>
      <div class="bar-chart" id="db-chart"></div>
      <button class="secondary" onclick="g6_resetDB()">Reset all counts</button>
    </div>
  `;
  g6_renderDBRows();
  g6_renderDBChart();
}
function g6_renderDBRows() {
  document.getElementById('db-rows').innerHTML = g6_dbState.labels.map((lbl, i) => `
    <div class="tally-row">
      <input type="text" value="${esc(lbl)}" onchange="g6_renameDB(${i}, this.value)" />
      <button class="secondary small" onclick="g6_bumpDB(${i}, -1)">minus 1</button>
      <span class="count">${g6_dbState.counts[i]}</span>
      <button class="secondary small" onclick="g6_bumpDB(${i}, 1)">plus 1</button>
    </div>
  `).join('');
}
function g6_renameDB(i, val) { g6_dbState.labels[i] = val || g6_dbState.labels[i]; g6_renderDBChart(); }
function g6_bumpDB(i, delta) {
  g6_dbState.counts[i] = Math.max(0, g6_dbState.counts[i] + delta);
  g6_renderDBRows();
  g6_renderDBChart();
}
function g6_resetDB() { g6_dbState.counts = g6_dbState.counts.map(() => 0); g6_renderDBRows(); g6_renderDBChart(); }
function g6_renderDBChart() {
  const max = Math.max(5, ...g6_dbState.counts) + 1;
  document.getElementById('db-chart').innerHTML = g6_dbState.labels.map((lbl, i) => {
    const h = Math.round((g6_dbState.counts[i] / max) * 150);
    const c = BEACH[i % BEACH.length];
    return `<div class="bar-col">
      <div class="num">${g6_dbState.counts[i]}</div>
      <div class="bar" style="height:${h}px; background: var(--${c});"></div>
      <div class="lbl">${esc(lbl)}</div>
    </div>`;
  }).join('');
}

// =====================================================================
// 13. MIXED WORD PROBLEMS
// =====================================================================
let g6_wpState = { answer: 0, hint: '', correct: 0, attempted: 0 };
const g6_WORD_PROBLEM_TEMPLATES = [
  () => {
    const total = pick([20,40,50,60,80,100]);
    const pct = pick([10,20,25,50,75]);
    const spend = total * pct / 100;
    return { q: `${pick(['Thandi','Sipho','Aisha','Liam'])} has R${total}. They spend ${pct}% of it. How much money is left?`, a: total - spend, hint: `Find ${pct}% of R${total} first, then subtract it from R${total}.` };
  },
  () => {
    const l = randInt(3, 12), w = randInt(2, 10);
    return { q: `A rectangular garden is ${l} m long and ${w} m wide. What is its area, in square metres?`, a: l * w, hint: 'Area of a rectangle equals length times width.' };
  },
  () => {
    const l = randInt(3, 12), w = randInt(2, 10);
    return { q: `A rectangular garden is ${l} m long and ${w} m wide. What is its perimeter, in metres?`, a: 2 * (l + w), hint: 'Perimeter means add up all 4 sides, or 2 times (length plus width).' };
  },
  () => {
    const den = pick([4,5,8,10]);
    const eaten = randInt(1, den - 1);
    return { q: `A pizza is cut into ${den} equal slices. Someone eats ${eaten} slices. What percentage of the pizza is left?`, a: Math.round(((den - eaten) / den) * 100), hint: `First find the fraction left (${den-eaten}/${den}), then convert it to a percentage.` };
  },
  () => {
    const muffins12 = pick([200, 300, 400, 600]);
    const wantMuffins = pick([3, 4, 6]);
    return { q: `A recipe for 12 muffins uses ${muffins12} g of flour. How much flour is needed for ${wantMuffins} muffins?`, a: (muffins12 / 12) * wantMuffins, hint: 'Find how much flour is needed for 1 muffin first, then multiply.' };
  },
  () => {
    const rand = randInt(100, 999);
    const nearest = pick([10, 100]);
    return { q: `Round ${rand} to the nearest ${nearest}.`, a: Math.round(rand / nearest) * nearest, hint: `Look at the digit right after the place you are rounding to.` };
  },
];
function g6_renderWordProblems() {
  g6_wpState = { answer: 0, hint: '', correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">📝 Mixed Word Problems</h2>
      <p class="subtext">Term 3 review, combining percentage, measurement, fractions, ratio and rounding.</p>
      ${tutorHTML('g6_wordprobs')}
      <div id="wp-score">${scoreHTML(g6_wpState)}</div>
      <div id="wp-question"></div>
      <div id="wp-feedback" class="feedback"></div>
    </div>
  `;
  g6_newWPQuestion();
}
function g6_newWPQuestion() {
  const t = pick(g6_WORD_PROBLEM_TEMPLATES)();
  g6_wpState.answer = t.a; g6_wpState.hint = t.hint;
  document.getElementById('wp-question').innerHTML = `
    <div class="q-box">${t.q}</div>
    <input type="number" id="wp-in" step="any" />
    <button class="action" onclick="g6_checkWP()">Check</button>
    <button class="secondary" onclick="g6_newWPQuestion()">New problem</button>
    <div><button class="hint-toggle" onclick="document.getElementById('wp-hint').style.display='block'">Show hint</button></div>
    <div class="hint-text" id="wp-hint">${t.hint}</div>
  `;
  document.getElementById('wp-feedback').className = 'feedback';
}
function g6_checkWP() {
  const v = parseFloat(document.getElementById('wp-in').value);
  g6_wpState.attempted++;
  const fb = document.getElementById('wp-feedback');
  if (Math.abs(v - g6_wpState.answer) < 0.01) {
    g6_wpState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct!';
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g6_wpState.answer}. ${g6_wpState.hint}`;
  }
  document.getElementById('wp-score').innerHTML = scoreHTML(g6_wpState);
}
