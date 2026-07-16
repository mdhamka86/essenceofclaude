import { assemble } from '../src/assembler.mjs';
import { VM, OP } from '../src/vm.mjs';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  pass:', name);
    passed++;
  } catch (e) {
    console.log('  FAIL:', name, '->', e.message);
    failed++;
  }
}

function eq(a, b) {
  const as = JSON.stringify(a);
  const bs = JSON.stringify(b);
  if (as !== bs) throw new Error('Expected ' + bs + ' got ' + as);
}

function run(prog) {
  const vm = new VM(prog);
  vm.run();
  return vm;
}

console.log('Assembler - basic mnemonics');
test('PUSH and HALT', () => {
  const prog = assemble('PUSH 42\nHALT');
  eq(prog, [OP.PUSH, 42, OP.HALT]);
});

test('arithmetic sequence', () => {
  const prog = assemble('PUSH 3\nPUSH 4\nADD\nHALT');
  eq(prog, [OP.PUSH, 3, OP.PUSH, 4, OP.ADD, OP.HALT]);
});

test('comments stripped', () => {
  const src = '; this is a comment\nPUSH 1 ; inline comment\nHALT';
  const prog = assemble(src);
  eq(prog, [OP.PUSH, 1, OP.HALT]);
});

test('blank lines ignored', () => {
  const src = '\n\nPUSH 5\n\nHALT\n';
  const prog = assemble(src);
  eq(prog, [OP.PUSH, 5, OP.HALT]);
});

console.log('Assembler - labels');
test('label resolves to address', () => {
  // PUSH 1, JMP end, PUSH 99, end: HALT
  // Addresses: PUSH=0,1=1, JMP=2,addr=3, PUSH=4,99=5, HALT=6
  // 'end' label is at position 6
  const src = 'PUSH 1\nJMP end\nPUSH 99\nend:\nHALT';
  const prog = assemble(src);
  eq(prog, [OP.PUSH, 1, OP.JMP, 6, OP.PUSH, 99, OP.HALT]);
});

test('label and run - JMP skips code', () => {
  const src = 'PUSH 1\nJMP end\nPUSH 99\nend:\nHALT';
  const vm = run(assemble(src));
  // stack should have only 1 on top (99 was skipped)
  eq(vm.stack.slice(-1), [1]);
});

test('JZ label', () => {
  // push 0, jz skip, push 99, skip: push 7, halt
  // pos: PUSH=0,0=1, JZ=2,addr=3, PUSH=4,99=5, PUSH=6,7=7, HALT=8
  // skip: is at position 6
  const src = 'PUSH 0\nJZ skip\nPUSH 99\nskip:\nPUSH 7\nHALT';
  const vm = run(assemble(src));
  // 0 consumed by JZ, then jumps to skip (pos 6), pushes 7
  eq(vm.stack, [7]);
});

test('inline label definition', () => {
  // label on same line as instruction
  const src = 'PUSH 5\nmylabel: HALT';
  const prog = assemble(src);
  // mylabel is at position 2 (after PUSH 5)
  eq(prog, [OP.PUSH, 5, OP.HALT]);
});

console.log('Assembler - STORE/LOAD');
test('STORE and LOAD variable names', () => {
  const src = 'PUSH 42\nSTORE x\nLOAD x\nHALT';
  const prog = assemble(src);
  eq(prog, [OP.PUSH, 42, OP.STORE, 'x', OP.LOAD, 'x', OP.HALT]);
});

test('STORE/LOAD run correctly', () => {
  const src = 'PUSH 10\nSTORE n\nLOAD n\nLOAD n\nADD\nHALT';
  const vm = run(assemble(src));
  eq(vm.stack, [20]);
});

console.log('Assembler - CALL/RET');
test('CALL label', () => {
  // main: PUSH 1, CALL double, HALT
  // double: DUP, ADD, RET
  // Layout: PUSH=0,1=1, CALL=2,addr=3, HALT=4, DUP=5, ADD=6, RET=7
  // 'double' label is at position 5
  const src = 'PUSH 1\nCALL double\nHALT\ndouble:\nDUP\nADD\nRET';
  const prog = assemble(src);
  eq(prog, [OP.PUSH, 1, OP.CALL, 5, OP.HALT, OP.DUP, OP.ADD, OP.RET]);
  const vm = run(prog);
  eq(vm.stack, [2]);
});

console.log('Assembler - error handling');
test('unknown mnemonic throws', () => {
  let threw = false;
  try { assemble('FOO 1'); } catch (e) { threw = true; }
  if (!threw) throw new Error('should have thrown');
});

test('undefined label throws', () => {
  let threw = false;
  try { assemble('JMP nowhere'); } catch (e) { threw = true; }
  if (!threw) throw new Error('should have thrown');
});

test('missing operand throws', () => {
  let threw = false;
  try { assemble('PUSH'); } catch (e) { threw = true; }
  if (!threw) throw new Error('should have thrown');
});

console.log('Assembler - full program');
test('factorial of 5 via loop', () => {
  // Compute 5! = 120
  // n=5, acc=1, loop: if n==0 goto done, acc=acc*n, n=n-1, goto loop
  const src = [
    'PUSH 5',
    'STORE n',
    'PUSH 1',
    'STORE acc',
    'loop:',
    '  LOAD n',
    '  PUSH 0',
    '  EQ',
    '  JNZ done',  // if n==0, jump to done
    '  LOAD acc',
    '  LOAD n',
    '  MUL',
    '  STORE acc',
    '  LOAD n',
    '  PUSH 1',
    '  SUB',
    '  STORE n',
    '  JMP loop',
    'done:',
    '  LOAD acc',
    '  HALT',
  ].join('\n');
  const vm = run(assemble(src));
  eq(vm.stack, [120]);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
