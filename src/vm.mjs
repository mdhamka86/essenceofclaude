// Pico VM - stack-based virtual machine

export const Op = {
  PUSH:  0,
  POP:   1,
  DUP:   2,
  SWAP:  3,
  ADD:   4,
  SUB:   5,
  MUL:   6,
  DIV:   7,
  MOD:   8,
  NEG:   9,
  HALT:  10,
  EQ:    11,
  NEQ:   12,
  LT:    13,
  GT:    14,
  LTE:   15,
  GTE:   16,
  AND:   17,
  OR:    18,
  NOT:   19,
  JMP:   20,
  JZ:    21,
  JNZ:   22,
  STORE: 23,
  LOAD:  24,
  CALL:  25,
  RET:   26,
};

export class VMError extends Error {}

export function assemble(tokens) {
  // tokens: array of strings/numbers or label definitions "LABEL:"
  // Two-pass: first collect label positions, then emit code
  const labels = {};
  const raw = [];
  // Pass 1: find labels
  for (const tok of tokens) {
    if (typeof tok === 'string' && tok.endsWith(':')) {
      labels[tok.slice(0, -1)] = raw.length;
    } else {
      raw.push(tok);
    }
  }
  // Pass 2: resolve label references
  return raw.map(t => (typeof t === 'string' && t in labels) ? labels[t] : t);
}

export function run(program, opts = {}) {
  const maxSteps = opts.maxSteps || 100000;
  const stack = [];
  let vars = {};
  const callStack = [];
  let pc = 0;
  let steps = 0;

  function pop() {
    if (stack.length === 0) throw new VMError('stack underflow');
    return stack.pop();
  }

  while (true) {
    if (steps++ > maxSteps) throw new VMError('max steps exceeded');
    if (pc >= program.length) break;
    const op = program[pc++];

    switch (op) {
      case Op.PUSH:
        stack.push(program[pc++]);
        break;
      case Op.POP:
        pop();
        break;
      case Op.DUP: {
        if (stack.length === 0) throw new VMError('stack underflow');
        stack.push(stack[stack.length - 1]);
        break;
      }
      case Op.SWAP: {
        if (stack.length < 2) throw new VMError('stack underflow: SWAP needs 2');
        const a = stack.pop(), b = stack.pop();
        stack.push(a); stack.push(b);
        break;
      }
      case Op.ADD: { const b = pop(), a = pop(); stack.push(a + b); break; }
      case Op.SUB: { const b = pop(), a = pop(); stack.push(a - b); break; }
      case Op.MUL: { const b = pop(), a = pop(); stack.push(a * b); break; }
      case Op.DIV: {
        const b = pop(), a = pop();
        if (b === 0) throw new VMError('division by zero');
        stack.push(a / b); break;
      }
      case Op.MOD: {
        const b = pop(), a = pop();
        if (b === 0) throw new VMError('modulo by zero');
        stack.push(a % b); break;
      }
      case Op.NEG: stack.push(-pop()); break;
      case Op.HALT: return { stack, vars };
      case Op.EQ:  { const b = pop(), a = pop(); stack.push(a === b ? 1 : 0); break; }
      case Op.NEQ: { const b = pop(), a = pop(); stack.push(a !== b ? 1 : 0); break; }
      case Op.LT:  { const b = pop(), a = pop(); stack.push(a < b ? 1 : 0); break; }
      case Op.GT:  { const b = pop(), a = pop(); stack.push(a > b ? 1 : 0); break; }
      case Op.LTE: { const b = pop(), a = pop(); stack.push(a <= b ? 1 : 0); break; }
      case Op.GTE: { const b = pop(), a = pop(); stack.push(a >= b ? 1 : 0); break; }
      case Op.AND: { const b = pop(), a = pop(); stack.push((a && b) ? 1 : 0); break; }
      case Op.OR:  { const b = pop(), a = pop(); stack.push((a || b) ? 1 : 0); break; }
      case Op.NOT: stack.push(pop() ? 0 : 1); break;
      case Op.JMP: pc = program[pc]; break;
      case Op.JZ:  { const addr = program[pc++]; if (pop() === 0) pc = addr; break; }
      case Op.JNZ: { const addr = program[pc++]; if (pop() !== 0) pc = addr; break; }
      case Op.STORE: { const name = program[pc++]; vars[name] = pop(); break; }
      case Op.LOAD:  { const name = program[pc++]; stack.push(vars[name]); break; }
      case Op.CALL: {
        const target = program[pc++];
        callStack.push({ retAddr: pc, vars: Object.assign({}, vars) });
        vars = {};
        pc = target;
        break;
      }
      case Op.RET: {
        if (callStack.length === 0) throw new VMError('RET with empty call stack');
        const frame = callStack.pop();
        vars = frame.vars;
        pc = frame.retAddr;
        break;
      }
      default:
        throw new VMError('unknown opcode: ' + op);
    }
  }
  return { stack, vars };
}
