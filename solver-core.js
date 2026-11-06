/**
 * Quadratic Equation Solver - Core Engine
 * Handles exact radical arithmetic, step-by-step algebraic derivations,
 * multiple solution methods, and geometric parabola analysis.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QuadraticCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // Greatest common divisor (Euclidean algorithm)
  function gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  // Simplify fraction num/den
  function simplifyFraction(num, den) {
    if (den === 0) return { num, den };
    if (den < 0) {
      num = -num;
      den = -den;
    }
    const g = gcd(num, den);
    return {
      num: num / g,
      den: den / g,
      toString: function () {
        if (this.den === 1) return `${this.num}`;
        return `${this.num}/${this.den}`;
      }
    };
  }

  // Simplify radical sqrt(n) for integer n >= 0 into outside * sqrt(inside)
  function simplifyRadical(n) {
    n = Math.round(n);
    if (n < 0) return { outside: 1, inside: n, isReal: false };
    if (n === 0) return { outside: 0, inside: 0, isReal: true };

    let outside = 1;
    let inside = n;

    for (let factor = 2; factor * factor <= inside; factor++) {
      while (inside % (factor * factor) === 0) {
        outside *= factor;
        inside /= (factor * factor);
      }
    }
    return { outside, inside, isReal: true };
  }

  // Format numbers cleanly (trim trailing zeros)
  function formatNum(val, precision = 4) {
    if (typeof val !== 'number' || isNaN(val)) return 'NaN';
    if (!isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';
    // If it is virtually an integer
    if (Math.abs(val - Math.round(val)) < 1e-9) {
      return Math.round(val).toString();
    }
    const fixed = val.toFixed(precision);
    return parseFloat(fixed).toString();
  }

  // Format quadratic equation string: ax^2 + bx + c = 0
  function formatEquation(a, b, c) {
    let parts = [];
    if (a !== 0) {
      if (a === 1) parts.push('x²');
      else if (a === -1) parts.push('-x²');
      else parts.push(`${formatNum(a)}x²`);
    }

    if (b !== 0) {
      const sign = b > 0 ? (parts.length > 0 ? '+ ' : '') : '- ';
      const absB = Math.abs(b);
      const bStr = absB === 1 ? 'x' : `${formatNum(absB)}x`;
      parts.push(`${sign}${bStr}`);
    }

    if (c !== 0 || parts.length === 0) {
      if (parts.length === 0) {
        parts.push(formatNum(c));
      } else {
        const sign = c > 0 ? '+ ' : '- ';
        parts.push(`${sign}${formatNum(Math.abs(c))}`);
      }
    }

    return parts.join(' ') + ' = 0';
  }

  // Check if all inputs are integers
  function areIntegers(...nums) {
    return nums.every(n => Number.isInteger(n));
  }

  /**
   * Main solve function
   * @param {number} a 
   * @param {number} b 
   * @param {number} c 
   * @returns {object} Full solution report
   */
  function solve(a, b, c) {
    a = Number(a);
    b = Number(b);
    c = Number(c);

    const report = {
      inputs: { a, b, c },
      equationString: formatEquation(a, b, c),
      isQuadratic: a !== 0,
      classification: '',
      discriminant: null,
      roots: [],
      exactRoots: [],
      natureOfRoots: '',
      vertex: null,
      axisOfSymmetry: null,
      yIntercept: { x: 0, y: c },
      opens: '',
      extrema: '',
      focus: null,
      directrix: null,
      methods: {
        quadraticFormula: [],
        completingSquare: [],
        factoring: null,
        vertexForm: []
      },
      warning: null
    };

    // Edge Case: a = 0 (Linear or Degenerate)
    if (a === 0) {
      if (b === 0) {
        if (c === 0) {
          report.classification = 'Identity (Infinitely many solutions)';
          report.natureOfRoots = 'Any real number is a solution (0 = 0).';
          report.methods.quadraticFormula = [
            'Notice that coefficient a = 0 and b = 0.',
            `The equation reduces to: ${c} = 0, which is always true.`,
            'Conclusion: Infinitely many solutions (all real numbers).'
          ];
        } else {
          report.classification = 'Contradiction (No solution)';
          report.natureOfRoots = `No solution (${c} = 0 is impossible).`;
          report.methods.quadraticFormula = [
            'Notice that coefficient a = 0 and b = 0.',
            `The equation reduces to: ${c} = 0, which is a mathematical contradiction.`,
            'Conclusion: No solution exists.'
          ];
        }
      } else {
        // Linear equation: bx + c = 0 => x = -c/b
        const rootVal = -c / b;
        report.classification = 'Linear Equation (Degree 1)';
        report.natureOfRoots = 'One real linear solution (since a = 0).';
        report.roots = [{ real: rootVal, imag: 0, text: `x = ${formatNum(rootVal)}` }];
        
        let exactText = `x = ${formatNum(rootVal)}`;
        if (areIntegers(b, c)) {
          const frac = simplifyFraction(-c, b);
          exactText = `x = ${frac.toString()}`;
        }
        report.exactRoots = [exactText];
        report.methods.quadraticFormula = [
          'Because coefficient a = 0, this is a linear equation: bx + c = 0.',
          `Substitute values: (${b})x + (${c}) = 0`,
          `Subtract ${c} from both sides: (${b})x = ${-c}`,
          `Divide by ${b}: x = ${exactText} ≈ ${formatNum(rootVal)}`
        ];
      }
      return report;
    }

    // Standard Quadratic Analysis
    report.classification = 'Quadratic Equation (Degree 2)';
    report.opens = a > 0 ? 'Upward (Convex)' : 'Downward (Concave)';
    
    // Parabola Vertex: h = -b / (2a), k = c - b^2 / (4a)
    const h = -b / (2 * a);
    const k = c - (b * b) / (4 * a);
    report.vertex = { x: h, y: k };
    report.axisOfSymmetry = `x = ${formatNum(h)}`;
    report.extrema = a > 0 ? `Minimum value y = ${formatNum(k)} at x = ${formatNum(h)}`
                           : `Maximum value y = ${formatNum(k)} at x = ${formatNum(h)}`;

    // Parabola Geometric Focus and Directrix
    const focalLength = 1 / (4 * a);
    report.focus = { x: h, y: k + focalLength };
    report.directrix = `y = ${formatNum(k - focalLength)}`;

    // Discriminant Delta = b^2 - 4ac
    const delta = (b * b) - (4 * a * c);
    report.discriminant = delta;

    // --- STEP-BY-STEP QUADRATIC FORMULA ---
    const qfSteps = [];
    qfSteps.push(`Standard Form: ax² + bx + c = 0 with a = ${a}, b = ${b}, c = ${c}`);
    qfSteps.push(`Step 1: Compute the Discriminant Δ = b² - 4ac`);
    qfSteps.push(`   Δ = (${b})² - 4(${a})(${c})`);
    qfSteps.push(`   Δ = ${b * b} - (${4 * a * c})`);
    qfSteps.push(`   Δ = ${formatNum(delta)}`);

    const denom = 2 * a;
    const minusB = -b;

    if (delta > 0) {
      report.natureOfRoots = 'Two distinct real roots (Δ > 0)';
      const sqrtDelta = Math.sqrt(delta);

      // Numerically stable evaluation:
      // Citardauq / Muller formula prevents catastrophic cancellation when b^2 >> 4ac
      let x1, x2;
      const signB = b >= 0 ? 1 : -1;
      const q = -0.5 * (b + signB * sqrtDelta);
      x1 = q / a;
      x2 = c / q;
      // Sort in ascending order
      if (x1 > x2) {
        const tmp = x1;
        x1 = x2;
        x2 = tmp;
      }

      report.roots = [
        { real: x1, imag: 0, text: `x₁ = ${formatNum(x1)}` },
        { real: x2, imag: 0, text: `x₂ = ${formatNum(x2)}` }
      ];

      // Exact Radical Representation
      let exactRoot1 = `x₁ = ${formatNum(x1)}`;
      let exactRoot2 = `x₂ = ${formatNum(x2)}`;

      if (areIntegers(a, b, c)) {
        const rad = simplifyRadical(delta);
        if (rad.inside === 0 || rad.inside === 1) {
          // Perfect square
          const r1 = simplifyFraction(minusB - rad.outside, denom);
          const r2 = simplifyFraction(minusB + rad.outside, denom);
          exactRoot1 = `x₁ = ${r1.toString()}`;
          exactRoot2 = `x₂ = ${r2.toString()}`;
        } else {
          // Irreducible radical
          const g = gcd(Math.abs(minusB), gcd(rad.outside, Math.abs(denom)));
          const signDen = denom < 0 ? -1 : 1;
          const redB = (minusB / g) * signDen;
          const redOut = (rad.outside / g) * signDen;
          const redDen = Math.abs(denom / g);

          const radPart = Math.abs(redOut) === 1 ? `√${rad.inside}` : `${Math.abs(redOut)}√${rad.inside}`;
          if (redDen === 1) {
            exactRoot1 = `x₁ = ${redB} - ${radPart}`;
            exactRoot2 = `x₂ = ${redB} + ${radPart}`;
          } else {
            exactRoot1 = `x₁ = (${redB} - ${radPart}) / ${redDen}`;
            exactRoot2 = `x₂ = (${redB} + ${radPart}) / ${redDen}`;
          }
        }
      }

      report.exactRoots = [exactRoot1, exactRoot2];

      qfSteps.push(`Step 2: Apply Quadratic Formula: x = [-b ± √Δ] / (2a)`);
      qfSteps.push(`   x = [-(${b}) ± √(${formatNum(delta)})] / (2 · ${a})`);
      qfSteps.push(`   x = [${minusB} ± ${formatNum(sqrtDelta)}] / ${denom}`);
      qfSteps.push(`Step 3: Calculate individual roots`);
      qfSteps.push(`   x₁ = (${minusB} - ${formatNum(sqrtDelta)}) / ${denom} = ${formatNum(x1)} [Exact: ${exactRoot1.replace('x₁ = ', '')}]`);
      qfSteps.push(`   x₂ = (${minusB} + ${formatNum(sqrtDelta)}) / ${denom} = ${formatNum(x2)} [Exact: ${exactRoot2.replace('x₂ = ', '')}]`);

    } else if (delta === 0) {
      report.natureOfRoots = 'One real double root (Δ = 0)';
      const rootVal = minusB / denom;
      report.roots = [
        { real: rootVal, imag: 0, text: `x = ${formatNum(rootVal)} (multiplicity 2)` }
      ];

      let exactRoot = `x = ${formatNum(rootVal)}`;
      if (areIntegers(a, b)) {
        const frac = simplifyFraction(minusB, denom);
        exactRoot = `x = ${frac.toString()}`;
      }
      report.exactRoots = [exactRoot];

      qfSteps.push(`Step 2: Since Δ = 0, the equation has one repeated real root:`);
      qfSteps.push(`   x = -b / (2a)`);
      qfSteps.push(`   x = -(${b}) / (2 · ${a}) = ${minusB} / ${denom}`);
      qfSteps.push(`   x = ${exactRoot.replace('x = ', '')} ≈ ${formatNum(rootVal)}`);

    } else {
      // delta < 0 : Complex Roots
      report.natureOfRoots = 'Two complex conjugate roots (Δ < 0)';
      const absDelta = Math.abs(delta);
      const sqrtAbsDelta = Math.sqrt(absDelta);
      const realPart = minusB / denom;
      const imagPart = Math.abs(sqrtAbsDelta / denom);

      report.roots = [
        { real: realPart, imag: -imagPart, text: `x₁ = ${formatNum(realPart)} - ${formatNum(imagPart)}i` },
        { real: realPart, imag: imagPart, text: `x₂ = ${formatNum(realPart)} + ${formatNum(imagPart)}i` }
      ];

      let exactReal = formatNum(realPart);
      let exactImag = `${formatNum(imagPart)}i`;

      if (areIntegers(a, b, c)) {
        const rFrac = simplifyFraction(minusB, denom);
        exactReal = rFrac.toString();

        const rad = simplifyRadical(absDelta);
        if (rad.inside === 0 || rad.inside === 1) {
          const iFrac = simplifyFraction(rad.outside, Math.abs(denom));
          exactImag = iFrac.den === 1 ? (iFrac.num === 1 ? 'i' : `${iFrac.num}i`) : `${iFrac.num}i/${iFrac.den}`;
        } else {
          const g = gcd(rad.outside, Math.abs(denom));
          const redOut = rad.outside / g;
          const redDen = Math.abs(denom) / g;
          const radStr = redOut === 1 ? `√${rad.inside}` : `${redOut}√${rad.inside}`;
          exactImag = redDen === 1 ? `${radStr}i` : `(${radStr}i)/${redDen}`;
        }
      }

      const exactRoot1 = `x₁ = ${exactReal} - ${exactImag}`;
      const exactRoot2 = `x₂ = ${exactReal} + ${exactImag}`;
      report.exactRoots = [exactRoot1, exactRoot2];

      qfSteps.push(`Step 2: Since Δ < 0, there are no real roots. Use imaginary unit i = √(-1):`);
      qfSteps.push(`   x = [-(${b}) ± √(${formatNum(absDelta)})·i] / (2 · ${a})`);
      qfSteps.push(`   x = [${minusB} ± ${formatNum(sqrtAbsDelta)}i] / ${denom}`);
      qfSteps.push(`Step 3: Separate real and imaginary components:`);
      qfSteps.push(`   Real Part: -b/(2a) = ${minusB}/${denom} = ${formatNum(realPart)}`);
      qfSteps.push(`   Imaginary Part: √(4ac - b²)/(2a) = ${formatNum(imagPart)}`);
      qfSteps.push(`   x₁ = ${formatNum(realPart)} - ${formatNum(imagPart)}i  [Exact: ${exactRoot1.replace('x₁ = ', '')}]`);
      qfSteps.push(`   x₂ = ${formatNum(realPart)} + ${formatNum(imagPart)}i  [Exact: ${exactRoot2.replace('x₂ = ', '')}]`);
    }

    report.methods.quadraticFormula = qfSteps;

    // --- STEP-BY-STEP COMPLETING THE SQUARE ---
    const csSteps = [];
    csSteps.push(`Original: ${formatEquation(a, b, c)}`);
    if (a !== 1) {
      csSteps.push(`Step 1: Divide entire equation by leading coefficient a = ${a}:`);
      const bOverA = b / a;
      const cOverA = c / a;
      csSteps.push(`   x² + (${formatNum(bOverA)})x + (${formatNum(cOverA)}) = 0`);
    } else {
      csSteps.push(`Step 1: Equation already in monic form (a = 1).`);
    }

    const bOverA = b / a;
    const cOverA = c / a;
    csSteps.push(`Step 2: Move constant term to right-hand side:`);
    csSteps.push(`   x² + (${formatNum(bOverA)})x = ${formatNum(-cOverA)}`);

    const halfB = bOverA / 2;
    const halfBSquared = halfB * halfB;
    csSteps.push(`Step 3: Calculate (b / 2a)² to complete square:`);
    csSteps.push(`   ( ${formatNum(bOverA)} / 2 )² = (${formatNum(halfB)})² = ${formatNum(halfBSquared)}`);

    csSteps.push(`Step 4: Add ${formatNum(halfBSquared)} to both sides:`);
    const rhs = -cOverA + halfBSquared;
    csSteps.push(`   x² + (${formatNum(bOverA)})x + ${formatNum(halfBSquared)} = ${formatNum(-cOverA)} + ${formatNum(halfBSquared)}`);
    csSteps.push(`   (x + ${formatNum(halfB)})² = ${formatNum(rhs)}`);

    if (rhs > 0) {
      const sqrtRhs = Math.sqrt(rhs);
      csSteps.push(`Step 5: Take square root of both sides:`);
      csSteps.push(`   x + ${formatNum(halfB)} = ± ${formatNum(sqrtRhs)}`);
      csSteps.push(`Step 6: Solve for x:`);
      csSteps.push(`   x = ${formatNum(-halfB)} ± ${formatNum(sqrtRhs)}`);
      csSteps.push(`   x₁ = ${formatNum(-halfB - sqrtRhs)},  x₂ = ${formatNum(-halfB + sqrtRhs)}`);
    } else if (Math.abs(rhs) < 1e-9) {
      csSteps.push(`Step 5: Since RHS = 0, take square root:`);
      csSteps.push(`   x + ${formatNum(halfB)} = 0  ==>  x = ${formatNum(-halfB)}`);
    } else {
      const sqrtAbsRhs = Math.sqrt(Math.abs(rhs));
      csSteps.push(`Step 5: Since RHS < 0, roots involve imaginary unit i:`);
      csSteps.push(`   x + ${formatNum(halfB)} = ± ${formatNum(sqrtAbsRhs)}i`);
      csSteps.push(`   x = ${formatNum(-halfB)} ± ${formatNum(sqrtAbsRhs)}i`);
    }
    report.methods.completingSquare = csSteps;

    // --- STEP-BY-STEP VERTEX FORM ---
    const vfSteps = [];
    vfSteps.push(`Vertex Form definition: y = a(x - h)² + k`);
    vfSteps.push(`1. Calculate h = -b / (2a) = -(${b}) / (2 · ${a}) = ${formatNum(h)}`);
    vfSteps.push(`2. Calculate k = f(h) = ${a}(${formatNum(h)})² + ${b}(${formatNum(h)}) + ${c} = ${formatNum(k)}`);
    const hSign = h >= 0 ? `- ${formatNum(h)}` : `+ ${formatNum(Math.abs(h))}`;
    const kSign = k >= 0 ? `+ ${formatNum(k)}` : `- ${formatNum(Math.abs(k))}`;
    const aPrefix = a === 1 ? '' : (a === -1 ? '-' : `${formatNum(a)}`);
    vfSteps.push(`3. Vertex Form: y = ${aPrefix}(x ${hSign})² ${kSign}`);
    vfSteps.push(`4. Vertex coordinates (h, k): (${formatNum(h)}, ${formatNum(k)})`);
    report.methods.vertexForm = vfSteps;

    // --- FACTORING METHOD (if rational roots) ---
    if (delta >= 0 && areIntegers(a, b, c)) {
      const rad = simplifyRadical(delta);
      if (rad.inside === 0 || rad.inside === 1) {
        // Delta is a perfect square, rational roots exist!
        // We find (p*x + q)(r*x + s) where p*r = a, q*s = c, p*s + q*r = b
        // roots are -q/p and -s/r
        const r1Frac = simplifyFraction(minusB - rad.outside, denom);
        const r2Frac = simplifyFraction(minusB + rad.outside, denom);

        // x = -r1Frac.num / r1Frac.den => (den * x - num) = 0
        let factor1 = formatFactor(r1Frac.den, -r1Frac.num);
        let factor2 = formatFactor(r2Frac.den, -r2Frac.num);

        // Product of leading factors might differ by scalar
        const leadProduct = r1Frac.den * r2Frac.den;
        const scalar = a / leadProduct;
        let scalarPrefix = '';
        if (Math.abs(scalar - 1) > 1e-9) {
          scalarPrefix = scalar === -1 ? '-' : `${formatNum(scalar)} `;
        }

        report.methods.factoring = {
          factorable: true,
          factoredForm: `${scalarPrefix}(${factor1})(${factor2}) = 0`,
          steps: [
            `Discriminant Δ = ${delta} is a perfect square (${rad.outside}²), indicating rational roots.`,
            `Roots found: x₁ = ${r1Frac.toString()} and x₂ = ${r2Frac.toString()}`,
            `Corresponding linear factors: (${factor1}) and (${factor2})`,
            `Factored form: ${scalarPrefix}(${factor1})(${factor2}) = 0`
          ]
        };
      } else {
        report.methods.factoring = {
          factorable: false,
          steps: [
            `Discriminant Δ = ${delta} is not a perfect square (√${delta} is irrational).`,
            `Therefore, this quadratic cannot be factored over integers or rational numbers.`
          ]
        };
      }
    } else {
      report.methods.factoring = {
        factorable: false,
        steps: [
          delta < 0
            ? `Discriminant Δ = ${delta} < 0. No real factors exist; requires complex numbers.`
            : `Coefficients are not all integers, so standard integer factoring does not apply.`
        ]
      };
    }

    return report;
  }

  function formatFactor(coef, constant) {
    let cPart = coef === 1 ? 'x' : (coef === -1 ? '-x' : `${coef}x`);
    if (constant === 0) return cPart;
    const sign = constant > 0 ? '+ ' : '- ';
    return `${cPart} ${sign}${Math.abs(constant)}`;
  }

  // Generate a random quadratic problem for quiz/practice
  function generateProblem(difficulty = 'easy') {
    let a = 1, b = 0, c = 0;
    if (difficulty === 'easy') {
      // Small integer roots, a = 1
      const r1 = Math.floor(Math.random() * 9) - 4; // -4 to 4
      const r2 = Math.floor(Math.random() * 9) - 4;
      a = 1;
      b = -(r1 + r2);
      c = r1 * r2;
    } else if (difficulty === 'medium') {
      // a can be 2 or -1 or 3, real rational or integer roots
      const possibleA = [1, 2, -1, 3];
      a = possibleA[Math.floor(Math.random() * possibleA.length)];
      const r1 = Math.floor(Math.random() * 11) - 5;
      const r2 = Math.floor(Math.random() * 11) - 5;
      b = -a * (r1 + r2);
      c = a * (r1 * r2);
    } else {
      // Hard: can have complex or irrational roots, varying coefficients
      a = (Math.floor(Math.random() * 7) - 3) || 2;
      b = Math.floor(Math.random() * 15) - 7;
      c = Math.floor(Math.random() * 15) - 7;
    }

    const solution = solve(a, b, c);
    return {
      a, b, c,
      equation: formatEquation(a, b, c),
      solution
    };
  }

  return {
    gcd,
    simplifyFraction,
    simplifyRadical,
    formatNum,
    formatEquation,
    solve,
    generateProblem
  };
});

