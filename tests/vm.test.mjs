import { run, Op, VMError, assemble } from '../src/vm.mjs';

let passed = 0, failed = 0;
function assert(desc, fn) {
  try { fn(); console.log('  pass:', desc); passed++; }
  catch(e) { console.log('  FAIL:', desc, '\n   ', e.message); failed++; }
}
function eq(a, b) {
  const as = JSON.stringify(a), bs = JSON.stringify(b);
  if (as !== bs) throw new Error(as + ' !== ' + bs);
}
function throws(fn, msg) {
  try { fn(); throw new Error('expected throw'); }
  catch(e) { if (e.message === 'expected throw') throw e; if (msg && !e.message.includes(msg)) throw new Error('got: '+e.message); }
}

console.log('PUSH');
assert('PUSH 42 -> stack [42]', () => {
  const { stack } = run([Op.PUSH, 42, Op.HALT]);
  eq(stack, [42]);
});
assert('PUSH 1,2,3', () => {
  const { stack } = run([Op.PUSH, 1, Op.PUSH, 2, Op.PUSH, 3, Op.HALT]);
  eq(stack, [1,2,3]);
});

console.log('POP');
assert('POP removes top', () => {
  const { stack } = run([Op.PUSH, 1, Op.PUSH, 2, Op.POP, Op.HALT]);
  eq(stack, [1]);
});
assert('POP on empty throws', () => throws(() => run([Op.POP]), 'underflow'));

console.log('DUP');
assert('DUP duplicates top', () => {
  const { stack } = run([Op.PUSH, 7, Op.DUP, Op.HALT]);
  eq(stack, [7, 7]);
});

console.log('SWAP');
assert('SWAP swaps top two', () => {
  const { stack } = run([Op.PUSH, 1, Op.PUSH, 2, Op.SWAP, Op.HALT]);
  eq(stack, [2, 1]);
});
assert('SWAP on one element throws', () => throws(() => run([Op.PUSH, 1, Op.SWAP])));

console.log('ADD');
assert('3+4=7', () => { const {stack} = run([Op.PUSH,3,Op.PUSH,4,Op.ADD,Op.HALT]); eq(stack,[7]); });
assert('-5+5=0', () => { const {stack} = run([Op.PUSH,-5,Op.PUSH,5,Op.ADD,Op.HALT]); eq(stack,[0]); });

console.log('SUB');
assert('10-3=7', () => { const {stack} = run([Op.PUSH,10,Op.PUSH,3,Op.SUB,Op.HALT]); eq(stack,[7]); });

console.log('MUL');
assert('6*7=42', () => { const {stack} = run([Op.PUSH,6,Op.PUSH,7,Op.MUL,Op.HALT]); eq(stack,[42]); });

console.log('DIV');
assert('15/3=5', () => { const {stack} = run([Op.PUSH,15,Op.PUSH,3,Op.DIV,Op.HALT]); eq(stack,[5]); });
assert('div by zero throws', () => throws(() => run([Op.PUSH,1,Op.PUSH,0,Op.DIV]), 'zero'));

console.log('MOD');
assert('10%3=1', () => { const {stack} = run([Op.PUSH,10,Op.PUSH,3,Op.MOD,Op.HALT]); eq(stack,[1]); });
assert('mod by zero throws', () => throws(() => run([Op.PUSH,1,Op.PUSH,0,Op.MOD]), 'zero'));

console.log('NEG');
assert('NEG 5=-5', () => { const {stack} = run([Op.PUSH,5,Op.NEG,Op.HALT]); eq(stack,[-5]); });
assert('NEG -3=3', () => { const {stack} = run([Op.PUSH,-3,Op.NEG,Op.HALT]); eq(stack,[3]); });

console.log('Comparison ops');
assert('EQ equal', () => { const {stack} = run([Op.PUSH,3,Op.PUSH,3,Op.EQ,Op.HALT]); eq(stack,[1]); });
assert('EQ not equal', () => { const {stack} = run([Op.PUSH,2,Op.PUSH,3,Op.EQ,Op.HALT]); eq(stack,[0]); });
assert('NEQ different', () => { const {stack} = run([Op.PUSH,2,Op.PUSH,3,Op.NEQ,Op.HALT]); eq(stack,[1]); });
assert('LT true', () => { const {stack} = run([Op.PUSH,2,Op.PUSH,3,Op.LT,Op.HALT]); eq(stack,[1]); });
assert('LT false', () => { const {stack} = run([Op.PUSH,3,Op.PUSH,2,Op.LT,Op.HALT]); eq(stack,[0]); });
assert('GT true', () => { const {stack} = run([Op.PUSH,5,Op.PUSH,2,Op.GT,Op.HALT]); eq(stack,[1]); });
assert('LTE equal', () => { const {stack} = run([Op.PUSH,3,Op.PUSH,3,Op.LTE,Op.HALT]); eq(stack,[1]); });
assert('GTE equal', () => { const {stack} = run([Op.PUSH,3,Op.PUSH,3,Op.GTE,Op.HALT]); eq(stack,[1]); });

console.log('Logical ops');
assert('AND 1,1=1', () => { const {stack} = run([Op.PUSH,1,Op.PUSH,1,Op.AND,Op.HALT]); eq(stack,[1]); });
assert('AND 1,0=0', () => { const {stack} = run([Op.PUSH,1,Op.PUSH,0,Op.AND,Op.HALT]); eq(stack,[0]); });
assert('OR 0,0=0', () => { const {stack} = run([Op.PUSH,0,Op.PUSH,0,Op.OR,Op.HALT]); eq(stack,[0]); });
assert('OR 0,1=1', () => { const {stack} = run([Op.PUSH,0,Op.PUSH,1,Op.OR,Op.HALT]); eq(stack,[1]); });
assert('NOT 0=1', () => { const {stack} = run([Op.PUSH,0,Op.NOT,Op.HALT]); eq(stack,[1]); });
assert('NOT 5=0', () => { const {stack} = run([Op.PUSH,5,Op.NOT,Op.HALT]); eq(stack,[0]); });

console.log('Jump ops');
assert('JMP skips PUSH 0', () => {
  // PUSH 1, JMP 6, PUSH 0, HALT
  // index: 0=PUSH,1=1, 2=JMP,3=6, 4=PUSH,5=0, 6=HALT
  const {stack} = run([Op.PUSH,1, Op.JMP,6, Op.PUSH,0, Op.HALT]);
  eq(stack,[1]);
});
assert('JZ taken when 0', () => {
  // PUSH 0, JZ 6, PUSH 99, HALT, PUSH 42, HALT
  // 0=PUSH,1=0, 2=JZ,3=8, 4=PUSH,5=99, 6=HALT, 7=PUSH,8=42,... wait
  // Let me lay out carefully:
  // [0]PUSH [1]0 [2]JZ [3]7 [4]PUSH [5]99 [6]HALT [7]PUSH [8]42 [9]HALT
  const {stack} = run([Op.PUSH,0, Op.JZ,7, Op.PUSH,99, Op.HALT, Op.PUSH,42, Op.HALT]);
  eq(stack,[42]);
});
assert('JZ not taken when nonzero', () => {
  const {stack} = run([Op.PUSH,1, Op.JZ,7, Op.PUSH,99, Op.HALT, Op.PUSH,42, Op.HALT]);
  eq(stack,[99]);
});
assert('JNZ taken when nonzero', () => {
  // PUSH 5, JNZ 7, PUSH 0, HALT, PUSH 55, HALT
  const {stack} = run([Op.PUSH,5, Op.JNZ,7, Op.PUSH,0, Op.HALT, Op.PUSH,55, Op.HALT]);
  eq(stack,[55]);
});

console.log('STORE/LOAD');
assert('STORE and LOAD variable', () => {
  const {stack} = run([Op.PUSH,99, Op.STORE,'x', Op.LOAD,'x', Op.HALT]);
  eq(stack,[99]);
});
assert('LOAD undefined var is undefined', () => {
  const {stack} = run([Op.LOAD,'z', Op.HALT]);
  eq(stack,[undefined]);
});

console.log('assemble helper');
assert('assemble resolves labels', () => {
  // program: PUSH 1, JMP end, PUSH 99, end: HALT
  const prog = assemble([Op.PUSH, 1, Op.JMP, 'end', Op.PUSH, 99, 'end:', Op.HALT]);
  // end: label is at index 6 in raw (after removing 'end:' token)
  // raw: [PUSH,1,JMP,'end',PUSH,99,HALT] -> end resolves to 6
  const {stack} = run(prog);
  eq(stack,[1]);
});

console.log('CALL/RET');
assert('simple function call', () => {
  // main: PUSH 10, CALL double, HALT
  // double: DUP, ADD, RET  (doubles top of stack)
  // Layout:
  // [0]PUSH [1]10 [2]CALL [3]7 [4]HALT  <- main ends at 4
  // [5]... wait, HALT is at index 4, then func at 5
  // [0]PUSH,[1]10,[2]CALL,[3]6,[4]HALT,[5]DUP,[6]ADD,[7]RET
  // wait CALL target is index 5
  const prog = [
    Op.PUSH, 10,
    Op.CALL, 5,
    Op.HALT,
    Op.DUP, Op.ADD, Op.RET
  ];
  const {stack} = run(prog);
  eq(stack, [20]);
});
assert('nested function calls', () => {
  // add1: PUSH 1, ADD, RET  (starts at index 8)
  // main: PUSH 5, CALL add1, CALL add1, HALT
  // [0]PUSH,[1]5,[2]CALL,[3]8,[4]CALL,[5]8,[6]HALT,[7]... hmm
  // add1 at index 7: PUSH,1,ADD,RET
  const prog = [
    Op.PUSH, 5,
    Op.CALL, 7,
    Op.CALL, 7,
    Op.HALT,
    Op.PUSH, 1, Op.ADD, Op.RET
  ];
  const {stack} = run(prog);
  eq(stack, [7]);
});
assert('RET with empty call stack throws', () => {
  throws(() => run([Op.RET]), 'call stack');
});
assert('local vars isolated in function', () => {
  // main stores x=99, calls func, func stores x=42, rets
  // after ret, main loads x -> should be 99 (caller scope restored)
  // [0]PUSH,[1]99,[2]STORE,[3]'x',[4]CALL,[5]13,[6]LOAD,[7]'x',[8]HALT
  // func at [9]: PUSH,42,STORE,'x',RET
  // wait [4]CALL needs address, CALL is at index 4, operand at 5 = address of func
  // let me recount:
  // 0:PUSH 1:99 2:STORE 3:'x' 4:CALL 5:9 6:LOAD 7:'x' 8:HALT 9:PUSH 10:42 11:STORE 12:'x' 13:RET
  const prog = [
    Op.PUSH, 99, Op.STORE, 'x',
    Op.CALL, 9,
    Op.LOAD, 'x',
    Op.HALT,
    Op.PUSH, 42, Op.STORE, 'x',
    Op.RET
  ];
  const {stack} = run(prog);
  eq(stack, [99]);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
