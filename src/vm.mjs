// Pico VM - stack-based virtual machine
export class VMError extends Error {}

export const Op = {
  PUSH:  0,
  ADD:   1,
  SUB:   2,
  MUL:   3,
  DIV:   4,
  MOD:   5,
  DUP:   6,
  POP:   7,
  SWAP:  8,
  NEG:   9,
  HALT:  10,
  EQ:    11,
  LT:    12,
  GT:    13,
  AND:   14,
  OR:    15,
  NOT:   16,
  JMP:   20,
  JZ:    21,
  JNZ:   22,
  STORE: 23,
  LOAD:  24,
  CALL:  25,
  RET:   26,
  PRINT: 27,
};

export class VM {
  constructor(bytecode) {
    this.code = bytecode instanceof Uint8Array ? bytecode : new Uint8Array(bytecode);
    this.stack = [];
    this.mem = new Array(256).fill(0);
    this.callStack = [];
    this.ip = 0;
    this.output = [];
  }

  push(v) { this.stack.push(v); }
  pop() {
    if (this.stack.length === 0) throw new VMError('Stack underflow');
    return this.stack.pop();
  }
  peek() {
    if (this.stack.length === 0) throw new VMError('Stack empty');
    return this.stack[this.stack.length - 1];
  }

  step() {
    const op = this.code[this.ip++];
    switch (op) {
      case Op.PUSH: { const v = this.code[this.ip++]; this.push(v); break; }
      case Op.ADD:  { const b = this.pop(), a = this.pop(); this.push(a + b); break; }
      case Op.SUB:  { const b = this.pop(), a = this.pop(); this.push(a - b); break; }
      case Op.MUL:  { const b = this.pop(), a = this.pop(); this.push(a * b); break; }
      case Op.DIV:  { const b = this.pop(), a = this.pop(); if (b === 0) throw new VMError('Div by zero'); this.push(Math.trunc(a / b)); break; }
      case Op.MOD:  { const b = this.pop(), a = this.pop(); if (b === 0) throw new VMError('Mod by zero'); this.push(a % b); break; }
      case Op.DUP:  { this.push(this.peek()); break; }
      case Op.POP:  { this.pop(); break; }
      case Op.SWAP: { const b = this.pop(), a = this.pop(); this.push(b); this.push(a); break; }
      case Op.NEG:  { this.push(-this.pop()); break; }
      case Op.HALT: { return false; }
      case Op.EQ:   { const b = this.pop(), a = this.pop(); this.push(a === b ? 1 : 0); break; }
      case Op.LT:   { const b = this.pop(), a = this.pop(); this.push(a < b ? 1 : 0); break; }
      case Op.GT:   { const b = this.pop(), a = this.pop(); this.push(a > b ? 1 : 0); break; }
      case Op.AND:  { const b = this.pop(), a = this.pop(); this.push(a && b ? 1 : 0); break; }
      case Op.OR:   { const b = this.pop(), a = this.pop(); this.push(a || b ? 1 : 0); break; }
      case Op.NOT:  { this.push(this.pop() === 0 ? 1 : 0); break; }
      case Op.JMP:  { this.ip = this.code[this.ip]; break; }
      case Op.JZ:   { const addr = this.code[this.ip++]; if (this.pop() === 0) this.ip = addr; break; }
      case Op.JNZ:  { const addr = this.code[this.ip++]; if (this.pop() !== 0) this.ip = addr; break; }
      case Op.STORE:{ const addr = this.code[this.ip++]; this.mem[addr] = this.pop(); break; }
      case Op.LOAD: { const addr = this.code[this.ip++]; this.push(this.mem[addr]); break; }
      case Op.CALL: { const addr = this.code[this.ip++]; this.callStack.push(this.ip); this.ip = addr; break; }
      case Op.RET:  { if (this.callStack.length === 0) throw new VMError('Empty call stack'); this.ip = this.callStack.pop(); break; }
      case Op.PRINT:{ this.output.push(this.pop()); break; }
      default: throw new VMError('Unknown opcode: ' + op);
    }
    return true;
  }

  run(maxSteps = 100000) {
    let steps = 0;
    while (this.step()) {
      if (++steps > maxSteps) throw new VMError('Max steps exceeded');
    }
    return this;
  }
}

export function run(bytecode) {
  const vm = new VM(bytecode);
  vm.run();
  return vm.stack.length > 0 ? vm.stack[vm.stack.length - 1] : undefined;
}

export { assemble } from './assembler.mjs';
