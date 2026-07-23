// Pico VM - stack-based virtual machine

export class VMError extends Error {
  constructor(msg) { super(msg); this.name = 'VMError'; }
}

export const Op = {
  PUSH:  0,
  ADD:   1,
  SUB:   2,
  MUL:   3,
  DIV:   4,
  MOD:   5,
  EQ:    6,
  LT:    7,
  GT:    8,
  NOT:   9,
  HALT:  10,
  POP:   11,
  DUP:   12,
  SWAP:  13,
  JZ:    21,
  LOAD:  20,
  STORE: 22,
  JMP:   23,
  JNZ:   24,
  CALL:  25,
  RET:   26,
  PRINT: 27,
};

export class VM {
  constructor(bytecode, opts = {}) {
    this.bc = bytecode;
    this.stack = [];
    this.mem = {};
    this.callStack = [];
    this.ip = 0;
    this.output = [];
    this.log = opts.log || null;
    this.maxSteps = opts.maxSteps || 100000;
  }

  pop() {
    if (this.stack.length === 0) throw new VMError('Stack underflow');
    return this.stack.pop();
  }

  push(v) { this.stack.push(v); }

  run() {
    let steps = 0;
    while (true) {
      if (steps++ > this.maxSteps) throw new VMError('Step limit exceeded');
      const op = this.bc[this.ip];
      if (op === undefined) throw new VMError('IP out of bounds: ' + this.ip);
      this.ip++;
      switch (op) {
        case Op.PUSH: this.push(this.bc[this.ip++]); break;
        case Op.ADD:  this.push(this.pop() + this.pop()); break;
        case Op.SUB:  { const b = this.pop(), a = this.pop(); this.push(a - b); break; }
        case Op.MUL:  this.push(this.pop() * this.pop()); break;
        case Op.DIV:  { const b = this.pop(), a = this.pop(); if (b === 0) throw new VMError('Division by zero'); this.push(Math.trunc(a / b)); break; }
        case Op.MOD:  { const b = this.pop(), a = this.pop(); if (b === 0) throw new VMError('Division by zero'); this.push(a % b); break; }
        case Op.EQ:   this.push(this.pop() === this.pop() ? 1 : 0); break;
        case Op.LT:   { const b = this.pop(), a = this.pop(); this.push(a < b ? 1 : 0); break; }
        case Op.GT:   { const b = this.pop(), a = this.pop(); this.push(a > b ? 1 : 0); break; }
        case Op.NOT:  this.push(this.pop() === 0 ? 1 : 0); break;
        case Op.HALT: return this.stack.length > 0 ? this.stack[this.stack.length - 1] : 0;
        case Op.POP:  this.pop(); break;
        case Op.DUP:  { const v = this.pop(); this.push(v); this.push(v); break; }
        case Op.SWAP: { const b = this.pop(), a = this.pop(); this.push(b); this.push(a); break; }
        case Op.LOAD: { const addr = this.bc[this.ip++]; this.push(this.mem[addr] || 0); break; }
        case Op.STORE:{ const addr = this.bc[this.ip++]; this.mem[addr] = this.pop(); break; }
        case Op.JMP:  this.ip = this.bc[this.ip]; break;
        case Op.JZ:   { const target = this.bc[this.ip++]; if (this.pop() === 0) this.ip = target; break; }
        case Op.JNZ:  { const target = this.bc[this.ip++]; if (this.pop() !== 0) this.ip = target; break; }
        case Op.CALL: { const target = this.bc[this.ip++]; this.callStack.push(this.ip); this.ip = target; break; }
        case Op.RET:  { const ret = this.callStack.pop(); if (ret === undefined) throw new VMError('RET with empty call stack'); this.ip = ret; break; }
        case Op.PRINT:{ const v = this.pop(); this.output.push(v); if (this.log) this.log(v); break; }
        default: throw new VMError('Unknown opcode: ' + op);
      }
    }
  }
}
