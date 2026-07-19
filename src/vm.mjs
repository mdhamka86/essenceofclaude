// Pico VM - stack-based virtual machine
// All opcodes are numeric constants

export const OP = {
  // Stack ops
  PUSH:  0,
  POP:   1,
  DUP:   2,
  SWAP:  3,
  // Arithmetic
  ADD:   4,
  SUB:   5,
  MUL:   6,
  DIV:   7,
  MOD:   8,
  NEG:   9,
  // Comparison (push 1 or 0)
  EQ:   10,
  NEQ:  11,
  LT:   12,
  GT:   13,
  LTE:  14,
  GTE:  15,
  // Logical (push 1 or 0)
  AND:  16,
  OR:   17,
  NOT:  18,
  // Control flow
  JMP:  19,
  JZ:   20,
  JNZ:  21,
  HALT: 22,
  // Variables
  STORE: 23,
  LOAD:  24,
  // Functions
  CALL: 25,
  RET:  26,
  // I/O
  PRINT: 27,
};

// Alias with mixed-case name for convenience
export const Op = OP;

export class VM {
  constructor() {
    this.stack = [];
    this.output = [];   // Captures PRINT output
    this.pc = 0;
    this.vars = {};     // Current scope variables
    this.callStack = []; // For CALL/RET: [{returnPc, vars}, ...]
  }

  /** Reset VM state (reuse instance for multiple programs) */
  reset() {
    this.stack = [];
    this.output = [];
    this.pc = 0;
    this.vars = {};
    this.callStack = [];
  }

  /** Run a flat bytecode array. Returns top of stack when done. */
  run(program) {
    this.reset();
    while (this.pc < program.length) {
      const op = program[this.pc++];
      switch (op) {
        case OP.PUSH: {
          const val = program[this.pc++];
          this.stack.push(val);
          break;
        }
        case OP.POP: {
          this._pop();
          break;
        }
        case OP.DUP: {
          const top = this._peek();
          this.stack.push(top);
          break;
        }
        case OP.SWAP: {
          const b = this._pop();
          const a = this._pop();
          this.stack.push(b);
          this.stack.push(a);
          break;
        }
        case OP.ADD: {
          const b = this._pop(), a = this._pop();
          this.stack.push(a + b);
          break;
        }
        case OP.SUB: {
          const b = this._pop(), a = this._pop();
          this.stack.push(a - b);
          break;
        }
        case OP.MUL: {
          const b = this._pop(), a = this._pop();
          this.stack.push(a * b);
          break;
        }
        case OP.DIV: {
          const b = this._pop(), a = this._pop();
          if (b === 0) throw new Error('Division by zero');
          this.stack.push(a / b);
          break;
        }
        case OP.MOD: {
          const b = this._pop(), a = this._pop();
          if (b === 0) throw new Error('Modulo by zero');
          this.stack.push(a % b);
          break;
        }
        case OP.NEG: {
          const a = this._pop();
          this.stack.push(-a);
          break;
        }
        case OP.EQ: {
          const b = this._pop(), a = this._pop();
          this.stack.push(a === b ? 1 : 0);
          break;
        }
        case OP.NEQ: {
          const b = this._pop(), a = this._pop();
          this.stack.push(a !== b ? 1 : 0);
          break;
        }
        case OP.LT: {
          const b = this._pop(), a = this._pop();
          this.stack.push(a < b ? 1 : 0);
          break;
        }
        case OP.GT: {
          const b = this._pop(), a = this._pop();
          this.stack.push(a > b ? 1 : 0);
          break;
        }
        case OP.LTE: {
          const b = this._pop(), a = this._pop();
          this.stack.push(a <= b ? 1 : 0);
          break;
        }
        case OP.GTE: {
          const b = this._pop(), a = this._pop();
          this.stack.push(a >= b ? 1 : 0);
          break;
        }
        case OP.AND: {
          const b = this._pop(), a = this._pop();
          this.stack.push((a !== 0 && b !== 0) ? 1 : 0);
          break;
        }
        case OP.OR: {
          const b = this._pop(), a = this._pop();
          this.stack.push((a !== 0 || b !== 0) ? 1 : 0);
          break;
        }
        case OP.NOT: {
          const a = this._pop();
          this.stack.push(a === 0 ? 1 : 0);
          break;
        }
        case OP.JMP: {
          const addr = program[this.pc++];
          this.pc = addr;
          break;
        }
        case OP.JZ: {
          const addr = program[this.pc++];
          const cond = this._pop();
          if (cond === 0) this.pc = addr;
          break;
        }
        case OP.JNZ: {
          const addr = program[this.pc++];
          const cond = this._pop();
          if (cond !== 0) this.pc = addr;
          break;
        }
        case OP.HALT: {
          // Return top of stack
          return this.stack[this.stack.length - 1];
        }
        case OP.STORE: {
          const name = program[this.pc++];
          const val = this._pop();
          this.vars[name] = val;
          break;
        }
        case OP.LOAD: {
          const name = program[this.pc++];
          if (!(name in this.vars)) {
            throw new Error(`Undefined variable: ${name}`);
          }
          this.stack.push(this.vars[name]);
          break;
        }
        case OP.CALL: {
          const addr = program[this.pc++];
          // Save return address and current variable scope
          this.callStack.push({ returnPc: this.pc, vars: this.vars });
          // New scope inherits nothing (fresh)
          this.vars = {};
          this.pc = addr;
          break;
        }
        case OP.RET: {
          if (this.callStack.length === 0) {
            throw new Error('RET with empty call stack');
          }
          const frame = this.callStack.pop();
          this.pc = frame.returnPc;
          this.vars = frame.vars;
          break;
        }
        case OP.PRINT: {
          const val = this._pop();
          this.output.push(val);
          console.log(val);
          break;
        }
        default:
          throw new Error(`Unknown opcode: ${op} at pc=${this.pc - 1}`);
      }
    }
    // Fell off end of program - return top of stack
    return this.stack[this.stack.length - 1];
  }

  _pop() {
    if (this.stack.length === 0) throw new Error('Stack underflow');
    return this.stack.pop();
  }

  _peek() {
    if (this.stack.length === 0) throw new Error('Stack underflow');
    return this.stack[this.stack.length - 1];
  }
}
