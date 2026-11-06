/**
 * Comprehensive Test Suite for Quadratic Equation Solver
 */

const { solve, gcd, simplifyRadical, simplifyFraction } = require('./solver-core');

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
  } else {
    console.error(`  \x1b[31m✘ FAIL:\x1b[0m ${message}`);
  }
}

function assertClose(actual, expected, message, eps = 1e-6) {
  totalCount++;
  const diff = Math.abs(actual - expected);
  if (diff <= eps) {
    passedCount++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
  } else {
    console.error(`  \x1b[31m✘ FAIL:\x1b[0m ${message} (Expected: ${expected}, Got: ${actual})`);
  }
}

console.log('\n--- Running Quadratic Solver Unit Tests ---\n');

// 1. Math Utility Tests
console.log('1. Math Utility Functions:');
assert(gcd(12, 18) === 6, 'gcd(12, 18) is 6');
assert(gcd(-24, 36) === 12, 'gcd(-24, 36) is 12');
const rad12 = simplifyRadical(12);
assert(rad12.outside === 2 && rad12.inside === 3, 'simplifyRadical(12) = 2√3');
const rad50 = simplifyRadical(50);
assert(rad50.outside === 5 && rad50.inside === 2, 'simplifyRadical(50) = 5√2');
const frac = simplifyFraction(14, 21);
assert(frac.num === 2 && frac.den === 3, 'simplifyFraction(14, 21) = 2/3');

// 2. Real Distinct Roots (x^2 - 5x + 6 = 0 => 2, 3)
console.log('\n2. Standard Two Real Roots (x² - 5x + 6 = 0):');
const res1 = solve(1, -5, 6);
assert(res1.discriminant === 1, 'Discriminant should be 1');
assert(res1.roots.length === 2, 'Should have 2 roots');
assertClose(res1.roots[0].real, 2, 'First root should be 2');
assertClose(res1.roots[1].real, 3, 'Second root should be 3');
assert(res1.methods.factoring && res1.methods.factoring.factorable, 'Should be factorable');

// 3. Real Double Root (x^2 - 4x + 4 = 0 => 2)
console.log('\n3. Real Double Root (x² - 4x + 4 = 0):');
const res2 = solve(1, -4, 4);
assert(res2.discriminant === 0, 'Discriminant should be 0');
assert(res2.roots.length === 1, 'Should have 1 repeated root');
assertClose(res2.roots[0].real, 2, 'Double root should be 2');
assert(res2.natureOfRoots.includes('double root'), 'Nature mentions double root');

// 4. Complex Roots (x^2 + 4x + 5 = 0 => -2 ± i)
console.log('\n4. Complex Roots (x² + 4x + 5 = 0):');
const res3 = solve(1, 4, 5);
assert(res3.discriminant === -4, 'Discriminant should be -4');
assert(res3.roots.length === 2, 'Should have 2 complex roots');
assertClose(res3.roots[0].real, -2, 'Real part is -2');
assertClose(Math.abs(res3.roots[0].imag), 1, 'Imaginary part magnitude is 1');
assert(res3.exactRoots[0].includes('i') && res3.exactRoots[1].includes('i'), 'Exact roots contain i');

// 5. Irrational Roots with Radical Simplification (x^2 - 4x + 1 = 0 => 2 ± √3)
console.log('\n5. Irrational Roots (x² - 4x + 1 = 0):');
const res4 = solve(1, -4, 1);
assert(res4.discriminant === 12, 'Discriminant should be 12');
assertClose(res4.roots[0].real, 2 - Math.sqrt(3), 'First root is 2 - √3');
assertClose(res4.roots[1].real, 2 + Math.sqrt(3), 'Second root is 2 + √3');
assert(res4.exactRoots[1].includes('√3'), 'Exact radical includes √3');

// 6. Negative Leading Coefficient (-2x^2 + 3x + 5 = 0)
console.log('\n6. Negative Leading Coefficient (-2x² + 3x + 5 = 0):');
const res5 = solve(-2, 3, 5);
assert(res5.opens.includes('Downward'), 'Parabola opens downward');
assertClose(res5.roots[0].real, -1, 'Root 1 is -1');
assertClose(res5.roots[1].real, 2.5, 'Root 2 is 2.5');

// 7. Edge Cases: Linear (a = 0, b = 4, c = -8 => x = 2)
console.log('\n7. Linear Edge Case (0x² + 4x - 8 = 0):');
const resLinear = solve(0, 4, -8);
assert(!resLinear.isQuadratic, 'isQuadratic should be false');
assertClose(resLinear.roots[0].real, 2, 'Linear solution should be 2');

// 8. Edge Cases: Degenerate (0 = 0 and 5 = 0)
console.log('\n8. Degenerate Edge Cases:');
const resIdentity = solve(0, 0, 0);
assert(resIdentity.classification.includes('Identity'), '0 = 0 is identity');
const resContradiction = solve(0, 0, 9);
assert(resContradiction.classification.includes('Contradiction'), '9 = 0 is contradiction');

// 9. Floating-point Stability (Catastrophic Cancellation test)
console.log('\n9. Numerical Stability (x² - 1000000x + 1 = 0):');
const resStable = solve(1, -1000000, 1);
// By standard formula: (1000000 - sqrt(10^12 - 4)) / 2 can lose precision if not careful!
// Product of roots is c/a = 1, so x1 * x2 must be 1.
const product = resStable.roots[0].real * resStable.roots[1].real;
assertClose(product, 1.0, 'Product of roots x1 * x2 should equal 1', 1e-4);

// 10. Geometric Properties (Vertex, Focus, Directrix)
console.log('\n10. Parabola Vertex & Geometry:');
const resGeom = solve(1, -6, 9); // y = (x - 3)^2
assertClose(resGeom.vertex.x, 3, 'Vertex x should be 3');
assertClose(resGeom.vertex.y, 0, 'Vertex y should be 0');
assert(resGeom.axisOfSymmetry === 'x = 3', 'Axis of symmetry is x = 3');

console.log(`\n========================================`);
console.log(`Test Summary: ${passedCount} / ${totalCount} tests passed.`);
console.log(`========================================\n`);

if (passedCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}

