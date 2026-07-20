// Pico VM Assembler
// Converts .pico source text into a bytecode array for the VM.
//
// Syntax:
//   MNEMONIC [arg]   - instruction with optional argument
//   label:           - label definition (standalone on a line)
//   ; comment        - rest of line is a comment
//
// Example:
//   PUSH 10
//   PUSH 20
//   ADD
//   HALT

import { OP } from './vm.mjs';

// Opcode table: mnemonic -> { op, args }
// args is the number of inline arguments in the bytecode stream
const OPCODES = {
  PUSH:  { op: OP.PUSH,  args: 1 },  // arg: number literal
  ADD:   { op: OP.ADD,   args: 0 },
  SUB:   { op: OP.SUB,   args: 0 },
  MUL:   { op: OP.MUL,   args: 0 },
  DIV:   { op: OP.DIV,   args: 0 },
  MOD:   { op: OP.MOD,   args: 0 },
  NEG:   { op: OP.NEG,   args: 0 },
  POP:   { op: OP.POP,   args: 0 },
  DUP:   { op: OP.DUP,   args: 0 },
  SWAP:  { op: OP.SWAP,  args: 0 },
  HALT:  { op: OP.HALT,  args: 0 },
  EQ:    { op: OP.EQ,    args: 0 },
  NEQ:   { op: OP.NEQ,   args: 0 },
  LT:    { op: OP.LT,    args: 0 },
  GT:    { op: OP.GT,    args: 0 },
  LTE:   { op: OP.LTE,   args: 0 },
  GTE:   { op: OP.GTE,   args: 0 },
  AND:   { op: OP.AND,   args: 0 },
  OR:    { op: OP.OR,    args: 0 },
  NOT:   { op: OP.NOT,   args: 0 },
  JMP:   { op: OP.JMP,   args: 1, labelArg: true },
  JZ:    { op: OP.JZ,    args: 1, labelArg: true },
  JNZ:   { op: OP.JNZ,   args: 1, labelArg: true },
  STORE: { op: OP.STORE, args: 1, nameArg: true },
  LOAD:  { op: OP.LOAD,  args: 1, nameArg: true },
  CALL:  { op: OP.CALL,  args: 1, labelArg: true },
  RET:   { op: OP.RET,   args: 0 },
  PRINT: { op: OP.PRINT, args: 0 },
};

/**
 * Assemble a .pico source string into a bytecode array.
 * @param {string} source
 * @returns {Array} bytecode
 */
export function assemble(source) {
  const lines = source.split('\n');

  // Tokenise: strip comments, split into tokens, tag label defs
  const tokens = []; // array of { type: 'label'|'instr', ... }
  for (let raw of lines) {
    // Strip comment
    const semi = raw.indexOf(';');
    if (semi !== -1) raw = raw.slice(0, semi);
    const line = raw.trim();
    if (!line) continue;

    // Label definition: ends with ':'
    if (line.endsWith(':')) {
      const name = line.slice(0, -1).trim();
      tokens.push({ type: 'label', name });
      continue;
    }

    // Instruction: first word is mnemonic, rest is arg
    const parts = line.split(/\s+/);
    const mnemonic = parts[0].toUpperCase();
    const arg = parts[1] !== undefined ? parts[1] : null;
    tokens.push({ type: 'instr', mnemonic, arg });
  }

  // First pass: calculate bytecode positions of each token
  // and build label -> position map
  // We simulate the bytecode size without emitting
  const labels = {};
  let pos = 0;
  for (const tok of tokens) {
    if (tok.type === 'label') {
      labels[tok.name] = pos;
    } else {
      // type === 'instr'
      const def = OPCODES[tok.mnemonic];
      if (!def) throw new Error('Unknown mnemonic: ' + tok.mnemonic);
      pos += 1 + def.args; // opcode byte + argument bytes
    }
  }

  // Second pass: emit bytecode
  const bytecode = [];
  for (const tok of tokens) {
    if (tok.type === 'label') continue;
    const def = OPCODES[tok.mnemonic];
    bytecode.push(def.op);
    if (def.args === 1) {
      if (def.labelArg) {
        // arg is a label name; resolve to position
        const target = labels[tok.arg];
        if (target === undefined) throw new Error('Undefined label: ' + tok.arg);
        bytecode.push(target);
      } else if (def.nameArg) {
        // arg is a variable name string
        bytecode.push(tok.arg);
      } else {
        // arg is a numeric literal
        const n = Number(tok.arg);
        if (isNaN(n)) throw new Error('Expected number argument for ' + tok.mnemonic + ', got: ' + tok.arg);
        bytecode.push(n);
      }
    }
  }

  return bytecode;
}
