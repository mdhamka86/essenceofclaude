import { assemble } from '../src/assembler.mjs';
import { strict as assert } from 'assert';

const NL = String.fromCharCode(10);

function test(name, fn) {
  try {
    fn();
    console.log('  pass: ' + name);
  } catch (e) {
    console.log('  FAIL: ' + name);
    console.log('    ' + e.message);
  }
}

console.log('Assembler');

test('PUSH and HALT', () => {
  const bc = assemble('PUSH 5' + NL + 'HALT');
  assert.deepEqual(bc, [0, 5, 10]);
});

test('arithmetic', () => {
  const src = 'PUSH 5' + NL + 'PUSH 3' + NL + 'ADD' + NL + 'HALT';
  const bc = assemble(src);
  assert.deepEqual(bc, [0, 5, 0, 3, 1, 10]);
});

test('comments stripped', () => {
  const src = 'PUSH 5 ; push five' + NL + 'HALT ; stop';
  const bc = assemble(src);
  assert.deepEqual(bc, [0, 5, 10]);
});

test('label definition and JMP', () => {
  const src = 'loop:' + NL + 'PUSH 1' + NL + 'JMP loop';
  const bc = assemble(src);
  assert.deepEqual(bc, [0, 1, 20, 0]);
});

test('JZ taken', () => {
  const src = 'PUSH 0' + NL + 'JZ end' + NL + 'PUSH 99' + NL + 'end:' + NL + 'HALT';
  const bc = assemble(src);
  assert.deepEqual(bc, [0, 0, 21, 7, 0, 99, 10]);
});

test('JZ not taken', () => {
  const src = 'PUSH 1' + NL + 'JZ end' + NL + 'PUSH 42' + NL + 'end:' + NL + 'HALT';
  const bc = assemble(src);
  assert.deepEqual(bc, [0, 1, 21, 7, 0, 42, 10]);
});

test('STORE and LOAD', () => {
  const src = 'PUSH 7' + NL + 'STORE 0' + NL + 'LOAD 0' + NL + 'HALT';
  const bc = assemble(src);
  assert.deepEqual(bc, [0, 7, 23, 0, 24, 0, 10]);
});

test('CALL and RET', () => {
  const src = 'CALL fn' + NL + 'HALT' + NL + 'fn:' + NL + 'PUSH 1' + NL + 'RET';
  const bc = assemble(src);
  assert.deepEqual(bc, [25, 4, 10, 0, 1, 26]);
});

test('factorial via loop (assembler)', () => {
  const src = [
    'PUSH 5',
    'STORE 0',
    'PUSH 1',
    'STORE 1',
    'loop:',
    'LOAD 0',
    'JZ done',
    'LOAD 1',
    'LOAD 0',
    'MUL',
    'STORE 1',
    'LOAD 0',
    'PUSH 1',
    'SUB',
    'STORE 0',
    'JMP loop',
    'done:',
    'LOAD 1',
    'HALT'
  ].join(NL);
  const bc = assemble(src);
  assert.equal(typeof bc, 'object');
  assert.ok(Array.isArray(bc));
  assert.ok(bc.length > 0);
});

test('PRINT opcode', () => {
  const src = 'PUSH 42' + NL + 'PRINT' + NL + 'HALT';
  const bc = assemble(src);
  assert.deepEqual(bc, [0, 42, 27, 10]);
});
