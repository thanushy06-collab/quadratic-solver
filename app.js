/**
 * QuadraticLab - Web Application Logic & Interactive Canvas Plotter
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const inputA = document.getElementById('inputA');
  const inputB = document.getElementById('inputB');
  const inputC = document.getElementById('inputC');

  const sliderA = document.getElementById('sliderA');
  const sliderB = document.getElementById('sliderB');
  const sliderC = document.getElementById('sliderC');

  const renderedEq = document.getElementById('renderedEq');
  const themeToggle = document.getElementById('themeToggle');

  // Stats / Badges
  const statType = document.getElementById('statType');
  const statDiscriminant = document.getElementById('statDiscriminant');
  const statRoots = document.getElementById('statRoots');
  const statVertex = document.getElementById('statVertex');
  const statExtrema = document.getElementById('statExtrema');
  const statAxis = document.getElementById('statAxis');
  const statYInt = document.getElementById('statYInt');
  const statFactored = document.getElementById('statFactored');

  // Step Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const stepsFormulaContainer = document.getElementById('stepsFormula');
  const stepsSquareContainer = document.getElementById('stepsSquare');
  const stepsFactoringContainer = document.getElementById('stepsFactoring');

  // Buttons
  const btnRandom = document.getElementById('btnRandom');
  const btnReset = document.getElementById('btnReset');
  const btnCopyLatex = document.getElementById('btnCopyLatex');

  // Canvas
  const canvas = document.getElementById('parabolaCanvas');
  const ctx = canvas.getContext('2d');
  const graphTooltip = document.getElementById('graphTooltip');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnResetView = document.getElementById('btnResetView');

  // History
  const historyList = document.getElementById('historyList');
  const btnClearHistory = document.getElementById('btnClearHistory');

  // Quiz Mode
  const quizEquation = document.getElementById('quizEquation');
  const quizDiffSelect = document.getElementById('quizDifficulty');
  const quizAnsD = document.getElementById('quizAnsD');
  const quizAnsX1 = document.getElementById('quizAnsX1');
  const quizAnsX2 = document.getElementById('quizAnsX2');
  const btnCheckQuiz = document.getElementById('btnCheckQuiz');
  const btnNewQuiz = document.getElementById('btnNewQuiz');
  const btnQuizHint = document.getElementById('btnQuizHint');
  const quizFeedback = document.getElementById('quizFeedback');
  const quizStreakEl = document.getElementById('quizStreak');

  // Presets
  const presetChips = document.querySelectorAll('.preset-chip');

  // --- Graph Viewport State ---
  let view = {
    centerX: 0,
    centerY: 0,
    scale: 28, // pixels per unit
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0
  };

  let currentSolution = null;
  let quizCurrent = null;
  let quizStreak = 0;
  let historyData = [];

  // --- Initialize Theme ---
  const savedTheme = localStorage.getItem('qlab_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('qlab_theme', next);
    updateThemeIcon(next);
    drawGraph();
  });

  function updateThemeIcon(theme) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // --- Load Local History ---
  try {
    const raw = localStorage.getItem('qlab_history');
    if (raw) historyData = JSON.parse(raw);
  } catch (e) {
    historyData = [];
  }

  // --- Synchronize Inputs and Sliders ---
  function syncFromInputs() {
    let a = parseFloat(inputA.value) || 0;
    let b = parseFloat(inputB.value) || 0;
    let c = parseFloat(inputC.value) || 0;

    sliderA.value = a;
    sliderB.value = b;
    sliderC.value = c;

    solveAndUpdate(a, b, c);
  }

  function syncFromSliders() {
    let a = parseFloat(sliderA.value);
    let b = parseFloat(sliderB.value);
    let c = parseFloat(sliderC.value);

    inputA.value = a;
    inputB.value = b;
    inputC.value = c;

    solveAndUpdate(a, b, c);
  }

  [inputA, inputB, inputC].forEach(inp => inp.addEventListener('input', syncFromInputs));
  [sliderA, sliderB, sliderC].forEach(sld => sld.addEventListener('input', syncFromSliders));

  // --- Presets ---
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const a = parseFloat(chip.dataset.a);
      const b = parseFloat(chip.dataset.b);
      const c = parseFloat(chip.dataset.c);

      inputA.value = a;
      inputB.value = b;
      inputC.value = c;
      sliderA.value = a;
      sliderB.value = b;
      sliderC.value = c;

      autoFitView(a, b, c);
      solveAndUpdate(a, b, c);
    });
  });

  // --- Core Solve & Display ---
  function solveAndUpdate(a, b, c, saveToHistory = true) {
    const sol = QuadraticCore.solve(a, b, c);
    currentSolution = sol;

    // Display formatted equation
    renderedEq.textContent = sol.equationString;

    // Summary Cards
    statType.textContent = sol.classification;
    if (sol.isQuadratic) {
      const dSign = sol.discriminant > 0 ? ' > 0' : (sol.discriminant === 0 ? ' = 0' : ' < 0');
      statDiscriminant.textContent = `${sol.discriminant} (Δ${dSign})`;
      statRoots.textContent = sol.exactRoots.join(' , ');
      statVertex.textContent = `(${QuadraticCore.formatNum(sol.vertex.x)}, ${QuadraticCore.formatNum(sol.vertex.y)})`;
      statExtrema.textContent = sol.extrema;
      statAxis.textContent = sol.axisOfSymmetry;
      statYInt.textContent = `(0, ${QuadraticCore.formatNum(sol.yIntercept.y)})`;
      statFactored.textContent = (sol.methods.factoring && sol.methods.factoring.factorable)
        ? sol.methods.factoring.factoredForm
        : 'Cannot be factored cleanly';
    } else {
      statDiscriminant.textContent = 'N/A (Linear/Degenerate)';
      statRoots.textContent = sol.exactRoots.length > 0 ? sol.exactRoots.join(' , ') : 'None';
      statVertex.textContent = 'None';
      statExtrema.textContent = 'Linear (No vertex)';
      statAxis.textContent = 'None';
      statYInt.textContent = `(0, ${QuadraticCore.formatNum(c)})`;
      statFactored.textContent = 'N/A';
    }

    // Render Steps
    renderFormulaSteps(sol);
    renderSquareSteps(sol);
    renderFactoringSteps(sol);

    // Update History
    if (saveToHistory) {
      addToHistory(sol);
    }

    // Redraw Canvas
    drawGraph();
  }

  function renderFormulaSteps(sol) {
    stepsFormulaContainer.innerHTML = '';
    const steps = sol.methods.quadraticFormula || [];
    steps.forEach((step, idx) => {
      const item = document.createElement('div');
      item.className = 'step-card';
      item.innerHTML = `
        <div class="step-number">${idx + 1}</div>
        <div class="step-content">
          <div class="step-math">${escapeHtml(step)}</div>
        </div>
      `;
      stepsFormulaContainer.appendChild(item);
    });
  }

  function renderSquareSteps(sol) {
    stepsSquareContainer.innerHTML = '';
    const steps = sol.methods.completingSquare || [];
    steps.forEach((step, idx) => {
      const item = document.createElement('div');
      item.className = 'step-card';
      item.innerHTML = `
        <div class="step-number">${idx + 1}</div>
        <div class="step-content">
          <div class="step-math">${escapeHtml(step)}</div>
        </div>
      `;
      stepsSquareContainer.appendChild(item);
    });
  }

  function renderFactoringSteps(sol) {
    stepsFactoringContainer.innerHTML = '';
    const factoring = sol.methods.factoring;
    const vertexSteps = sol.methods.vertexForm || [];

    // Factoring card
    if (factoring) {
      const fCard = document.createElement('div');
      fCard.className = 'step-card';
      fCard.innerHTML = `
        <div class="step-number">F</div>
        <div class="step-content">
          <div class="step-title">Factored Form Analysis</div>
          ${factoring.steps.map(s => `<div class="step-math">${escapeHtml(s)}</div>`).join('')}
        </div>
      `;
      stepsFactoringContainer.appendChild(fCard);
    }

    // Vertex form card
    if (vertexSteps.length > 0) {
      const vCard = document.createElement('div');
      vCard.className = 'step-card';
      vCard.innerHTML = `
        <div class="step-number">V</div>
        <div class="step-content">
          <div class="step-title">Vertex Form Derivation [y = a(x - h)² + k]</div>
          ${vertexSteps.map(s => `<div class="step-math">${escapeHtml(s)}</div>`).join('')}
        </div>
      `;
      stepsFactoringContainer.appendChild(vCard);
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // --- Auto-fit Canvas Viewport ---
  function autoFitView(a, b, c) {
    if (a !== 0) {
      const h = -b / (2 * a);
      const k = c - (b * b) / (4 * a);
      view.centerX = h;
      view.centerY = k / 2; // Center between vertex and x-axis
      view.scale = 26;
    } else {
      view.centerX = 0;
      view.centerY = 0;
      view.scale = 28;
    }
  }

  // --- Canvas Graphing Engine ---
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    drawGraph();
  }

  window.addEventListener('resize', resizeCanvas);

  function toScreenX(x) {
    const width = canvas.getBoundingClientRect().width;
    return width / 2 + (x - view.centerX) * view.scale;
  }

  function toScreenY(y) {
    const height = canvas.getBoundingClientRect().height;
    return height / 2 - (y - view.centerY) * view.scale;
  }

  function toMathX(px) {
    const width = canvas.getBoundingClientRect().width;
    return (px - width / 2) / view.scale + view.centerX;
  }

  function toMathY(py) {
    const height = canvas.getBoundingClientRect().height;
    return (height / 2 - py) / view.scale + view.centerY;
  }

  function drawGraph() {
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const bgCol = isLight ? '#f1f5f9' : '#0f172a';
    const gridMajor = isLight ? '#cbd5e1' : '#334155';
    const gridMinor = isLight ? '#e2e8f0' : '#1e293b';
    const axisCol = isLight ? '#475569' : '#94a3b8';
    const textCol = isLight ? '#64748b' : '#64748b';

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, w, h);

    // Calculate grid spacing
    let step = 1;
    if (view.scale < 12) step = 5;
    else if (view.scale < 20) step = 2;
    else if (view.scale > 80) step = 0.5;

    const minX = toMathX(0);
    const maxX = toMathX(w);
    const minY = toMathY(h);
    const maxY = toMathY(0);

    // Minor/Major Grid Lines
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const startX = Math.floor(minX / step) * step;
    for (let x = startX; x <= maxX; x += step) {
      const sx = toScreenX(x);
      ctx.strokeStyle = Math.abs(x) < 1e-9 ? axisCol : (Math.round(x / step) % 2 === 0 ? gridMajor : gridMinor);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();

      if (Math.abs(x) > 1e-9 && view.scale > 14) {
        ctx.fillStyle = textCol;
        ctx.fillText(QuadraticCore.formatNum(x, 2), sx, Math.min(Math.max(toScreenY(0) + 4, 10), h - 18));
      }
    }

    const startY = Math.floor(minY / step) * step;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = startY; y <= maxY; y += step) {
      const sy = toScreenY(y);
      ctx.strokeStyle = Math.abs(y) < 1e-9 ? axisCol : (Math.round(y / step) % 2 === 0 ? gridMajor : gridMinor);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();

      if (Math.abs(y) > 1e-9 && view.scale > 14) {
        ctx.fillStyle = textCol;
        ctx.fillText(QuadraticCore.formatNum(y, 2), Math.min(Math.max(toScreenX(0) - 6, 26), w - 8), sy);
      }
    }

    // Origin Axes
    const origX = toScreenX(0);
    const origY = toScreenY(0);

    ctx.strokeStyle = axisCol;
    ctx.lineWidth = 2;
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, origY);
    ctx.lineTo(w, origY);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(origX, 0);
    ctx.lineTo(origX, h);
    ctx.stroke();

    if (!currentSolution) return;
    const { a, b, c } = currentSolution.inputs;

    // Draw Axis of Symmetry
    if (a !== 0 && currentSolution.vertex) {
      const symX = toScreenX(currentSolution.vertex.x);
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(symX, 0);
      ctx.lineTo(symX, h);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Directrix Line
    if (a !== 0 && currentSolution.directrix) {
      const dirYVal = currentSolution.vertex.y - (1 / (4 * a));
      const dirY = toScreenY(dirYVal);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, dirY);
      ctx.lineTo(w, dirY);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Parabola Curve
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = isLight ? '#4f46e5' : '#818cf8';
    ctx.lineWidth = 3;

    let started = false;
    for (let px = 0; px <= w; px += 2) {
      const mx = toMathX(px);
      const my = (a * mx * mx) + (b * mx) + c;
      const py = toScreenY(my);

      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Draw Key Points
    // 1. Vertex Point
    if (a !== 0 && currentSolution.vertex) {
      const vx = toScreenX(currentSolution.vertex.x);
      const vy = toScreenY(currentSolution.vertex.y);
      drawPoint(vx, vy, '#f59e0b', `Vertex (${QuadraticCore.formatNum(currentSolution.vertex.x)}, ${QuadraticCore.formatNum(currentSolution.vertex.y)})`);
    }

    // 2. Y-Intercept Point
    const yIntX = toScreenX(0);
    const yIntY = toScreenY(c);
    drawPoint(yIntX, yIntY, '#06b6d4', `Y-Int (0, ${QuadraticCore.formatNum(c)})`);

    // 3. Real Root Points
    if (currentSolution.roots && currentSolution.roots.length > 0) {
      currentSolution.roots.forEach(root => {
        if (root.imag === 0) {
          const rx = toScreenX(root.real);
          const ry = toScreenY(0);
          drawPoint(rx, ry, '#10b981', `Root (${QuadraticCore.formatNum(root.real)}, 0)`);
        }
      });
    }

    // 4. Focus Point
    if (a !== 0 && currentSolution.focus) {
      const fx = toScreenX(currentSolution.focus.x);
      const fy = toScreenY(currentSolution.focus.y);
      drawDiamond(fx, fy, '#ec4899', 'Focus');
    }
  }

  function drawPoint(x, y, color, label) {
    if (x < -20 || x > canvas.width + 20 || y < -20 || y > canvas.height + 20) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Small label tag
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(label, x + 8, y - 8);
    ctx.restore();
  }

  function drawDiamond(x, y, color, label) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x + 6, y);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x - 6, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText(label, x + 8, y + 4);
    ctx.restore();
  }

  // --- Graph Interaction: Panning & Zooming ---
  canvas.addEventListener('mousedown', (e) => {
    view.isDragging = true;
    view.dragStartX = e.clientX;
    view.dragStartY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', () => {
    view.isDragging = false;
    canvas.style.cursor = 'crosshair';
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (view.isDragging) {
      const dx = (e.clientX - view.dragStartX) / view.scale;
      const dy = (e.clientY - view.dragStartY) / view.scale;
      view.centerX -= dx;
      view.centerY += dy;
      view.dragStartX = e.clientX;
      view.dragStartY = e.clientY;
      drawGraph();
      graphTooltip.style.display = 'none';
      return;
    }

    // Hover tooltip along curve
    if (currentSolution) {
      const mx = toMathX(mouseX);
      const { a, b, c } = currentSolution.inputs;
      const my = (a * mx * mx) + (b * mx) + c;
      const curveY = toScreenY(my);

      if (Math.abs(mouseY - curveY) < 25) {
        graphTooltip.style.display = 'block';
        graphTooltip.style.left = `${mouseX + 12}px`;
        graphTooltip.style.top = `${curveY - 24}px`;
        graphTooltip.textContent = `x: ${QuadraticCore.formatNum(mx, 2)}, y: ${QuadraticCore.formatNum(my, 2)}`;
      } else {
        graphTooltip.style.display = 'none';
      }
    }
  });

  canvas.addEventListener('mouseleave', () => {
    graphTooltip.style.display = 'none';
  });

  // Mouse wheel zoom
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const mathX = toMathX(mouseX);
    const mathY = toMathY(mouseY);

    view.scale = Math.max(5, Math.min(300, view.scale * zoomFactor));

    // Keep point under cursor invariant
    view.centerX = mathX - (mouseX - rect.width / 2) / view.scale;
    view.centerY = mathY + (mouseY - rect.height / 2) / view.scale;

    drawGraph();
  }, { passive: false });

  btnZoomIn.addEventListener('click', () => {
    view.scale = Math.min(300, view.scale * 1.25);
    drawGraph();
  });

  btnZoomOut.addEventListener('click', () => {
    view.scale = Math.max(5, view.scale * 0.8);
    drawGraph();
  });

  btnResetView.addEventListener('click', () => {
    if (currentSolution) {
      const { a, b, c } = currentSolution.inputs;
      autoFitView(a, b, c);
      drawGraph();
    }
  });

  // --- Tabs Switcher ---
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      document.getElementById(targetId).classList.add('active');
    });
  });

  // --- Buttons: Random, Reset, Copy ---
  btnRandom.addEventListener('click', () => {
    const a = (Math.floor(Math.random() * 9) - 4) || 1;
    const b = Math.floor(Math.random() * 15) - 7;
    const c = Math.floor(Math.random() * 15) - 7;

    inputA.value = a;
    inputB.value = b;
    inputC.value = c;
    sliderA.value = a;
    sliderB.value = b;
    sliderC.value = c;

    autoFitView(a, b, c);
    solveAndUpdate(a, b, c);
  });

  btnReset.addEventListener('click', () => {
    inputA.value = 1;
    inputB.value = -5;
    inputC.value = 6;
    sliderA.value = 1;
    sliderB.value = -5;
    sliderC.value = 6;

    autoFitView(1, -5, 6);
    solveAndUpdate(1, -5, 6);
  });

  btnCopyLatex.addEventListener('click', () => {
    if (!currentSolution) return;
    const latex = `\\[ ${currentSolution.equationString.replace('x²', 'x^2')} \\implies x = ${currentSolution.exactRoots.join(' \\quad ')} \\]`;
    navigator.clipboard.writeText(latex).then(() => {
      const originalText = btnCopyLatex.innerHTML;
      btnCopyLatex.innerHTML = '✔ Copied LaTeX!';
      setTimeout(() => { btnCopyLatex.innerHTML = originalText; }, 1800);
    });
  });

  // --- History Management ---
  function addToHistory(sol) {
    // Avoid duplicate top
    if (historyData.length > 0 && historyData[0].equation === sol.equationString) return;

    historyData.unshift({
      a: sol.inputs.a,
      b: sol.inputs.b,
      c: sol.inputs.c,
      equation: sol.equationString,
      roots: sol.exactRoots.join(', ') || sol.natureOfRoots,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    if (historyData.length > 15) historyData.pop();

    try {
      localStorage.setItem('qlab_history', JSON.stringify(historyData));
    } catch (e) {}

    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    if (historyData.length === 0) {
      historyList.innerHTML = '<div style="color:var(--text-dim); font-size:0.85rem;">No recently solved equations yet.</div>';
      return;
    }

    historyData.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.innerHTML = `
        <div>
          <div class="history-eq">${escapeHtml(item.equation)}</div>
          <div class="history-roots">${escapeHtml(item.roots)} <span style="color:var(--text-dim); margin-left:8px;">[${item.timestamp}]</span></div>
        </div>
        <button class="history-action-btn" data-index="${idx}">Load</button>
      `;

      el.querySelector('.history-action-btn').addEventListener('click', () => {
        inputA.value = item.a;
        inputB.value = item.b;
        inputC.value = item.c;
        sliderA.value = item.a;
        sliderB.value = item.b;
        sliderC.value = item.c;
        autoFitView(item.a, item.b, item.c);
        solveAndUpdate(item.a, item.b, item.c, false);
      });

      historyList.appendChild(el);
    });
  }

  btnClearHistory.addEventListener('click', () => {
    historyData = [];
    localStorage.removeItem('qlab_history');
    renderHistory();
  });

  // --- Practice Quiz Engine ---
  function loadNewQuiz() {
    const diff = quizDiffSelect.value;
    quizCurrent = QuadraticCore.generateProblem(diff);
    quizEquation.textContent = quizCurrent.equation;
    quizAnsD.value = '';
    quizAnsX1.value = '';
    quizAnsX2.value = '';
    quizFeedback.style.display = 'none';
  }

  btnNewQuiz.addEventListener('click', loadNewQuiz);
  quizDiffSelect.addEventListener('change', loadNewQuiz);

  btnQuizHint.addEventListener('click', () => {
    if (!quizCurrent) return;
    const sol = quizCurrent.solution;
    quizFeedback.className = 'quiz-feedback feedback-success';
    quizFeedback.style.display = 'block';
    quizFeedback.innerHTML = `Hint: The discriminant formula is Δ = b² - 4ac = (${quizCurrent.b})² - 4(${quizCurrent.a})(${quizCurrent.c}) = <strong>${sol.discriminant}</strong>.`;
  });

  btnCheckQuiz.addEventListener('click', () => {
    if (!quizCurrent) return;
    const sol = quizCurrent.solution;
    const userD = parseFloat(quizAnsD.value.trim());

    if (isNaN(userD)) {
      quizFeedback.className = 'quiz-feedback feedback-error';
      quizFeedback.style.display = 'block';
      quizFeedback.textContent = 'Please enter at least the discriminant Δ to check!';
      return;
    }

    const dCorrect = Math.abs(userD - sol.discriminant) < 1e-4;

    if (dCorrect) {
      quizStreak++;
      quizStreakEl.textContent = `Streak: ${quizStreak} 🔥`;
      quizFeedback.className = 'quiz-feedback feedback-success';
      quizFeedback.style.display = 'block';
      quizFeedback.innerHTML = `
        🎉 Correct! Discriminant Δ = ${sol.discriminant}.<br>
        Exact Roots: <strong>${sol.exactRoots.join(' &nbsp;|&nbsp; ')}</strong>
      `;
    } else {
      quizStreak = 0;
      quizStreakEl.textContent = `Streak: 0`;
      quizFeedback.className = 'quiz-feedback feedback-error';
      quizFeedback.style.display = 'block';
      quizFeedback.innerHTML = `
        Incorrect discriminant. Expected Δ = <strong>${sol.discriminant}</strong>.<br>
        Exact Roots: ${sol.exactRoots.join(' &nbsp;|&nbsp; ')}
      `;
    }
  });

  // --- Initial Launch ---
  renderHistory();
  resizeCanvas();
  solveAndUpdate(1, -5, 6, false);
  loadNewQuiz();
});

