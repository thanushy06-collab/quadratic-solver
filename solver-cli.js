#!/usr/bin/env node

/**
 * Quadratic Equation Solver - Interactive Terminal CLI
 * Usage:
 *   node solver-cli.js                     (Interactive Mode)
 *   node solver-cli.js 1 -5 6              (Direct Arguments: a b c)
 *   node solver-cli.js --quiz              (Practice Quiz Mode)
 */

const readline = require('readline');
const { solve, generateProblem, formatEquation } = require('./solver-core');

// ANSI Terminal Colors
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m'
};

function printBanner() {
  console.log(`
${C.cyan}${C.bright}=============================================================
           QUADRATIC EQUATION SOLVER & PARABOLA EXPLORER     
=============================================================${C.reset}
  Formula: ${C.yellow}ax² + bx + c = 0${C.reset}
  Roots:   ${C.yellow}x = [-b ± √(b² - 4ac)] / (2a)${C.reset}
`);
}

function displaySolution(solution) {
  const { a, b, c } = solution.inputs;
  console.log(`\n${C.bright}${C.cyan}─────────────────────────────────────────────────────────────${C.reset}`);
  console.log(`  ${C.bright}Equation:${C.reset}  ${C.yellow}${solution.equationString}${C.reset}`);
  console.log(`  ${C.bright}Type:${C.reset}      ${solution.classification}`);
  console.log(`${C.cyan}─────────────────────────────────────────────────────────────${C.reset}`);

  if (!solution.isQuadratic) {
    console.log(`\n${C.bright}Solution Details:${C.reset}`);
    solution.methods.quadraticFormula.forEach(step => console.log(`  ${C.dim}•${C.reset} ${step}`));
    if (solution.exactRoots.length > 0) {
      console.log(`\n  ${C.green}${C.bright}Result:${C.reset} ${solution.exactRoots.join(', ')}`);
    }
    return;
  }

  // Discriminant
  const d = solution.discriminant;
  const dColor = d > 0 ? C.green : (d === 0 ? C.yellow : C.magenta);
  console.log(`\n  ${C.bright}Discriminant (Δ):${C.reset} ${dColor}${d}${C.reset} (${solution.natureOfRoots})`);

  // Roots
  console.log(`\n  ${C.green}${C.bright}ROOTS (SOLUTIONS):${C.reset}`);
  if (solution.exactRoots.length === 1) {
    console.log(`    Double Root: ${C.green}${C.bright}${solution.exactRoots[0]}${C.reset}`);
  } else {
    solution.exactRoots.forEach((root, idx) => {
      const approx = solution.roots[idx] ? ` ≈ ${solution.roots[idx].text}` : '';
      console.log(`    Root ${idx + 1}: ${C.green}${C.bright}${root}${C.reset}${C.dim}${approx}${C.reset}`);
    });
  }

  // Parabola Geometry
  console.log(`\n  ${C.magenta}${C.bright}PARABOLA PROPERTIES:${C.reset}`);
  console.log(`    Opening:          ${solution.opens}`);
  console.log(`    Vertex (h, k):    (${solution.vertex.x}, ${solution.vertex.y})`);
  console.log(`    Axis of Symmetry: ${solution.axisOfSymmetry}`);
  console.log(`    Y-Intercept:      (0, ${solution.yIntercept.y})`);
  console.log(`    Extremum:         ${solution.extrema}`);
  if (solution.focus) {
    console.log(`    Focus:            (${solution.focus.x.toFixed(3)}, ${solution.focus.y.toFixed(3)})`);
    console.log(`    Directrix:        ${solution.directrix}`);
  }

  // Factored form if applicable
  if (solution.methods.factoring && solution.methods.factoring.factorable) {
    console.log(`\n  ${C.cyan}${C.bright}FACTORED FORM:${C.reset}`);
    console.log(`    ${C.bright}${solution.methods.factoring.factoredForm}${C.reset}`);
  }

  // Step-by-Step Breakdown
  console.log(`\n  ${C.yellow}${C.bright}STEP-BY-STEP DERIVATION (Quadratic Formula):${C.reset}`);
  solution.methods.quadraticFormula.forEach(step => {
    console.log(`    ${C.dim}│${C.reset} ${step}`);
  });

  console.log(`\n  ${C.yellow}${C.bright}COMPLETING THE SQUARE METHOD:${C.reset}`);
  solution.methods.completingSquare.forEach(step => {
    console.log(`    ${C.dim}│${C.reset} ${step}`);
  });
  console.log(`${C.cyan}─────────────────────────────────────────────────────────────${C.reset}\n`);
}

function runQuizMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n${C.yellow}${C.bright}=== PRACTICE QUIZ MODE ===${C.reset}`);
  console.log(`Test your quadratic solving skills! Press Ctrl+C at any time to exit.\n`);

  function askNext() {
    const prob = generateProblem('medium');
    console.log(`Problem: Find the roots of  ${C.cyan}${C.bright}${prob.equation}${C.reset}`);
    
    rl.question(`\nWhat is the discriminant Δ? `, (ansD) => {
      const parsedD = parseFloat(ansD.trim());
      if (Math.abs(parsedD - prob.solution.discriminant) < 1e-4) {
        console.log(`  ${C.green}✔ Correct! Δ = ${prob.solution.discriminant}${C.reset}`);
      } else {
        console.log(`  ${C.red}✘ Incorrect. The discriminant Δ = ${prob.solution.discriminant}${C.reset}`);
      }

      console.log(`\nRoots are:`);
      prob.solution.exactRoots.forEach(r => console.log(`  ${C.green}${r}${C.reset}`));

      rl.question(`\nSolve another problem? (y/n): `, (again) => {
        if (again.trim().toLowerCase().startsWith('y')) {
          console.log('\n----------------------------------------\n');
          askNext();
        } else {
          console.log('\nGreat job practicing! Exiting quiz mode.\n');
          rl.close();
        }
      });
    });
  }

  askNext();
}

function runInteractive() {
  printBanner();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function promptEquation() {
    console.log(`\nEnter coefficients for ${C.yellow}ax² + bx + c = 0${C.reset} (or type 'q' to quit, 'quiz' for practice):`);
    rl.question(`  Enter a: `, (aStr) => {
      if (aStr.trim().toLowerCase() === 'q') {
        console.log('\nGoodbye!\n');
        rl.close();
        return;
      }
      if (aStr.trim().toLowerCase() === 'quiz') {
        rl.close();
        runQuizMode();
        return;
      }

      rl.question(`  Enter b: `, (bStr) => {
        rl.question(`  Enter c: `, (cStr) => {
          const a = parseFloat(aStr.trim());
          const b = parseFloat(bStr.trim());
          const c = parseFloat(cStr.trim());

          if (isNaN(a) || isNaN(b) || isNaN(c)) {
            console.log(`\n  ${C.red}Error: All inputs must be valid numbers!${C.reset}`);
          } else {
            const sol = solve(a, b, c);
            displaySolution(sol);
          }

          rl.question(`Solve another equation? (Y/n): `, (ans) => {
            if (ans.trim().toLowerCase() === 'n') {
              console.log('\nThank you for using Quadratic Solver. Goodbye!\n');
              rl.close();
            } else {
              promptEquation();
            }
          });
        });
      });
    });
  }

  promptEquation();
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--quiz') || args.includes('-q')) {
  printBanner();
  runQuizMode();
} else if (args.length >= 3) {
  const a = parseFloat(args[0]);
  const b = parseFloat(args[1]);
  const c = parseFloat(args[2]);

  if (isNaN(a) || isNaN(b) || isNaN(c)) {
    console.error(`${C.red}Error: Arguments must be numbers (e.g. node solver-cli.js 1 -5 6)${C.reset}`);
    process.exit(1);
  }
  printBanner();
  const sol = solve(a, b, c);
  displaySolution(sol);
} else if (args.length > 0 && (args[0] === '--help' || args[0] === '-h')) {
  printBanner();
  console.log(`Usage:`);
  console.log(`  node solver-cli.js               Launch interactive prompt`);
  console.log(`  node solver-cli.js <a> <b> <c>   Solve equation directly with coefficients`);
  console.log(`  node solver-cli.js --quiz        Practice quiz mode`);
  console.log(`\nExamples:`);
  console.log(`  node solver-cli.js 1 -5 6        Solve x² - 5x + 6 = 0`);
  console.log(`  node solver-cli.js 1 4 5         Solve x² + 4x + 5 = 0`);
  console.log(`  node solver-cli.js 1 -4 1        Solve x² - 4x + 1 = 0 (irrational)`);
  process.exit(0);
} else {
  runInteractive();
}

