// Pico VM - stack-based bytecode interpreter

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
};

export class VM {
  constructor(program) {
    this.program = program;
    this.stack = [];
    this.vars = {};
    this.pc = 0;
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

  run() {
    while (this.pc < this.program.length) {
      const op = this.program[this.pc++];
      switch (op) {
        case Op.PUSH:
          this.push(this.program[this.pc++]);
          break;
        case Op.POP:
          this.pop();
          break;
        case Op.DUP:
          this.push(this.peek());
          break;
        case Op.SWAP: {
          const a = this.pop();
          const b = this.pop();
          this.push(a);
          this.push(b);
          break;
        }
        case Op.ADD: { const b=this.pop(),a=this.pop(); this.push(a+b); break; }
        case Op.SUB: { const b=this.pop(),a=this.pop(); this.push(a-b); break; }
        case Op.MUL: { const b=this.pop(),a=this.pop(); this.push(a*b); break; }
        case Op.DIV: {
          const b=this.pop(),a=this.pop();
          if (b===0) throw new VMError('division by zero');
          this.push(a/b);
          break;
        }
        case Op.MOD: {
          const b=this.pop(),a=this.pop();
          if (b===0) throw new VMError('mod by zero');
          this.push(a%b);
          break;
        }
        case Op.NEG: this.push(-this.pop()); break;
        case Op.HALT: return;
        case Op.EQ:  { const b=this.pop(),a=this.pop(); this.push(a===b?1:0); break; }
        case Op.NEQ: { const b=this.pop(),a=this.pop(); this.push(a!==b?1:0); break; }
        case Op.LT:  { const b=this.pop(),a=this.pop(); this.push(a<b?1:0); break; }
        case Op.GT:  { const b=this.pop(),a=this.pop(); this.push(a>b?1:0); break; }
        case Op.LTE: { const b=this.pop(),a=this.pop(); this.push(a<=b?1:0); break; }
        case Op.GTE: { const b=this.pop(),a=this.pop(); this.push(a>=b?1:0); break; }
        case Op.AND: { const b=this.pop(),a=this.pop(); this.push((a&&b)?1:0); break; }
        case Op.OR:  { const b=this.pop(),a=this.pop(); this.push((a||b)?1:0); break; }
        case Op.NOT: this.push(this.pop()===0?1:0); break;
        case Op.JMP: this.pc = this.program[this.pc]; break;
        case Op.JZ:  { const t=this.program[this.pc++]; if(this.pop()===0) this.pc=t; break; }
        case Op.JNZ: { const t=this.program[this.pc++]; if(this.pop()!==0) this.pc=t; break; }
        case Op.STORE: { const n=this.program[this.pc++]; this.vars[n]=this.pop(); break; }
        case Op.LOAD:  { const n=this.program[this.pc++]; this.push(this.vars[n]); break; }
        default:
          throw new VMError('unknown opcode: ' + op);
      }
    }
  }
}

// Helper: resolve label names in a program array
// Labels are strings like 'loop:' which become index markers
export function assemble(source) {
  const labels = {};
  const pass1 = [];
  for (const token of source) {
    if (typeof token === 'string' && token.endsWith(':')) {
      labels[token.slice(0, -1)] = pass1.length;
    } else {
      pass1.push(token);
    }
  }
  return pass1.map(t => (typeof t === 'string' && labels[t] !== undefined) ? labels[t] : t);
}
