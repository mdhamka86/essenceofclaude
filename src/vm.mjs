// Pico VM - stack-based bytecode interpreter
// Opcodes
export const PUSH  = 0;
export const POP   = 1;
export const DUP   = 2;
export const SWAP  = 3;
export const ADD   = 4;
export const SUB   = 5;
export const MUL   = 6;
export const DIV   = 7;
export const MOD   = 8;
export const NEG   = 9;
export const HALT  = 10;
export const EQ    = 11;
export const NEQ   = 12;
export const LT    = 13;
export const GT    = 14;
export const LTE   = 15;
export const GTE   = 16;
export const AND   = 17;
export const OR    = 18;
export const NOT   = 19;
export const JMP   = 20;
export const JZ    = 21;
export const JNZ   = 22;
export const STORE = 23;
export const LOAD  = 24;
export const CALL  = 25;
export const RET   = 26;
export const PRINT = 27;

// Bundled namespace (for assembler and other consumers)
export const OP = {
  PUSH, POP, DUP, SWAP, ADD, SUB, MUL, DIV, MOD, NEG, HALT,
  EQ, NEQ, LT, GT, LTE, GTE,
  AND, OR, NOT,
  JMP, JZ, JNZ,
  STORE, LOAD,
  CALL, RET,
  PRINT,
};

export class VMError extends Error {}

export class VM {
  constructor(program, options = {}) {
    this.program   = program;
    this.stack     = [];
    this.pc        = 0;
    this.vars      = {};
    this.callStack = [];
    this.halted    = false;
    this.output    = options.output || ((v) => console.log(v));
  }

  push(v) { this.stack.push(v); }

  pop() {
    if (this.stack.length === 0) throw new VMError('stack underflow');
    return this.stack.pop();
  }

  peek() {
    if (this.stack.length === 0) throw new VMError('stack underflow');
    return this.stack[this.stack.length - 1];
  }

  next() {
    if (this.pc >= this.program.length) throw new VMError('pc out of bounds');
    return this.program[this.pc++];
  }

  run() {
    while (!this.halted) {
      this.step();
    }
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : undefined;
  }

  step() {
    const op = this.next();
    switch (op) {
      case PUSH:  this.push(this.next()); break;
      case POP:   this.pop(); break;
      case DUP:   this.push(this.peek()); break;
      case SWAP: {
        const a = this.pop();
        const b = this.pop();
        if (b === undefined) throw new VMError('SWAP requires two values');
        this.push(a);
        this.push(b);
        break;
      }
      case ADD: { const b = this.pop(), a = this.pop(); this.push(a + b); break; }
      case SUB: { const b = this.pop(), a = this.pop(); this.push(a - b); break; }
      case MUL: { const b = this.pop(), a = this.pop(); this.push(a * b); break; }
      case DIV: {
        const b = this.pop(), a = this.pop();
        if (b === 0) throw new VMError('division by zero');
        this.push(a / b);
        break;
      }
      case MOD: {
        const b = this.pop(), a = this.pop();
        if (b === 0) throw new VMError('mod by zero');
        this.push(a % b);
        break;
      }
      case NEG:  this.push(-this.pop()); break;
      case HALT: this.halted = true; break;

      case EQ:  { const b = this.pop(), a = this.pop(); this.push(a === b ? 1 : 0); break; }
      case NEQ: { const b = this.pop(), a = this.pop(); this.push(a !== b ? 1 : 0); break; }
      case LT:  { const b = this.pop(), a = this.pop(); this.push(a < b  ? 1 : 0); break; }
      case GT:  { const b = this.pop(), a = this.pop(); this.push(a > b  ? 1 : 0); break; }
      case LTE: { const b = this.pop(), a = this.pop(); this.push(a <= b ? 1 : 0); break; }
      case GTE: { const b = this.pop(), a = this.pop(); this.push(a >= b ? 1 : 0); break; }

      case AND: { const b = this.pop(), a = this.pop(); this.push((a && b) ? 1 : 0); break; }
      case OR:  { const b = this.pop(), a = this.pop(); this.push((a || b) ? 1 : 0); break; }
      case NOT: this.push(this.pop() ? 0 : 1); break;

      case JMP: this.pc = this.next(); break;
      case JZ:  { const addr = this.next(); if (this.pop() === 0) this.pc = addr; break; }
      case JNZ: { const addr = this.next(); if (this.pop() !== 0) this.pc = addr; break; }

      case STORE: { const name = this.next(); this.vars[name] = this.pop(); break; }
      case LOAD:  { const name = this.next(); this.push(this.vars[name]); break; }

      case CALL: {
        const addr = this.next();
        this.callStack.push({ returnAddr: this.pc, vars: this.vars });
        this.vars = {};
        this.pc = addr;
        break;
      }
      case RET: {
        if (this.callStack.length === 0) throw new VMError('RET with empty call stack');
        const frame = this.callStack.pop();
        this.pc   = frame.returnAddr;
        this.vars = frame.vars;
        break;
      }

      case PRINT: {
        this.output(this.pop());
        break;
      }

      default:
        throw new VMError(`unknown opcode: ${op}`);
    }
  }
}

// Helper: build program from tagged template or array
// Usage: assemble`PUSH 1 PUSH 2 ADD HALT` (label map optional)
export function assemble(parts, ...labels) {
  // Simple linear assemble from array
  if (Array.isArray(parts)) return parts;
  // Template literal usage
  const src = parts.reduce((acc, s, i) => acc + s + (labels[i] !== undefined ? labels[i] : ''), '');
  return src.trim().split(/\s+/).map(t => {
    const n = Number(t);
    return isNaN(n) ? t : n;
  });
}
