# QuadraticLab — Advanced Quadratic Equation Solver & Visualizer

A modern, high-performance, and mathematically rigorous coding project for solving, exploring, and visualizing quadratic equations ($ax^2 + bx + c = 0$).

Featuring **exact radical arithmetic**, **step-by-step algebraic derivations**, an **interactive HTML5 Canvas parabola plotter**, a **terminal CLI tool**, and a **34-case automated test suite**.

---

## 🌟 Key Features

### 1. Dual Interface: Web App & Terminal CLI
- **Web App**:
  - Live equation preview with synchronous inputs and sliders.
  - Interactive HTML5 Canvas Cartesian plane with dynamic zooming, panning, and coordinate hover tooltips.
  - Real-time plotting of the parabola curve, roots, vertex $(h, k)$, y-intercept, axis of symmetry, focus, and directrix.
  - Quick presets for classic cases (real distinct, double root, complex roots, irrational roots, concave down, pure quadratic, linear).
  - Dark and Light mode themes with local persistence.
  - History tracking saved to `localStorage`.
- **Terminal CLI**:
  - Direct execution via CLI arguments: `node solver-cli.js 1 -5 6`.
  - Interactive terminal prompt with formatted box styling and color-coded mathematical steps.
  - Built-in command-line quiz mode: `node solver-cli.js --quiz`.

### 2. Rigorous Mathematical Engine (`solver-core.js`)
- **Exact Radical Simplification**: Reduces $\sqrt{\Delta}$ into $k\sqrt{m}$ form (e.g. $\sqrt{12} \to 2\sqrt{3}$) and simplifies fractions with GCD reductions.
- **Full Support for All Root Classes**:
  - $\Delta > 0$: Two distinct real roots (exact radical and decimal approximation).
  - $\Delta = 0$: Exactly one real double root (multiplicity 2).
  - $\Delta < 0$: Two complex conjugate roots ($u \pm vi$).
- **Numerical Stability**: Prevents floating-point catastrophic cancellation when $b^2 \gg 4ac$ by employing Citardauq / Muller stable root formulation.
- **Multiple Solving Methods**:
  1. **Quadratic Formula**: Full substitution, discriminant evaluation, and branch calculation.
  2. **Completing the Square**: Monic division, constant relocation, $(b/2a)^2$ addition, binomial square factorization, and square root extraction.
  3. **Factoring**: Computes rational linear factors $(px + q)(rx + s) = 0$ when roots are rational.
  4. **Vertex Form**: Converts $y = ax^2 + bx + c$ into $y = a(x - h)^2 + k$.
- **Edge Cases Handled Gracefully**:
  - $a = 0, b \neq 0$: Linear equation $bx + c = 0 \implies x = -c/b$.
  - $a = 0, b = 0, c = 0$: Identity (infinitely many solutions).
  - $a = 0, b = 0, c \neq 0$: Contradiction (no solution).

### 3. Practice & Quiz Mode
- Generates randomized quadratic equations categorized by difficulty (Easy, Medium, Hard).
- Tests understanding of the discriminant $\Delta$ and roots.
- Provides immediate feedback, mathematical hints, and streak tracking.

---

## 📁 Project Structure

```
quadratic-solver/
├── solver-core.js     # Universal mathematical core (exact radicals, step generator, geometry)
├── index.html          # Web UI with responsive glassmorphic cards and tabs
├── style.css           # Modern CSS variables, dark/light theme, custom sliders
├── app.js              # Canvas graph rendering, event handlers, quiz engine, history
├── solver-cli.js       # Interactive & direct command-line interface
├── test.js             # Automated unit test suite (34 assertions)
├── server.js           # Lightweight zero-dependency local static HTTP server
├── package.json        # NPM scripts and project metadata
└── README.md           # Documentation and mathematical manual
```

---

## 🚀 Quick Start Guide

### Option A: Launch Web Application

You can open `index.html` directly in any web browser, or launch the included zero-dependency server:

```powershell
# From the quadratic-solver directory:
node server.js
```

Then visit [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option B: Run the Terminal CLI

#### 1. Direct Argument Mode
```powershell
node solver-cli.js 1 -5 6
```
Output:
```text
  Equation:  x² - 5x + 6 = 0
  Type:      Quadratic Equation (Degree 2)
  Discriminant (Δ): 1 (Two distinct real roots (Δ > 0))

  ROOTS (SOLUTIONS):
    Root 1: x₁ = 2
    Root 2: x₂ = 3

  PARABOLA PROPERTIES:
    Opening:          Upward (Convex)
    Vertex (h, k):    (2.5, -0.25)
    Axis of Symmetry: x = 2.5
    Y-Intercept:      (0, 6)
```

#### 2. Interactive Mode
```powershell
node solver-cli.js
```
Follow the interactive prompts to enter $a$, $b$, and $c$.

#### 3. Terminal Practice Quiz
```powershell
node solver-cli.js --quiz
```

---

### Option C: Run Unit Tests

Execute the automated test suite verifying 34 assertions across all mathematical conditions:

```powershell
node test.js
# or
npm test
```

---

## 📐 Mathematical Reference

| Concept | Formula |
| :--- | :--- |
| **Standard Form** | $ax^2 + bx + c = 0$ |
| **Discriminant** | $\Delta = b^2 - 4ac$ |
| **Quadratic Formula** | $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ |
| **Vertex Coordinates** | $(h, k) = \left(-\frac{b}{2a}, c - \frac{b^2}{4a}\right)$ |
| **Axis of Symmetry** | $x = -\frac{b}{2a}$ |
| **Focus** | $\left(h, k + \frac{1}{4a}\right)$ |
| **Directrix** | $y = k - \frac{1}{4a}$ |
| **Stable Root (Citardauq)** | $q = -\frac{1}{2}\left(b + \text{sgn}(b)\sqrt{\Delta}\right), \quad x_1 = \frac{q}{a}, \quad x_2 = \frac{c}{q}$ |

---

## 📄 License
MIT License. Free to use, modify, and distribute.

