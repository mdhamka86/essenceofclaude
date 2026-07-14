/**
 * Pico VM — a tiny stack-based virtual machine.
 *
 * A program is an array of instructions. Each instruction is either:
 *   - A string opcode (e.g. "ADD", "HALT")
 *   - Or a two-element array [opcode, operand] (e.g. ["PUSH", 42])
 *
 * The VM runs until it encounters HALT or runs out of instructions.
 */

export const Op = Object.freeze({
  // Stack manipulation
  PUSH:  "PUSH",   // [PUSH, value] — push a literal onto the stack
  POP:   "POP",    // pop and discard the top of stack
  DUP:   "DUP",    // duplicate the top of stack
  SWAP:  "SWAP",   // swap the top two elements

  // Arithmetic (pop operands, push result)
  ADD:   "ADD",
  SUB:   "SUB",
  MUL:   "MUL",
  DIV:   "DIV",
  MOD:   "MOD",
  NEG:   "NEG",    // negate top of stack

  // Halt
  HALT:  "HALT",
});

export class VMError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "VMError";
  }
}

export class VM {
  constructor() {
    this.stack = [];
    this.pc = 0;       // program counter
    this.halted = false;
  }

  /** Load and run a program. Returns the final stack. */
  run(program) {
    this.stack = [];
    this.pc = 0;
    this.halted = false;

    while (this.pc < program.length && !this.halted) {
      const instr = program[this.pc];
      this.pc++;

      let opcode, operand;
      if (Array.isArray(instr)) {
        [opcode, operand] = instr;
      } else {
        opcode = instr;
        operand = undefined;
      }

      this._execute(opcode, operand);
    }

    return [...this.stack];
  }

  /** Execute a single opcode. */
  _execute(opcode, operand) {
    switch (opcode) {
      // ── Stack ops ────────────────────────────────────────────────────────
      case Op.PUSH:
        if (operand === undefined) throw new VMError("PUSH requires an operand");
        this.stack.push(operand);
        break;

      case Op.POP:
        this._requireStack(1, "POP");
        this.stack.pop();
        break;

      case Op.DUP: {
        this._requireStack(1, "DUP");
        const top = this.stack[this.stack.length - 1];
        this.stack.push(top);
        break;
      }

      case Op.SWAP: {
        this._requireStack(2, "SWAP");
        const a = this.stack.pop();
        const b = this.stack.pop();
        this.stack.push(a);
        this.stack.push(b);
        break;
      }

      // ── Arithmetic ───────────────────────────────────────────────────────
      case Op.ADD: {
        this._requireStack(2, "ADD");
        const r = this.stack.pop();
        const l = this.stack.pop();
        this.stack.push(l + r);
        break;
      }

      case Op.SUB: {
        this._requireStack(2, "SUB");
        const r = this.stack.pop();
        const l = this.stack.pop();
        this.stack.push(l - r);
        break;
      }

      case Op.MUL: {
        this._requireStack(2, "MUL");
        const r = this.stack.pop();
        const l = this.stack.pop();
        this.stack.push(l * r);
        break;
      }

      case Op.DIV: {
        this._requireStack(2, "DIV");
        const r = this.stack.pop();
        const l = this.stack.pop();
        if (r === 0) throw new VMError("Division by zero");
        this.stack.push(l / r);
        break;
      }

      case Op.MOD: {
        this._requireStack(2, "MOD");
        const r = this.stack.pop();
        const l = this.stack.pop();
        if (r === 0) throw new VMError("Modulo by zero");
        this.stack.push(l % r);
        break;
      }

      case Op.NEG: {
        this._requireStack(1, "NEG");
        this.stack.push(-this.stack.pop());
        break;
      }

      // ── Control ──────────────────────────────────────────────────────────
      case Op.HALT:
        this.halted = true;
        break;

      default:
        throw new VMError(`Unknown opcode: ${opcode}`);
    }
  }

  _requireStack(n, op) {
    if (this.stack.length < n) {
      throw new VMError(
        `Stack underflow on ${op}: need ${n} value(s), have ${this.stack.length}`
      );
    }
  }

  /** Peek at the top of stack without running (useful after run()). */
  top() {
    if (this.stack.length === 0) throw new VMError("Stack is empty");
    return this.stack[this.stack.length - 1];
  }
}
