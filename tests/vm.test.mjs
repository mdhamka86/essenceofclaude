import { VM, VMError, Op, assemble } from '../src/vm.mjs';

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log('  pass:', name); passed++; }
  catch(e) { console.log('  FAIL:', name); console.log('      ', e.message); failed++; }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

function run(prog) { const vm = new VM(prog); vm.run(); return vm; }

console.log('PUSH');
test('PUSH 42 -> stack [42]', () => {
  const vm = run([Op.PUSH, 42, Op.HALT]);
  assert(vm.stack[0] === 42);
});
test('PUSH 1,2,3', () => {
  const vm = run([Op.PUSH,1,Op.PUSH,2,Op.PUSH,3,Op.HALT]);
  assert(vm.stack.length === 3);
});

console.log('POP');
test('POP removes top', () => {
  const vm = run([Op.PUSH,5,Op.POP,Op.HALT]);
  assert(vm.stack.length === 0);
});
test('POP on empty throws', () => {
  let threw = false;
  try { run([Op.POP]); } catch(e) { if (e instanceof VMError) threw = true; }
  assert(threw);
});

console.log('DUP');
test('DUP duplicates top', () => {
  const vm = run([Op.PUSH,7,Op.DUP,Op.HALT]);
  assert(vm.stack[0]===7 && vm.stack[1]===7);
});

console.log('SWAP');
test('SWAP swaps top two', () => {
  const vm = run([Op.PUSH,1,Op.PUSH,2,Op.SWAP,Op.HALT]);
  assert(vm.stack[0]===2 && vm.stack[1]===1);
});
test('SWAP on one element throws', () => {
  let threw = false;
  try { run([Op.PUSH,1,Op.SWAP]); } catch(e) { if (e instanceof VMError) threw = true; }
  assert(threw);
});

console.log('ADD');
test('3+4=7', () => { const vm=run([Op.PUSH,3,Op.PUSH,4,Op.ADD,Op.HALT]); assert(vm.stack[0]===7); });
test('-5+5=0', () => { const vm=run([Op.PUSH,-5,Op.PUSH,5,Op.ADD,Op.HALT]); assert(vm.stack[0]===0); });

console.log('SUB');
test('10-3=7', () => { const vm=run([Op.PUSH,10,Op.PUSH,3,Op.SUB,Op.HALT]); assert(vm.stack[0]===7); });

console.log('MUL');
test('6*7=42', () => { const vm=run([Op.PUSH,6,Op.PUSH,7,Op.MUL,Op.HALT]); assert(vm.stack[0]===42); });

console.log('DIV');
test('15/3=5', () => { const vm=run([Op.PUSH,15,Op.PUSH,3,Op.DIV,Op.HALT]); assert(vm.stack[0]===5); });
test('div by zero throws', () => {
  let threw=false;
  try { run([Op.PUSH,1,Op.PUSH,0,Op.DIV]); } catch(e) { if(e instanceof VMError) threw=true; }
  assert(threw);
});

console.log('MOD');
test('10%3=1', () => { const vm=run([Op.PUSH,10,Op.PUSH,3,Op.MOD,Op.HALT]); assert(vm.stack[0]===1); });
test('mod by zero throws', () => {
  let threw=false;
  try { run([Op.PUSH,1,Op.PUSH,0,Op.MOD]); } catch(e) { if(e instanceof VMError) threw=true; }
  assert(threw);
});

console.log('NEG');
test('NEG 5=-5', () => { const vm=run([Op.PUSH,5,Op.NEG,Op.HALT]); assert(vm.stack[0]===-5); });
test('NEG -3=3', () => { const vm=run([Op.PUSH,-3,Op.NEG,Op.HALT]); assert(vm.stack[0]===3); });

console.log('Comparison ops');
test('EQ equal', () => { const vm=run([Op.PUSH,3,Op.PUSH,3,Op.EQ,Op.HALT]); assert(vm.stack[0]===1); });
test('EQ not equal', () => { const vm=run([Op.PUSH,3,Op.PUSH,4,Op.EQ,Op.HALT]); assert(vm.stack[0]===0); });
test('NEQ different', () => { const vm=run([Op.PUSH,1,Op.PUSH,2,Op.NEQ,Op.HALT]); assert(vm.stack[0]===1); });
test('LT true', () => { const vm=run([Op.PUSH,2,Op.PUSH,5,Op.LT,Op.HALT]); assert(vm.stack[0]===1); });
test('LT false', () => { const vm=run([Op.PUSH,5,Op.PUSH,2,Op.LT,Op.HALT]); assert(vm.stack[0]===0); });
test('GT true', () => { const vm=run([Op.PUSH,5,Op.PUSH,2,Op.GT,Op.HALT]); assert(vm.stack[0]===1); });
test('LTE equal', () => { const vm=run([Op.PUSH,3,Op.PUSH,3,Op.LTE,Op.HALT]); assert(vm.stack[0]===1); });
test('GTE equal', () => { const vm=run([Op.PUSH,3,Op.PUSH,3,Op.GTE,Op.HALT]); assert(vm.stack[0]===1); });

console.log('Logical ops');
test('AND 1,1=1', () => { const vm=run([Op.PUSH,1,Op.PUSH,1,Op.AND,Op.HALT]); assert(vm.stack[0]===1); });
test('AND 1,0=0', () => { const vm=run([Op.PUSH,1,Op.PUSH,0,Op.AND,Op.HALT]); assert(vm.stack[0]===0); });
test('OR 0,0=0', () => { const vm=run([Op.PUSH,0,Op.PUSH,0,Op.OR,Op.HALT]); assert(vm.stack[0]===0); });
test('OR 0,1=1', () => { const vm=run([Op.PUSH,0,Op.PUSH,1,Op.OR,Op.HALT]); assert(vm.stack[0]===1); });
test('NOT 0=1', () => { const vm=run([Op.PUSH,0,Op.NOT,Op.HALT]); assert(vm.stack[0]===1); });
test('NOT 5=0', () => { const vm=run([Op.PUSH,5,Op.NOT,Op.HALT]); assert(vm.stack[0]===0); });

console.log('Jump ops');
// JMP: jump over PUSH 0, so stack should only have 1
test('JMP skips PUSH 0', () => {
  const prog = assemble([
    Op.PUSH, 1,
    Op.JMP, 'skip',
    Op.PUSH, 0,
    'skip:',
    Op.HALT
  ]);
  const vm = run(prog);
  assert(vm.stack.length===1 && vm.stack[0]===1);
});
// JZ: jump if zero
test('JZ taken when 0', () => {
  const prog = assemble([
    Op.PUSH, 0,
    Op.JZ, 'skip',
    Op.PUSH, 99,
    'skip:',
    Op.HALT
  ]);
  const vm = run(prog);
  assert(vm.stack.length===0);
});
test('JZ not taken when nonzero', () => {
  const prog = assemble([
    Op.PUSH, 1,
    Op.JZ, 'skip',
    Op.PUSH, 99,
    'skip:',
    Op.HALT
  ]);
  const vm = run(prog);
  assert(vm.stack[0]===99);
});
// JNZ: jump if nonzero
test('JNZ taken when nonzero', () => {
  const prog = assemble([
    Op.PUSH, 5,
    Op.JNZ, 'skip',
    Op.PUSH, 99,
    'skip:',
    Op.HALT
  ]);
  const vm = run(prog);
  assert(vm.stack.length===0);
});

console.log('STORE/LOAD');
test('STORE and LOAD variable', () => {
  // push 42, store as 'x', push 0, load 'x' -> stack top is 42
  const prog = [Op.PUSH,42,Op.STORE,'x',Op.PUSH,0,Op.LOAD,'x',Op.HALT];
  const vm = run(prog);
  assert(vm.stack[0]===0 && vm.stack[1]===42);
});
test('LOAD undefined var is undefined', () => {
  const vm = run([Op.LOAD,'z',Op.HALT]);
  assert(vm.stack[0]===undefined);
});

console.log('assemble helper');
test('assemble resolves labels', () => {
  const prog = assemble(['loop:', Op.PUSH, 1, Op.JMP, 'loop']);
  assert(prog[0]===Op.PUSH);
  assert(prog[2]===Op.JMP);
  assert(prog[3]===0); // label 'loop' resolves to index 0
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
