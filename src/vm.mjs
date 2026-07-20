// Pico VM - stack-based virtual machine
// Opcodes are plain integers; use the OP object as named constants.

export const OP = {
  PUSH:  0,
  ADD:   1,
  SUB:   2,
  MUL:   3,
  DIV:   4,
  MOD:   5,
  NEG:   6,
  POP:   7,
  DUP:   8,
  SWAP:  9,
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
  PRINT: 27,
};

// Alias for convenience
export const Op = OP;

export class VM {
  constructor() {
    this.stack = [];
    this.output = [];
    this.callStack = [];
    this.vars = [{}]; // stack of variable scopes
  }

  push(v) { this.stack.push(v); }
  pop()    { if (this.stack.length === 0) throw new Error('Stack underflow'); return this.stack.pop(); }
  peek()   { if (this.stack.length === 0) throw new Error('Stack underflow'); return this.stack[this.stack.length - 1]; }

  run(program) {
    let pc = 0;
    while (pc < program.length) {
      const op = program[pc++];
      switch (op) {
        case OP.PUSH: {
          this.push(program[pc++]);
          break;
        }
        case OP.ADD: {
          const b = this.pop(); const a = this.pop();
          this.push(a + b);
          break;
        }
        case OP.SUB: {
          const b = this.pop(); const a = this.pop();
          this.push(a - b);
          break;
        }
        case OP.MUL: {
          const b = this.pop(); const a = this.pop();
          this.push(a * b);
          break;
        }
        case OP.DIV: {
          const b = this.pop(); const a = this.pop();
          if (b === 0) throw new Error('Division by zero');
          this.push(a / b);
          break;
        }
        case OP.MOD: {
          const b = this.pop(); const a = this.pop();
          this.push(a % b);
          break;
        }
        case OP.NEG: {
          this.push(-this.pop());
          break;
        }
        case OP.POP: {
          this.pop();
          break;
        }
        case OP.DUP: {
          this.push(this.peek());
          break;
        }
        case OP.SWAP: {
          const b = this.pop(); const a = this.pop();
          this.push(b); this.push(a);
          break;
        }
        case OP.HALT: {
          return this.stack.length > 0 ? this.stack[this.stack.length - 1] : undefined;
        }
        case OP.EQ: {
          const b = this.pop(); const a = this.pop();
          this.push(a === b ? 1 : 0);
          break;
        }
        case OP.NEQ: {
          const b = this.pop(); const a = this.pop();
          this.push(a !== b ? 1 : 0);
          break;
        }
        case OP.LT: {
          const b = this.pop(); const a = this.pop();
          this.push(a < b ? 1 : 0);
          break;
        }
        case OP.GT: {
          const b = this.pop(); const a = this.pop();
          this.push(a > b ? 1 : 0);
          break;
        }
        case OP.LTE: {
          const b = this.pop(); const a = this.pop();
          this.push(a <= b ? 1 : 0);
          break;
        }
        case OP.GTE: {
          const b = this.pop(); const a = this.pop();
          this.push(a >= b ? 1 : 0);
          break;
        }
        case OP.AND: {
          const b = this.pop(); const a = this.pop();
          this.push((a !== 0 && b !== 0) ? 1 : 0);
          break;
        }
        case OP.OR: {
          const b = this.pop(); const a = this.pop();
          this.push((a !== 0 || b !== 0) ? 1 : 0);
          break;
        }
        case OP.NOT: {
          this.push(this.pop() === 0 ? 1 : 0);
          break;
        }
        case OP.JMP: {
          pc = program[pc];
          break;
        }
        case OP.JZ: {
          const target = program[pc++];
          if (this.pop() === 0) pc = target;
          break;
        }
        case OP.JNZ: {
          const target = program[pc++];
          if (this.pop() !== 0) pc = target;
          break;
        }
        case OP.STORE: {
          const name = program[pc++];
          this.vars[this.vars.length - 1][name] = this.pop();
          break;
        }
        case OP.LOAD: {
          const name = program[pc++];
          const scope = this.vars[this.vars.length - 1];
          if (!(name in scope)) throw new Error('Undefined variable: ' + name);
          this.push(scope[name]);
          break;
        }
        case OP.CALL: {
          const target = program[pc++];
          this.callStack.push(pc);
          this.vars.push({});
          pc = target;
          break;
        }
        case OP.RET: {
          if (this.callStack.length === 0) throw new Error('RET with empty call stack');
          pc = this.callStack.pop();
          this.vars.pop();
          break;
        }
        case OP.PRINT: {
          const v = this.pop();
          this.output.push(v);
          console.log(v);
          break;
        }
        default:
          throw new Error('Unknown opcode: ' + op);
      }
    }
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : undefined;
  }
}
