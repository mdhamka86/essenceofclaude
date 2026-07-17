import { assemble } from '../src/assembler.mjs';
import { VM, OP } from '../src/vm.mjs';

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  pass: ${name}`); passed++; }
  catch(e) { console.error(`  FAIL: ${name}\n    ${e.message}`); failed++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function eq(a, b) { assert(a === b, `expected ${b}, got ${a}`); }
function deepEq(a, b) {
  const as = JSON.stringify(a), bs = JSON.stringify(b);
  assert(as === bs, `expected ${bs}, got ${as}`);
}

console.log('Assembler');

test('PUSH and HALT', () => {
  const prog = assemble('PUSH 42\nHALT');
  deepEq(prog, [OP.PUSH, 42, OP.HALT]);
});

test('arithmetic', () => {
  const prog = assemble('PUSH 3\nPUSH 4\nADD\nHALT');
  const vm = new VM(prog);
  eq(vm.run(), 7);
});

test('comments stripped', () => {
  const prog = assemble('; this is a comment\nPUSH 1 ; inline comment\nHALT');
  deepEq(prog, [OP.PUSH, 1, OP.HALT]);
});

test('label definition and JMP', () => {
  // JMP over a PUSH, land on PUSH 99 HALT
  const prog = assemble('JMP end\nPUSH 0\nend:\nPUSH 99\nHALT');
  const vm = new VM(prog);
  eq(vm.run(), 99);
});

test('JZ taken', () => {
  const prog = assemble('PUSH 0\nJZ yes\nPUSH 1\nHALT\nyes:\nPUSH 2\nHALT');
  const vm = new VM(prog);
  eq(vm.run(), 2);
});

test('JZ not taken', () => {
  const prog = assemble('PUSH 5\nJZ yes\nPUSH 1\nHALT\nyes:\nPUSH 2\nHALT');
  const vm = new VM(prog);
  eq(vm.run(), 1);
});

test('STORE and LOAD', () => {
  const prog = assemble('PUSH 10\nSTORE x\nLOAD x\nHALT');
  const vm = new VM(prog);
  eq(vm.run(), 10);
});

test('CALL and RET', () => {
  const src = `
    CALL double
    HALT
    double:
      PUSH 2
      MUL
      RET
  `;
  // Push argument first
  const prog = assemble('PUSH 5\n' + src);
  const vm = new VM(prog);
  eq(vm.run(), 10);
});

test('factorial via loop (assembler)', () => {
  // n=5, compute 5! = 120
  const src = `
    PUSH 5
    STORE n
    PUSH 1
    STORE acc
    loop:
      LOAD n
      PUSH 0
      EQ
      JNZ done
      LOAD acc
      LOAD n
      MUL
      STORE acc
      LOAD n
      PUSH 1
      SUB
      STORE n
      JMP loop
    done:
      LOAD acc
      HALT
  `;
  const prog = assemble(src);
  const vm = new VM(prog);
  eq(vm.run(), 120);
});

test('PRINT opcode', () => {
  const out = [];
  const prog = assemble('PUSH 42\nPRINT\nHALT');
  const vm = new VM(prog, { output: v => out.push(v) });
  vm.run();
  deepEq(out, [42]);
});

const total = passed + failed;
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
