import { createVM, run, VMError } from '../src/vm.mjs';

let passed = 0, failed = 0;

function assert(cond, msg) {
  if (cond) { console.log('  pass: ' + msg); passed++; }
  else { console.log('  FAIL: ' + msg); failed++; }
}

function assertThrows(fn, type, msg) {
  try { fn(); console.log('  FAIL: expected throw - ' + msg); failed++; }
  catch (e) {
    if (e instanceof type) { console.log('  pass: ' + msg); passed++; }
    else { console.log('  FAIL: wrong error type - ' + msg + ' got ' + e.name); failed++; }
  }
}

function vm() { return createVM(); }

// ---- PUSH ----
console.log('PUSH');
{ const v = vm(); run(v, ['PUSH', 42, 'HALT']); assert(v.stack[0] === 42, 'PUSH 42 -> stack [42]'); }
{ const v = vm(); run(v, ['PUSH', 1, 'PUSH', 2, 'PUSH', 3, 'HALT']); assert(v.stack.join(',') === '1,2,3', 'PUSH 1,2,3'); }

// ---- POP ----
console.log('POP');
{ const v = vm(); run(v, ['PUSH', 5, 'POP', 'HALT']); assert(v.stack.length === 0, 'POP removes top'); }
{ assertThrows(() => run(vm(), ['POP', 'HALT']), VMError, 'POP on empty throws'); }

// ---- DUP ----
console.log('DUP');
{ const v = vm(); run(v, ['PUSH', 7, 'DUP', 'HALT']); assert(v.stack.join(',') === '7,7', 'DUP duplicates top'); }

// ---- SWAP ----
console.log('SWAP');
{ const v = vm(); run(v, ['PUSH', 1, 'PUSH', 2, 'SWAP', 'HALT']); assert(v.stack.join(',') === '2,1', 'SWAP swaps top two'); }
{ assertThrows(() => run(vm(), ['PUSH', 1, 'SWAP', 'HALT']), VMError, 'SWAP on one element throws'); }

// ---- ADD ----
console.log('ADD');
{ const v = vm(); run(v, ['PUSH', 3, 'PUSH', 4, 'ADD', 'HALT']); assert(v.stack[0] === 7, '3+4=7'); }
{ const v = vm(); run(v, ['PUSH', -5, 'PUSH', 5, 'ADD', 'HALT']); assert(v.stack[0] === 0, '-5+5=0'); }

// ---- SUB ----
console.log('SUB');
{ const v = vm(); run(v, ['PUSH', 10, 'PUSH', 3, 'SUB', 'HALT']); assert(v.stack[0] === 7, '10-3=7'); }

// ---- MUL ----
console.log('MUL');
{ const v = vm(); run(v, ['PUSH', 6, 'PUSH', 7, 'MUL', 'HALT']); assert(v.stack[0] === 42, '6*7=42'); }

// ---- DIV ----
console.log('DIV');
{ const v = vm(); run(v, ['PUSH', 15, 'PUSH', 3, 'DIV', 'HALT']); assert(v.stack[0] === 5, '15/3=5'); }
{ assertThrows(() => run(vm(), ['PUSH', 1, 'PUSH', 0, 'DIV', 'HALT']), VMError, 'div by zero throws'); }

// ---- MOD ----
console.log('MOD');
{ const v = vm(); run(v, ['PUSH', 10, 'PUSH', 3, 'MOD', 'HALT']); assert(v.stack[0] === 1, '10%3=1'); }
{ assertThrows(() => run(vm(), ['PUSH', 1, 'PUSH', 0, 'MOD', 'HALT']), VMError, 'mod by zero throws'); }

// ---- NEG ----
console.log('NEG');
{ const v = vm(); run(v, ['PUSH', 5, 'NEG', 'HALT']); assert(v.stack[0] === -5, 'NEG 5=-5'); }
{ const v = vm(); run(v, ['PUSH', -3, 'NEG', 'HALT']); assert(v.stack[0] === 3, 'NEG -3=3'); }

// ---- Comparison ----
console.log('Comparison ops');
{ const v = vm(); run(v, ['PUSH', 5, 'PUSH', 5, 'EQ', 'HALT']); assert(v.stack[0] === 1, 'EQ equal'); }
{ const v = vm(); run(v, ['PUSH', 5, 'PUSH', 6, 'EQ', 'HALT']); assert(v.stack[0] === 0, 'EQ not equal'); }
{ const v = vm(); run(v, ['PUSH', 5, 'PUSH', 6, 'NEQ', 'HALT']); assert(v.stack[0] === 1, 'NEQ different'); }
{ const v = vm(); run(v, ['PUSH', 3, 'PUSH', 5, 'LT', 'HALT']); assert(v.stack[0] === 1, 'LT true'); }
{ const v = vm(); run(v, ['PUSH', 5, 'PUSH', 3, 'LT', 'HALT']); assert(v.stack[0] === 0, 'LT false'); }
{ const v = vm(); run(v, ['PUSH', 5, 'PUSH', 3, 'GT', 'HALT']); assert(v.stack[0] === 1, 'GT true'); }
{ const v = vm(); run(v, ['PUSH', 3, 'PUSH', 3, 'LTE', 'HALT']); assert(v.stack[0] === 1, 'LTE equal'); }
{ const v = vm(); run(v, ['PUSH', 3, 'PUSH', 3, 'GTE', 'HALT']); assert(v.stack[0] === 1, 'GTE equal'); }

// ---- Logical ----
console.log('Logical ops');
{ const v = vm(); run(v, ['PUSH', 1, 'PUSH', 1, 'AND', 'HALT']); assert(v.stack[0] === 1, 'AND 1,1=1'); }
{ const v = vm(); run(v, ['PUSH', 1, 'PUSH', 0, 'AND', 'HALT']); assert(v.stack[0] === 0, 'AND 1,0=0'); }
{ const v = vm(); run(v, ['PUSH', 0, 'PUSH', 0, 'OR', 'HALT']); assert(v.stack[0] === 0, 'OR 0,0=0'); }
{ const v = vm(); run(v, ['PUSH', 0, 'PUSH', 1, 'OR', 'HALT']); assert(v.stack[0] === 1, 'OR 0,1=1'); }
{ const v = vm(); run(v, ['PUSH', 0, 'NOT', 'HALT']); assert(v.stack[0] === 1, 'NOT 0=1'); }
{ const v = vm(); run(v, ['PUSH', 5, 'NOT', 'HALT']); assert(v.stack[0] === 0, 'NOT 5=0'); }

// ---- Jumps ----
console.log('Jump ops');
// JMP: unconditional jump to index 4 (PUSH 99)
{ const v = vm(); run(v, ['JMP', 4, 'PUSH', 0, 'PUSH', 99, 'HALT']); assert(v.stack[0] === 99, 'JMP skips PUSH 0'); }
// JZ: push 0, jump to HALT (index 4), skip PUSH 99
{ const v = vm(); run(v, ['PUSH', 0, 'JZ', 5, 'PUSH', 99, 'HALT']); assert(v.stack.length === 0, 'JZ taken when zero'); }
// JZ: push 1, do not jump, execute PUSH 42
{ const v = vm(); run(v, ['PUSH', 1, 'JZ', 6, 'PUSH', 42, 'HALT']); assert(v.stack[0] === 42, 'JZ not taken when nonzero'); }
// JNZ: push 1, jump to index 5 (HALT), skip PUSH 99
{ const v = vm(); run(v, ['PUSH', 1, 'JNZ', 5, 'PUSH', 99, 'HALT']); assert(v.stack.length === 0, 'JNZ taken when nonzero'); }
// JNZ: push 0, do not jump, execute PUSH 7
{ const v = vm(); run(v, ['PUSH', 0, 'JNZ', 6, 'PUSH', 7, 'HALT']); assert(v.stack[0] === 7, 'JNZ not taken when zero'); }

// ---- Compound ----
console.log('Compound');
{ const v = vm(); run(v, ['PUSH', 2, 'PUSH', 3, 'ADD', 'PUSH', 4, 'MUL', 'HALT']); assert(v.stack[0] === 20, '(2+3)*4=20'); }

// ---- Error handling ----
console.log('Error handling');
{ assertThrows(() => run(vm(), ['BADOP']), VMError, 'unknown opcode throws'); }
{ assertThrows(() => run(vm(), ['PUSH']), VMError, 'PUSH without operand throws'); }

console.log('');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
