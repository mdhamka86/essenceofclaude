/**
 * Tests for Pico VM core: arithmetic and stack operations.
 */

import { VM, Op, VMError } from "../src/vm.mjs";

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function assertEqual(a, b, label) {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}  (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`);
    failed++;
  }
}

function assertThrows(fn, label) {
  try {
    fn();
    console.error(`  ✗ ${label}  (expected an error but none was thrown)`);
    failed++;
  } catch (e) {
    if (e instanceof VMError) {
      console.log(`  ✓ ${label}`);
      passed++;
    } else {
      console.error(`  ✗ ${label}  (wrong error type: ${e.message})`);
      failed++;
    }
  }
}

const vm = new VM();

// ── PUSH ──────────────────────────────────────────────────────────────────
console.log("PUSH");
equal: {
  const result = vm.run([[Op.PUSH, 42], Op.HALT]);
  assertEqual(result, [42], "PUSH 42 → stack [42]");
}
{
  const result = vm.run([[Op.PUSH, 1], [Op.PUSH, 2], [Op.PUSH, 3]]);
  assertEqual(result, [1, 2, 3], "PUSH 1,2,3 → stack [1,2,3]");
}

// ── POP ───────────────────────────────────────────────────────────────────
console.log("POP");
{
  const result = vm.run([[Op.PUSH, 10], [Op.PUSH, 20], Op.POP, Op.HALT]);
  assertEqual(result, [10], "POP removes top of stack");
}
assertThrows(() => vm.run([Op.POP]), "POP on empty stack throws");

// ── DUP ───────────────────────────────────────────────────────────────────
console.log("DUP");
{
  const result = vm.run([[Op.PUSH, 7], Op.DUP]);
  assertEqual(result, [7, 7], "DUP duplicates top");
}

// ── SWAP ──────────────────────────────────────────────────────────────────
console.log("SWAP");
{
  const result = vm.run([[Op.PUSH, 1], [Op.PUSH, 2], Op.SWAP]);
  assertEqual(result, [2, 1], "SWAP swaps top two");
}
assertThrows(() => vm.run([[Op.PUSH, 1], Op.SWAP]), "SWAP on one element throws");

// ── ADD ───────────────────────────────────────────────────────────────────
console.log("ADD");
{
  const result = vm.run([[Op.PUSH, 3], [Op.PUSH, 4], Op.ADD]);
  assertEqual(result, [7], "3 + 4 = 7");
}
{
  const result = vm.run([[Op.PUSH, -5], [Op.PUSH, 5], Op.ADD]);
  assertEqual(result, [0], "-5 + 5 = 0");
}

// ── SUB ───────────────────────────────────────────────────────────────────
console.log("SUB");
{
  const result = vm.run([[Op.PUSH, 10], [Op.PUSH, 3], Op.SUB]);
  assertEqual(result, [7], "10 - 3 = 7");
}

// ── MUL ───────────────────────────────────────────────────────────────────
console.log("MUL");
{
  const result = vm.run([[Op.PUSH, 6], [Op.PUSH, 7], Op.MUL]);
  assertEqual(result, [42], "6 * 7 = 42");
}

// ── DIV ───────────────────────────────────────────────────────────────────
console.log("DIV");
{
  const result = vm.run([[Op.PUSH, 15], [Op.PUSH, 3], Op.DIV]);
  assertEqual(result, [5], "15 / 3 = 5");
}
assertThrows(() => vm.run([[Op.PUSH, 5], [Op.PUSH, 0], Op.DIV]), "division by zero throws");

// ── MOD ───────────────────────────────────────────────────────────────────
console.log("MOD");
{
  const result = vm.run([[Op.PUSH, 10], [Op.PUSH, 3], Op.MOD]);
  assertEqual(result, [1], "10 % 3 = 1");
}
assertThrows(() => vm.run([[Op.PUSH, 5], [Op.PUSH, 0], Op.MOD]), "modulo by zero throws");

// ── NEG ───────────────────────────────────────────────────────────────────
console.log("NEG");
{
  const result = vm.run([[Op.PUSH, 5], Op.NEG]);
  assertEqual(result, [-5], "NEG 5 = -5");
}
{
  const result = vm.run([[Op.PUSH, -3], Op.NEG]);
  assertEqual(result, [3], "NEG -3 = 3");
}

// ── Compound expressions ──────────────────────────────────────────────────
console.log("Compound");
{
  // (2 + 3) * 4 = 20
  const result = vm.run([
    [Op.PUSH, 2], [Op.PUSH, 3], Op.ADD,
    [Op.PUSH, 4], Op.MUL,
    Op.HALT,
  ]);
  assertEqual(result, [20], "(2+3)*4 = 20");
}
{
  // 2^10 via repeated squaring approximation: just 2*2*2*2*2*2*2*2*2*2
  // Push 2 ten times, multiply 9 times
  const prog = [[Op.PUSH, 2]];
  for (let i = 0; i < 9; i++) {
    prog.push([Op.PUSH, 2]);
    prog.push(Op.MUL);
  }
  prog.push(Op.HALT);
  const result = vm.run(prog);
  assertEqual(result, [1024], "2^10 = 1024");
}

// ── Unknown opcode ────────────────────────────────────────────────────────
console.log("Error handling");
assertThrows(() => vm.run(["BOGUS"]), "unknown opcode throws VMError");
assertThrows(() => vm.run([Op.PUSH]), "PUSH without operand throws VMError");

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
