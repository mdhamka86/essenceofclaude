export class VMError extends Error {
  constructor(msg) { super(msg); this.name = 'VMError'; }
}

export class VM {
  constructor(memory = 256) {
    this.stack = [];
    this.mem = new Array(memory).fill(0);
    this.callStack = [];
    this.output = [];
  }

  run(program) {
    const s = this.stack;
    const m = this.mem;
    let ip = 0;
    const maxSteps = 100000;
    let steps = 0;

    while (ip < program.length) {
      if (++steps > maxSteps) throw new VMError('Execution limit exceeded');
      const op = program[ip++];
      switch (op) {
        case 0: { // PUSH
          s.push(program[ip++]);
          break;
        }
        case 1: { // ADD
          const b = s.pop(); const a = s.pop();
          s.push(a + b);
          break;
        }
        case 2: { // SUB
          const b = s.pop(); const a = s.pop();
          s.push(a - b);
          break;
        }
        case 3: { // MUL
          const b = s.pop(); const a = s.pop();
          s.push(a * b);
          break;
        }
        case 4: { // DIV
          const b = s.pop(); const a = s.pop();
          if (b === 0) throw new VMError('Division by zero');
          s.push(Math.trunc(a / b));
          break;
        }
        case 5: { // MOD
          const b = s.pop(); const a = s.pop();
          if (b === 0) throw new VMError('Modulo by zero');
          s.push(a % b);
          break;
        }
        case 6: { // NEG
          s.push(-s.pop());
          break;
        }
        case 7: { // POP
          s.pop();
          break;
        }
        case 8: { // DUP
          if (s.length === 0) throw new VMError('Stack underflow');
          s.push(s[s.length - 1]);
          break;
        }
        case 9: { // SWAP
          if (s.length < 2) throw new VMError('Stack underflow');
          const b = s.pop(); const a = s.pop();
          s.push(b); s.push(a);
          break;
        }
        case 10: { // HALT
          return;
        }
        case 11: { // EQ
          const b = s.pop(); const a = s.pop();
          s.push(a === b ? 1 : 0);
          break;
        }
        case 12: { // NEQ
          const b = s.pop(); const a = s.pop();
          s.push(a !== b ? 1 : 0);
          break;
        }
        case 13: { // LT
          const b = s.pop(); const a = s.pop();
          s.push(a < b ? 1 : 0);
          break;
        }
        case 14: { // GT
          const b = s.pop(); const a = s.pop();
          s.push(a > b ? 1 : 0);
          break;
        }
        case 15: { // LTE
          const b = s.pop(); const a = s.pop();
          s.push(a <= b ? 1 : 0);
          break;
        }
        case 16: { // GTE
          const b = s.pop(); const a = s.pop();
          s.push(a >= b ? 1 : 0);
          break;
        }
        case 17: { // AND
          const b = s.pop(); const a = s.pop();
          s.push(a !== 0 && b !== 0 ? 1 : 0);
          break;
        }
        case 18: { // OR
          const b = s.pop(); const a = s.pop();
          s.push(a !== 0 || b !== 0 ? 1 : 0);
          break;
        }
        case 19: { // NOT
          s.push(s.pop() === 0 ? 1 : 0);
          break;
        }
        case 20: { // JMP
          ip = program[ip];
          break;
        }
        case 21: { // JZ
          const target = program[ip++];
          if (s.pop() === 0) ip = target;
          break;
        }
        case 22: { // JNZ
          const target = program[ip++];
          if (s.pop() !== 0) ip = target;
          break;
        }
        case 23: { // STORE
          const addr = program[ip++];
          m[addr] = s.pop();
          break;
        }
        case 24: { // LOAD
          const addr = program[ip++];
          s.push(m[addr]);
          break;
        }
        case 25: { // CALL
          const dest = program[ip++];
          this.callStack.push(ip);
          ip = dest;
          break;
        }
        case 26: { // RET
          if (this.callStack.length === 0) throw new VMError('Call stack underflow');
          ip = this.callStack.pop();
          break;
        }
        case 27: { // PRINT
          const val = s.pop();
          this.output.push(val);
          break;
        }
        default:
          throw new VMError('Unknown opcode: ' + op);
      }
    }
  }
}
