// Pico VM - stack-based virtual machine
export class VMError extends Error {}

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
  LT:    12,
  GT:    13,
  AND:   14,
  OR:    15,
  NOT:   16,
  PRINT: 17,
  NOP:   18,
  INC:   19,
  JMP:   20,
  JZ:    21,
  JNZ:   22,
  STORE: 23,
  LOAD:  24,
  CALL:  25,
  RET:   26,
  DEC:   27,
};

export { assemble } from './assembler.mjs';

export class VM {
  constructor(program) {
    this.prog = program instanceof Uint8Array ? program : new Uint8Array(program);
    this.stack = [];
    this.mem = new Array(256).fill(0);
    this.callStack = [];
    this.pc = 0;
    this.output = [];
    this.halted = false;
  }

  step() {
    if (this.halted) return false;
    if (this.pc >= this.prog.length) throw new VMError('PC out of bounds: ' + this.pc);
    const op = this.prog[this.pc++];
    const pop = () => {
      if (!this.stack.length) throw new VMError('Stack underflow');
      return this.stack.pop();
    };
    switch (op) {
      case Op.PUSH:  this.stack.push(this.prog[this.pc++]); break;
      case Op.POP:   pop(); break;
      case Op.DUP:   { const v = pop(); this.stack.push(v); this.stack.push(v); break; }
      case Op.SWAP:  { const b = pop(), a = pop(); this.stack.push(b); this.stack.push(a); break; }
      case Op.ADD:   { const b = pop(), a = pop(); this.stack.push(a + b); break; }
      case Op.SUB:   { const b = pop(), a = pop(); this.stack.push(a - b); break; }
      case Op.MUL:   { const b = pop(), a = pop(); this.stack.push(a * b); break; }
      case Op.DIV:   { const b = pop(), a = pop(); if (!b) throw new VMError('Division by zero'); this.stack.push(Math.trunc(a / b)); break; }
      case Op.MOD:   { const b = pop(), a = pop(); if (!b) throw new VMError('Division by zero'); this.stack.push(a % b); break; }
      case Op.NEG:   this.stack.push(-pop()); break;
      case Op.HALT:  this.halted = true; return false;
      case Op.EQ:    { const b = pop(), a = pop(); this.stack.push(a === b ? 1 : 0); break; }
      case Op.LT:    { const b = pop(), a = pop(); this.stack.push(a < b ? 1 : 0); break; }
      case Op.GT:    { const b = pop(), a = pop(); this.stack.push(a > b ? 1 : 0); break; }
      case Op.AND:   { const b = pop(), a = pop(); this.stack.push(a && b ? 1 : 0); break; }
      case Op.OR:    { const b = pop(), a = pop(); this.stack.push(a || b ? 1 : 0); break; }
      case Op.NOT:   this.stack.push(pop() ? 0 : 1); break;
      case Op.PRINT: this.output.push(pop()); break;
      case Op.NOP:   break;
      case Op.INC:   this.stack.push(pop() + 1); break;
      case Op.DEC:   this.stack.push(pop() - 1); break;
      case Op.JMP:   { const addr = this.prog[this.pc++]; this.pc = addr; break; }
      case Op.JZ:    { const addr = this.prog[this.pc++]; if (pop() === 0) this.pc = addr; break; }
      case Op.JNZ:   { const addr = this.prog[this.pc++]; if (pop() !== 0) this.pc = addr; break; }
      case Op.STORE: { const addr = this.prog[this.pc++]; this.mem[addr] = pop(); break; }
      case Op.LOAD:  { const addr = this.prog[this.pc++]; this.stack.push(this.mem[addr]); break; }
      case Op.CALL:  { const addr = this.prog[this.pc++]; this.callStack.push(this.pc); this.pc = addr; break; }
      case Op.RET:   { if (!this.callStack.length) throw new VMError('Call stack underflow'); this.pc = this.callStack.pop(); break; }
      default: throw new VMError('Unknown opcode: ' + op);
    }
    return true;
  }

  run(maxSteps = 100000) {
    let steps = 0;
    while (!this.halted && steps < maxSteps) {
      this.step();
      steps++;
    }
    if (!this.halted) throw new VMError('Max steps exceeded');
    return this;
  }

  top() {
    if (!this.stack.length) throw new VMError('Stack empty');
    return this.stack[this.stack.length - 1];
  }
}
