// =====================================================================
// LEVEL 5 - 1. PLACE VALUE (5 to 6 digit numbers)
// =====================================================================
let g5_pvState = { correct: 0, attempted: 0, answer: null };
function g5_renderPlaceValue() {
  g5_pvState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔢 Place Value Explorer</h2>
      <p class="subtext">Grade 5 numbers go up to 6 digits. What is the <em>value</em> of the highlighted digit?</p>
      ${tutorHTML('g5_placevalue')}
      <div id="g5pv-score">${scoreHTML(g5_pvState)}</div>
      <div id="g5pv-question"></div>
      <div id="g5pv-feedback" class="feedback"></div>
    </div>
  `;
  g5_newPVQuestion();
}
function g5_newPVQuestion() {
  const digits = pick([5, 6]);
  const num = randInt(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
  const numStr = String(num);
  const pos = randInt(0, numStr.length - 1);
  const digit = parseInt(numStr[pos]);
  const placeValueExp = numStr.length - 1 - pos;
  const correct = digit * Math.pow(10, placeValueExp);
  g5_pvState.answer = correct;
  const display = numStr.split('').map((d, i) => i === pos ? `<span style="color:#E11D48; text-decoration:underline;">${d}</span>` : d).join('');
  let options = [correct, digit, correct + Math.pow(10, placeValueExp), Math.max(1, correct - Math.pow(10, placeValueExp))];
  options = [...new Set(options)];
  while (options.length < 4) options.push(correct + randInt(1, 9));
  const finalOpts = shuffle(options.slice(0, 4));
  document.getElementById('g5pv-question').innerHTML = `
    <div class="q-box">In the number <strong>${display}</strong>, what is the value of the underlined digit?</div>
    <div class="mcq-opts">${finalOpts.map(o => `<div class="mcq-opt" onclick="g5_checkPV(this, ${o})">${o.toLocaleString('en-ZA').replace(/,/g,' ')}</div>`).join('')}</div>
    <button class="secondary small" onclick="g5_newPVQuestion()">Skip, new number</button>
  `;
  document.getElementById('g5pv-feedback').className = 'feedback';
}
function g5_checkPV(el, val) {
  g5_pvState.attempted++;
  const opts = document.querySelectorAll('#g5pv-question .mcq-opt');
  const fb = document.getElementById('g5pv-feedback');
  if (val === g5_pvState.answer) {
    g5_pvState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New question loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g5_newPVQuestion, 1100);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The correct value is ${g5_pvState.answer.toLocaleString('en-ZA').replace(/,/g,' ')}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('g5pv-score').innerHTML = scoreHTML(g5_pvState);
}

// =====================================================================
// LEVEL 5 - 2. ADD AND SUBTRACT (5 digit numbers)
// =====================================================================
let g5_asState = { correct: 0, attempted: 0, answer: null };
function g5_renderAddSub() {
  g5_asState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">➕ Add and Subtract Blitz</h2>
      <p class="subtext">5 digit numbers. Work it out on paper first if you need to.</p>
      ${tutorHTML('g5_addsub')}
      <div id="g5as-score">${scoreHTML(g5_asState)}</div>
      <div id="g5as-question"></div>
      <div id="g5as-feedback" class="feedback"></div>
    </div>
  `;
  g5_newASQuestion();
}
function g5_newASQuestion() {
  const isAdd = Math.random() < 0.5;
  let a = randInt(10000, 99999), b = randInt(10000, 99999);
  if (!isAdd && b > a) [a, b] = [b, a];
  g5_asState.answer = isAdd ? a + b : a - b;
  document.getElementById('g5as-question').innerHTML = `
    <div class="q-box">${a} ${isAdd ? '+' : '-'} ${b} = <input type="number" id="g5as-in" autofocus /></div>
    <button class="action" onclick="g5_checkAS()">Check</button>
    <button class="secondary" onclick="g5_newASQuestion()">Skip</button>
  `;
  document.getElementById('g5as-feedback').className = 'feedback';
  const inputEl = document.getElementById('g5as-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g5_checkAS(); });
}
function g5_checkAS() {
  const v = parseInt(document.getElementById('g5as-in').value);
  g5_asState.attempted++;
  const fb = document.getElementById('g5as-feedback');
  if (v === g5_asState.answer) {
    g5_asState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g5_newASQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g5_asState.answer}.`;
  }
  document.getElementById('g5as-score').innerHTML = scoreHTML(g5_asState);
}

// =====================================================================
// LEVEL 5 - 3. MULTIPLICATION (3 digit by 2 digit)
// =====================================================================
let g5_mpState = { correct: 0, attempted: 0, answer: null };
function g5_renderMultiply() {
  g5_mpState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">✖️ Multiplication Practice</h2>
      <p class="subtext">3 digit by 2 digit numbers.</p>
      ${tutorHTML('g5_multiply')}
      <div id="g5mp-score">${scoreHTML(g5_mpState)}</div>
      <div id="g5mp-question"></div>
      <div id="g5mp-feedback" class="feedback"></div>
    </div>
  `;
  g5_newMPQuestion();
}
function g5_newMPQuestion() {
  const a = randInt(100, 999), b = randInt(11, 99);
  g5_mpState.answer = a * b;
  document.getElementById('g5mp-question').innerHTML = `
    <div class="q-box">${a} &times; ${b} = <input type="number" id="g5mp-in" autofocus /></div>
    <button class="action" onclick="g5_checkMP()">Check</button>
    <button class="secondary" onclick="g5_newMPQuestion()">Skip</button>
  `;
  document.getElementById('g5mp-feedback').className = 'feedback';
  const inputEl = document.getElementById('g5mp-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g5_checkMP(); });
}
function g5_checkMP() {
  const v = parseInt(document.getElementById('g5mp-in').value);
  g5_mpState.attempted++;
  const fb = document.getElementById('g5mp-feedback');
  if (v === g5_mpState.answer) {
    g5_mpState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g5_newMPQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g5_mpState.answer}.`;
  }
  document.getElementById('g5mp-score').innerHTML = scoreHTML(g5_mpState);
}

// =====================================================================
// LEVEL 5 - 4. DIVISION (3 digit by 2 digit)
// =====================================================================
let g5_dvState = { correct: 0, attempted: 0, answer: null, remainder: 0, mode: 'exact' };
function g5_renderDivide() {
  g5_dvState = { correct: 0, attempted: 0, answer: null, remainder: 0, mode: 'exact' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">➗ Division Practice</h2>
      <p class="subtext">A 3 digit number divided by a 2 digit number.</p>
      ${tutorHTML('g5_divide')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="g5dv-mode-exact" onclick="g5_setDVMode('exact')">Exact answer</div>
        <div class="mcq-opt" id="g5dv-mode-rem" onclick="g5_setDVMode('remainder')">With a remainder</div>
      </div>
      <div id="g5dv-score">${scoreHTML(g5_dvState)}</div>
      <div id="g5dv-question"></div>
      <div id="g5dv-feedback" class="feedback"></div>
    </div>
  `;
  g5_markDVMode();
  g5_newDVQuestion();
}
function g5_setDVMode(m) { g5_dvState.mode = m; g5_markDVMode(); g5_newDVQuestion(); }
function g5_markDVMode() {
  document.getElementById('g5dv-mode-exact').classList.toggle('correct', g5_dvState.mode === 'exact');
  document.getElementById('g5dv-mode-rem').classList.toggle('correct', g5_dvState.mode === 'remainder');
}
function g5_newDVQuestion() {
  const divisor = randInt(10, 99);
  let quotient, dividend, remainder = 0;
  if (g5_dvState.mode === 'exact') {
    do { quotient = randInt(2, 9); dividend = divisor * quotient; } while (dividend < 100 || dividend > 999);
  } else {
    do {
      quotient = randInt(2, 9);
      remainder = randInt(1, divisor - 1);
      dividend = divisor * quotient + remainder;
    } while (dividend < 100 || dividend > 999);
  }
  g5_dvState.answer = quotient; g5_dvState.remainder = remainder;
  document.getElementById('g5dv-question').innerHTML = `
    <div class="q-box">${dividend} &divide; ${divisor} = ___ ${g5_dvState.mode === 'remainder' ? 'remainder ___' : ''}</div>
    Answer: <input type="number" id="g5dv-in" autofocus style="width:80px;" />
    ${g5_dvState.mode === 'remainder' ? 'Remainder: <input type="number" id="g5dv-rem" style="width:80px;" />' : ''}
    <button class="action" onclick="g5_checkDV()">Check</button>
    <button class="secondary" onclick="g5_newDVQuestion()">Skip</button>
  `;
  document.getElementById('g5dv-feedback').className = 'feedback';
  const inputEl = document.getElementById('g5dv-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g5_checkDV(); });
}
function g5_checkDV() {
  const v = parseInt(document.getElementById('g5dv-in').value);
  const remEl = document.getElementById('g5dv-rem');
  const r = remEl ? parseInt(remEl.value) : 0;
  g5_dvState.attempted++;
  const fb = document.getElementById('g5dv-feedback');
  const ok = g5_dvState.mode === 'exact' ? (v === g5_dvState.answer) : (v === g5_dvState.answer && r === g5_dvState.remainder);
  if (ok) {
    g5_dvState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g5_newDVQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = g5_dvState.mode === 'exact' ? `Not quite. The answer was ${g5_dvState.answer}.` : `Not quite. The answer was ${g5_dvState.answer} remainder ${g5_dvState.remainder}.`;
  }
  document.getElementById('g5dv-score').innerHTML = scoreHTML(g5_dvState);
}

// =====================================================================
// LEVEL 5 - 5. FRACTIONS WITH MIXED NUMBERS (same denominator)
// =====================================================================
let g5_fmState = { den: 0, wholeAns: 0, fracAns: 0, correct: 0, attempted: 0 };
function g5_renderFracMixed() {
  g5_fmState = { den: 0, wholeAns: 0, fracAns: 0, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🍰 Add and Subtract Mixed Numbers</h2>
      <p class="subtext">Same denominator throughout. Type your answer as a mixed number, for example 1 2/5, or just a fraction like 4/5 if it is less than 1, or a whole number like 2 if there is no fraction left.</p>
      ${tutorHTML('g5_fracmixed')}
      <div id="g5fm-score">${scoreHTML(g5_fmState)}</div>
      <div id="g5fm-question"></div>
      <div id="g5fm-feedback" class="feedback"></div>
    </div>
  `;
  g5_newFMQuestion();
}
function g5_mixedText(w, n, d) {
  if (n === 0) return `${w}`;
  return w > 0 ? `${w} ${n}/${d}` : `${n}/${d}`;
}
function g5_newFMQuestion() {
  const den = pick([3,4,5,6,8]);
  const isAdd = Math.random() < 0.5;
  const w1 = randInt(0, 2), n1 = randInt(0, den - 1);
  let w2, n2;
  const imp1 = w1 * den + n1;
  let totalImp;
  if (isAdd) {
    w2 = randInt(0, 2); n2 = randInt(0, den - 1);
    totalImp = imp1 + (w2 * den + n2);
  } else {
    // ensure operand1 >= operand2 so the result stays non negative
    do { w2 = randInt(0, w1); n2 = randInt(0, den - 1); } while (w2 * den + n2 > imp1);
    totalImp = imp1 - (w2 * den + n2);
  }
  g5_fmState.den = den;
  g5_fmState.wholeAns = Math.floor(totalImp / den);
  g5_fmState.fracAns = totalImp % den;
  document.getElementById('g5fm-question').innerHTML = `
    <div class="q-box">${g5_mixedText(w1, n1, den)} ${isAdd ? '+' : '-'} ${g5_mixedText(w2, n2, den)} = <input type="text" id="g5fm-in" placeholder="for example 1 2/${den}" style="width:120px;" /></div>
    <button class="action" onclick="g5_checkFM()">Check</button>
    <button class="secondary" onclick="g5_newFMQuestion()">Skip</button>
  `;
  document.getElementById('g5fm-feedback').className = 'feedback';
}
function g5_checkFM() {
  const raw = (document.getElementById('g5fm-in').value || '').trim();
  g5_fmState.attempted++;
  const fb = document.getElementById('g5fm-feedback');
  let ok = false;
  const parts = raw.split(/\s+/);
  let whole = 0, num = 0, den = null;
  if (parts.length === 2 && parts[1].includes('/')) {
    whole = parseInt(parts[0]);
    const fp = parts[1].split('/');
    num = parseInt(fp[0]); den = parseInt(fp[1]);
  } else if (parts.length === 1 && parts[0].includes('/')) {
    const fp = parts[0].split('/');
    whole = 0; num = parseInt(fp[0]); den = parseInt(fp[1]);
  } else if (parts.length === 1 && !isNaN(parseInt(parts[0]))) {
    whole = parseInt(parts[0]); num = 0; den = g5_fmState.den;
  }
  if (den !== null && !isNaN(whole) && !isNaN(num) && den !== 0) {
    const expectedImp = g5_fmState.wholeAns * g5_fmState.den + g5_fmState.fracAns;
    const gotImp = whole * den + num;
    ok = gotImp * g5_fmState.den === expectedImp * den;
  }
  const answerText = g5_mixedText(g5_fmState.wholeAns, g5_fmState.fracAns, g5_fmState.den);
  if (ok) {
    g5_fmState.correct++;
    fb.className = 'feedback good';
    fb.textContent = `Correct! (${answerText}). Next one.`;
    setTimeout(g5_newFMQuestion, 1100);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${answerText}.`;
  }
  document.getElementById('g5fm-score').innerHTML = scoreHTML(g5_fmState);
}

// =====================================================================
// LEVEL 5 - 6. COMPARE DECIMALS
// =====================================================================
let g5_dcState = { correct: 0, attempted: 0, answer: null };
function g5_renderDecimals() {
  g5_dcState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔢 Compare Decimals</h2>
      <p class="subtext">Choose the sign that belongs between the two decimal numbers, to 2 decimal places.</p>
      ${tutorHTML('g5_decimals')}
      <div id="g5dc-score">${scoreHTML(g5_dcState)}</div>
      <div id="g5dc-question"></div>
      <div id="g5dc-feedback" class="feedback"></div>
    </div>
  `;
  g5_newDCQuestion();
}
function g5_newDCQuestion() {
  let a = randInt(0, 999) / 100, b = randInt(0, 999) / 100;
  if (Math.random() < 0.25) b = a;
  a = Math.round(a * 100) / 100; b = Math.round(b * 100) / 100;
  g5_dcState.answer = a === b ? '=' : (a > b ? '>' : '<');
  document.getElementById('g5dc-question').innerHTML = `
    <div class="q-box">${a.toFixed(2)} &nbsp; ___ &nbsp; ${b.toFixed(2)}</div>
    <div class="mcq-opts">
      <div class="mcq-opt" onclick="g5_checkDC(this, '<')" style="font-size:1.3rem;">&lt;</div>
      <div class="mcq-opt" onclick="g5_checkDC(this, '>')" style="font-size:1.3rem;">&gt;</div>
      <div class="mcq-opt" onclick="g5_checkDC(this, '=')" style="font-size:1.3rem;">=</div>
    </div>
    <button class="secondary small" onclick="g5_newDCQuestion()">New numbers</button>
  `;
  document.getElementById('g5dc-feedback').className = 'feedback';
}
function g5_checkDC(el, val) {
  g5_dcState.attempted++;
  const opts = document.querySelectorAll('#g5dc-question .mcq-opt');
  const fb = document.getElementById('g5dc-feedback');
  if (val === g5_dcState.answer) {
    g5_dcState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New question loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g5_newDCQuestion, 900);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The correct sign was ${g5_dcState.answer}. Compare the digits after the decimal point, column by column, just like whole numbers.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('g5dc-score').innerHTML = scoreHTML(g5_dcState);
}

// =====================================================================
// LEVEL 5 - 7. AREA BY COUNTING SQUARES
// =====================================================================
let g5_arState = { correct: 0, attempted: 0, answer: null, mode: 'rect' };
function g5_renderArea() {
  g5_arState = { correct: 0, attempted: 0, answer: null, mode: 'rect' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🟩 Area by Counting Squares</h2>
      <p class="subtext">Count the shaded unit squares to find the area.</p>
      ${tutorHTML('g5_area')}
      <div class="mcq-opts">
        <div class="mcq-opt" id="g5ar-mode-rect" onclick="g5_setARMode('rect')">Rectangle</div>
        <div class="mcq-opt" id="g5ar-mode-l" onclick="g5_setARMode('l')">L-shape</div>
      </div>
      <div id="g5ar-score">${scoreHTML(g5_arState)}</div>
      <div id="g5ar-question"></div>
      <div id="g5ar-feedback" class="feedback"></div>
    </div>
  `;
  g5_markARMode();
  g5_newARQuestion();
}
function g5_setARMode(m) { g5_arState.mode = m; g5_markARMode(); g5_newARQuestion(); }
function g5_markARMode() {
  document.getElementById('g5ar-mode-rect').classList.toggle('correct', g5_arState.mode === 'rect');
  document.getElementById('g5ar-mode-l').classList.toggle('correct', g5_arState.mode === 'l');
}
function g5_newARQuestion() {
  const rows = randInt(3, 7), cols = randInt(3, 8);
  let cutRows = 0, cutCols = 0;
  if (g5_arState.mode === 'l') {
    cutRows = randInt(1, rows - 1);
    cutCols = randInt(1, cols - 1);
  }
  const area = rows * cols - cutRows * cutCols;
  g5_arState.answer = area;
  let grid = `<div class="pattern-grid" style="grid-template-columns: repeat(${cols}, 24px);">`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const removed = (r < cutRows) && (c >= cols - cutCols);
      grid += `<div class="blk ${removed ? '' : 'on'}" style="${removed ? 'visibility:hidden;' : ''}"></div>`;
    }
  }
  grid += '</div>';
  document.getElementById('g5ar-question').innerHTML = `
    <div>${grid}</div>
    <div class="q-box">Each square is 1 unit. What is the area? <input type="number" id="g5ar-in" style="width:90px;" /></div>
    <button class="action" onclick="g5_checkAR()">Check</button>
    <button class="secondary" onclick="g5_newARQuestion()">New shape</button>
  `;
  document.getElementById('g5ar-feedback').className = 'feedback';
}
function g5_checkAR() {
  const v = parseInt(document.getElementById('g5ar-in').value);
  g5_arState.attempted++;
  const fb = document.getElementById('g5ar-feedback');
  if (v === g5_arState.answer) {
    g5_arState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g5_newARQuestion, 1100);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. There are ${g5_arState.answer} shaded squares.`;
  }
  document.getElementById('g5ar-score').innerHTML = scoreHTML(g5_arState);
}

// =====================================================================
// LEVEL 5 - 8. TIME (12 hour and 24 hour)
// =====================================================================
let g5_tmState = { correct: 0, attempted: 0, expected: '' };
function g5_renderTime() {
  g5_tmState = { correct: 0, attempted: 0, expected: '' };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🕐 12 Hour and 24 Hour Time</h2>
      <p class="subtext">Write the 24 hour digital time for the 12 hour time shown, for example 2:30 pm is 14:30.</p>
      ${tutorHTML('g5_time')}
      <div id="g5tm-score">${scoreHTML(g5_tmState)}</div>
      <div id="g5tm-question"></div>
      <div id="g5tm-feedback" class="feedback"></div>
    </div>
  `;
  g5_newTMQuestion();
}
function g5_newTMQuestion() {
  const h = randInt(1, 12), m = pick([0,15,30,45]);
  const isPM = Math.random() < 0.5;
  const h24 = isPM ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
  g5_tmState.expected = `${String(h24).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  document.getElementById('g5tm-question').innerHTML = `
    <div class="q-box">${h}:${String(m).padStart(2,'0')} ${isPM ? 'pm' : 'am'} in 24 hour time is <input type="text" id="g5tm-in" placeholder="HH:MM" style="width:100px;" autofocus /></div>
    <button class="action" onclick="g5_checkTM()">Check</button>
    <button class="secondary" onclick="g5_newTMQuestion()">Skip</button>
  `;
  document.getElementById('g5tm-feedback').className = 'feedback';
}
function g5_checkTM() {
  const raw = (document.getElementById('g5tm-in').value || '').trim();
  g5_tmState.attempted++;
  const fb = document.getElementById('g5tm-feedback');
  const norm = raw.replace(/^(\d):/, '0$1:');
  if (norm === g5_tmState.expected) {
    g5_tmState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g5_newTMQuestion, 900);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The answer was ${g5_tmState.expected}.`;
  }
  document.getElementById('g5tm-score').innerHTML = scoreHTML(g5_tmState);
}

// =====================================================================
// LEVEL 5 - 9. NAMED ANGLES
// =====================================================================
let g5_anState = { correct: 0, attempted: 0, answer: null };
function g5_newANQuestion() {
  const cat = pick(['acute', 'right', 'obtuse', 'straight']);
  let deg;
  if (cat === 'acute') deg = randInt(20, 75);
  else if (cat === 'right') deg = 90;
  else if (cat === 'obtuse') deg = randInt(105, 160);
  else deg = 180;
  g5_anState.answer = cat;
  document.getElementById('g5an-question').innerHTML = `
    <div>${g4_angleSVG(deg)}</div>
    <div class="mcq-opts">
      <div class="mcq-opt" onclick="g5_checkAN(this, 'acute')">Acute</div>
      <div class="mcq-opt" onclick="g5_checkAN(this, 'right')">Right angle</div>
      <div class="mcq-opt" onclick="g5_checkAN(this, 'obtuse')">Obtuse</div>
      <div class="mcq-opt" onclick="g5_checkAN(this, 'straight')">Straight</div>
    </div>
    <button class="secondary small" onclick="g5_newANQuestion()">New angle</button>
  `;
  document.getElementById('g5an-feedback').className = 'feedback';
}
function g5_renderAngles() {
  g5_anState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">📐 Named Angles</h2>
      <p class="subtext">Acute, right, obtuse or straight? Grade 5 also names reflex angles and full revolutions, which need an arc diagram and are not quizzed here.</p>
      ${tutorHTML('g5_angles')}
      <div id="g5an-score">${scoreHTML(g5_anState)}</div>
      <div id="g5an-question"></div>
      <div id="g5an-feedback" class="feedback"></div>
    </div>
  `;
  g5_newANQuestion();
}
function g5_checkAN(el, val) {
  g5_anState.attempted++;
  const opts = document.querySelectorAll('#g5an-question .mcq-opt');
  const fb = document.getElementById('g5an-feedback');
  const labels = { acute: 'acute', right: 'a right angle', obtuse: 'obtuse', straight: 'a straight angle' };
  if (val === g5_anState.answer) {
    g5_anState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New angle loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g5_newANQuestion, 1000);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. This angle is ${labels[g5_anState.answer]}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('g5an-score').innerHTML = scoreHTML(g5_anState);
}

// =====================================================================
// LEVEL 5 - 10. TRANSFORMATION SPOTTER
// =====================================================================
const G5_TRANSFORM_TEMPLATES = [
  { type: 'translate', text: n => `A ${n} slides 4 squares to the right and 2 squares up, without turning or flipping.` },
  { type: 'translate', text: n => `A ${n} moves straight across the grid to a new spot, keeping exactly the same size and facing the same way.` },
  { type: 'reflect', text: n => `A ${n} flips over a mirror line, so its reflection appears the other side, facing the opposite way.` },
  { type: 'reflect', text: n => `A ${n} is mirrored across a line, like a butterfly wing, producing its exact reverse image.` },
  { type: 'rotate', text: n => `A ${n} turns around a fixed point, a quarter turn clockwise, without sliding anywhere.` },
  { type: 'rotate', text: n => `A ${n} spins around one corner, like the hands of a clock, ending up facing a new direction.` },
];
const G5_SHAPE_NOUNS = ['triangle', 'square', 'rectangle', 'arrow shape', 'letter F shape'];
let g5_trState = { correct: 0, attempted: 0, answer: null };
function g5_renderTransform() {
  g5_trState = { correct: 0, attempted: 0, answer: null };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔄 Transformation Spotter</h2>
      <p class="subtext">Read the description. Was it a translation, a reflection or a rotation?</p>
      ${tutorHTML('g5_transform')}
      <div id="g5tr-score">${scoreHTML(g5_trState)}</div>
      <div id="g5tr-question"></div>
      <div id="g5tr-feedback" class="feedback"></div>
    </div>
  `;
  g5_newTRQuestion();
}
function g5_newTRQuestion() {
  const t = pick(G5_TRANSFORM_TEMPLATES);
  const noun = pick(G5_SHAPE_NOUNS);
  g5_trState.answer = t.type;
  document.getElementById('g5tr-question').innerHTML = `
    <div class="q-box">${t.text(noun)}</div>
    <div class="mcq-opts">
      <div class="mcq-opt" onclick="g5_checkTR(this, 'translate')">Translation</div>
      <div class="mcq-opt" onclick="g5_checkTR(this, 'reflect')">Reflection</div>
      <div class="mcq-opt" onclick="g5_checkTR(this, 'rotate')">Rotation</div>
    </div>
    <button class="secondary small" onclick="g5_newTRQuestion()">New description</button>
  `;
  document.getElementById('g5tr-feedback').className = 'feedback';
}
function g5_checkTR(el, val) {
  g5_trState.attempted++;
  const opts = document.querySelectorAll('#g5tr-question .mcq-opt');
  const fb = document.getElementById('g5tr-feedback');
  const labels = { translate: 'a translation (a slide)', reflect: 'a reflection (a flip)', rotate: 'a rotation (a turn)' };
  if (val === g5_trState.answer) {
    g5_trState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New description loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g5_newTRQuestion, 1100);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. This describes ${labels[g5_trState.answer]}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('g5tr-score').innerHTML = scoreHTML(g5_trState);
}

// =====================================================================
// LEVEL 5 - 11. 2D SHAPE PROPERTIES (including heptagon)
// =====================================================================
const G5_SHAPES = [
  { name: 'Triangle', sides: 3, vertices: 3 },
  { name: 'Square', sides: 4, vertices: 4 },
  { name: 'Rectangle', sides: 4, vertices: 4 },
  { name: 'Pentagon', sides: 5, vertices: 5 },
  { name: 'Hexagon', sides: 6, vertices: 6 },
  { name: 'Heptagon', sides: 7, vertices: 7 },
  { name: 'Octagon', sides: 8, vertices: 8 },
];
let g5_shState = { shape: null, field: null, answer: null, correct: 0, attempted: 0 };
function g5_renderShapes2D() {
  g5_shState = { shape: null, field: null, answer: null, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔷 2D Shape Properties</h2>
      <p class="subtext">Multiple choice. How many sides or vertices does the shape have? Grade 5 adds the heptagon, a 7 sided shape, to the Grade 4 list.</p>
      ${tutorHTML('g5_shapes2d')}
      <div id="g5sh-score">${scoreHTML(g5_shState)}</div>
      <div id="g5sh-question"></div>
      <div id="g5sh-feedback" class="feedback"></div>
    </div>
  `;
  g5_newSHQuestion();
}
function g5_newSHQuestion() {
  const shape = pick(G5_SHAPES);
  const field = pick(['sides', 'vertices']);
  g5_shState.shape = shape; g5_shState.field = field; g5_shState.answer = shape[field];
  const options = shuffle([...new Set([shape[field], Math.max(2, shape[field]-1), shape[field]+1, shape[field]+2])]).slice(0,4);
  document.getElementById('g5sh-question').innerHTML = `
    <div class="q-box">How many ${field} does a <strong>${shape.name}</strong> have?</div>
    <div class="mcq-opts">${options.map(o => `<div class="mcq-opt" onclick="g5_checkSH(this, ${o})">${o}</div>`).join('')}</div>
    <button class="secondary small" onclick="g5_newSHQuestion()">New question</button>
  `;
  document.getElementById('g5sh-feedback').className = 'feedback';
}
function g5_checkSH(el, val) {
  g5_shState.attempted++;
  const opts = document.querySelectorAll('#g5sh-question .mcq-opt');
  const fb = document.getElementById('g5sh-feedback');
  if (val === g5_shState.answer) {
    g5_shState.correct++;
    el.classList.add('correct');
    fb.className = 'feedback good';
    fb.textContent = 'Correct! New question loading.';
    opts.forEach(o => o.onclick = null);
    setTimeout(g5_newSHQuestion, 1000);
  } else {
    el.classList.add('wrong');
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. A ${g5_shState.shape.name} has ${g5_shState.answer} ${g5_shState.field}.`;
    opts.forEach(o => o.onclick = null);
  }
  document.getElementById('g5sh-score').innerHTML = scoreHTML(g5_shState);
}

// =====================================================================
// LEVEL 5 - 12. NUMBER PATTERNS (non constant difference)
// =====================================================================
let g5_npState = { answer: null, correct: 0, attempted: 0 };
function g5_renderNumPattern() {
  g5_npState = { answer: null, correct: 0, attempted: 0 };
  app.innerHTML = `
    ${backBtn()}
    <div class="card">
      <h2 class="activity-title">🔁 Number Patterns</h2>
      <p class="subtext">These patterns do not always add or subtract the same amount each time. Work out the rule, step by step.</p>
      ${tutorHTML('g5_numpattern')}
      <div id="g5np-score">${scoreHTML(g5_npState)}</div>
      <div id="g5np-question"></div>
      <div id="g5np-feedback" class="feedback"></div>
    </div>
  `;
  g5_newNPQuestion();
}
function g5_newNPQuestion() {
  const type = pick(['multiply3', 'increasingdiff', 'twostep']);
  let seq = [];
  if (type === 'multiply3') { const start = randInt(1, 4); seq = [0,1,2,3,4].map(i => start * Math.pow(3, i)); }
  else if (type === 'increasingdiff') { let cur = randInt(1, 5); seq = [cur]; let d = randInt(1, 3); for (let i = 0; i < 4; i++) { cur += d; seq.push(cur); d += 1; } }
  else { let cur = randInt(1, 6); seq = [cur]; for (let i = 0; i < 4; i++) { cur = cur * 2 + 1; seq.push(cur); } }
  g5_npState.answer = seq[4];
  document.getElementById('g5np-question').innerHTML = `
    <div class="q-box">${seq.slice(0,4).join(', ')}, ___</div>
    <input type="number" id="g5np-in" autofocus />
    <button class="action" onclick="g5_checkNP()">Check</button>
    <button class="secondary" onclick="g5_newNPQuestion()">Skip</button>
  `;
  document.getElementById('g5np-feedback').className = 'feedback';
  const inputEl = document.getElementById('g5np-in');
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') g5_checkNP(); });
}
function g5_checkNP() {
  const v = parseInt(document.getElementById('g5np-in').value);
  g5_npState.attempted++;
  const fb = document.getElementById('g5np-feedback');
  if (v === g5_npState.answer) {
    g5_npState.correct++;
    fb.className = 'feedback good';
    fb.textContent = 'Correct! Next one.';
    setTimeout(g5_newNPQuestion, 1000);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = `Not quite. The next number was ${g5_npState.answer}.`;
  }
  document.getElementById('g5np-score').innerHTML = scoreHTML(g5_npState);
}
