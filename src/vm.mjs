// Pico VM - stack-based virtual machine
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

// OP namespace (both spellings for compatibility)
export const OP = {
  PUSH, POP, DUP, SWAP,
  ADD, SUB, MUL, DIV, MOD, NEG,
  HALT,
  EQ, NEQ, LT, GT, LTE, GTE,
  AND, OR, NOT,
  JMP, JZ, JNZ,
  STORE, LOAD,
  CALL, RET,
  PRINT
};

// Alias for tests that import Op
export const Op = OP;

export class VM {
  constructor(program) {
    this.program = program;
    this.stack = [];
    this.pc = 0;
    this.vars = {};
    this.callStack = [];
    this.output = []; // collects PRINT output
  }

  push(v) { this.stack.push(v); }

  pop() {
    if (this.stack.length === 0) throw new Error('Stack underflow');
    return this.stack.pop();
  }

  peek() {
    if (this.stack.length === 0) throw new Error('Stack underflow');
    return this.stack[this.stack.length - 1];
  }

  run() {
    while (true) {
      if (this.pc >= this.program.length) break;
      const op = this.program[this.pc++];
      switch (op) {
        case PUSH: {
          const val = this.program[this.pc++];
          this.push(val);
          break;
        }
        case POP:
          this.pop();
          break;
        case DUP:
          this.push(this.peek());
          break;
        case SWAP: {
          const a = this.pop();
          const b = this.pop();
          this.push(a);
          this.push(b);
          break;
        }
        case ADD: {
          const b = this.pop();
          const a = this.pop();
          this.push(a + b);
          break;
        }
        case SUB: {
          const b = this.pop();
          const a = this.pop();
          this.push(a - b);
          break;
        }
        case MUL: {
          const b = this.pop();
          const a = this.pop();
          this.push(a * b);
          break;
        }
        case DIV: {
          const b = this.pop();
          const a = this.pop();
          if (b === 0) throw new Error('Division by zero');
          this.push(a / b);
          break;
        }
        case MOD: {
          const b = this.pop();
          const a = this.pop();
          if (b === 0) throw new Error('Division by zero');
          this.push(a % b);
          break;
        }
        case NEG:
          this.push(-this.pop());
          break;
        case HALT:
          return;
        case EQ: {
          const b = this.pop();
          const a = this.pop();
          this.push(a === b ? 1 : 0);
          break;
        }
        case NEQ: {
          const b = this.pop();
          const a = this.pop();
          this.push(a !== b ? 1 : 0);
          break;
        }
        case LT: {
          const b = this.pop();
          const a = this.pop();
          this.push(a < b ? 1 : 0);
          break;
        }
        case GT: {
          const b = this.pop();
          const a = this.pop();
          this.push(a > b ? 1 : 0);
          break;
        }
        case LTE: {
          const b = this.pop();
          const a = this.pop();
          this.push(a <= b ? 1 : 0);
          break;
        }
        case GTE: {
          const b = this.pop();
          const a = this.pop();
          this.push(a >= b ? 1 : 0);
          break;
        }
        case AND: {
          const b = this.pop();
          const a = this.pop();
          this.push((a !== 0 && b !== 0) ? 1 : 0);
          break;
        }
        case OR: {
          const b = this.pop();
          const a = this.pop();
          this.push((a !== 0 || b !== 0) ? 1 : 0);
          break;
        }
        case NOT:
          this.push(this.pop() === 0 ? 1 : 0);
          break;
        case JMP: {
          const addr = this.program[this.pc++];
          this.pc = addr;
          break;
        }
        case JZ: {
          const addr = this.program[this.pc++];
          const val = this.pop();
          if (val === 0) this.pc = addr;
          break;
        }
        case JNZ: {
          const addr = this.program[this.pc++];
          const val = this.pop();
          if (val !== 0) this.pc = addr;
          break;
        }
        case STORE: {
          const name = this.program[this.pc++];
          this.vars[name] = this.pop();
          break;
        }
        case LOAD: {
          const name = this.program[this.pc++];
          if (!(name in this.vars)) throw new Error('Undefined variable: ' + name);
          this.push(this.vars[name]);
          break;
        }
        case CALL: {
          const addr = this.program[this.pc++];
          this.callStack.push({ returnAddr: this.pc, vars: this.vars });
          this.vars = Object.assign({}, this.vars);
          this.pc = addr;
          break;
        }
        case RET: {
          if (this.callStack.length === 0) throw new Error('RET with empty call stack');
          const frame = this.callStack.pop();
          this.pc = frame.returnAddr;
          this.vars = frame.vars;
          break;
        }
        case PRINT: {
          const val = this.pop();
          this.output.push(val);
          console.log(val);
          break;
        }
        default:
          throw new Error('Unknown opcode: ' + op);
      }
    }
  }
}

// Helper to build programs concisely in tests
export function assemble(...args) {
  return args;
}
