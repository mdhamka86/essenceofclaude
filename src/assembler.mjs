// assembler.mjs - assembles .pico source text into a bytecode array
// Import OP constants from vm.mjs to keep opcode numbers in sync.

import { OP } from './vm.mjs';

// MNEMONICS maps each instruction name to its opcode and argument type.
// args: 0    = no operand
//       'num'  = numeric literal follows (e.g. PUSH 42)
//       'sym'  = identifier string follows (e.g. STORE x)
//       'lbl'  = label name follows, resolved to address (e.g. JMP loop)
const MNEMONICS = {
  PUSH:  { op: OP.PUSH,  args: 'num' },
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
  JMP:   { op: OP.JMP,   args: 'lbl' },
  JZ:    { op: OP.JZ,    args: 'lbl' },
  JNZ:   { op: OP.JNZ,   args: 'lbl' },
  STORE: { op: OP.STORE, args: 'sym' },
  LOAD:  { op: OP.LOAD,  args: 'sym' },
  CALL:  { op: OP.CALL,  args: 'lbl' },
  RET:   { op: OP.RET,   args: 0 },
  PRINT: { op: OP.PRINT, args: 0 },
};

/**
 * assemble(source) - convert .pico source text to a flat bytecode array.
 *
 * Syntax rules:
 *   - One instruction per line
 *   - Comments start with ';' and extend to end of line
 *   - Labels are defined as 'name:' on their own token
 *   - Label references appear as the operand of JMP / JZ / JNZ / CALL
 *
 * Returns: number[] (with possible string entries for STORE/LOAD symbol names)
 */
export function assemble(source) {
  // Tokenise into a list of instruction records and a label map.
  const instructions = [];
  const labels = {};
  let pos = 0;

  for (const rawLine of source.split('\n')) {
    // Strip comment and surrounding whitespace.
    const line = rawLine.split(';')[0].trim();
    if (line === '') continue;

    // Label definition: 'name:'
    if (line.endsWith(':')) {
      const name = line.slice(0, -1).trim();
      labels[name] = pos;
      continue;
    }

    // Split into mnemonic + optional operand.
    const parts = line.split(/\s+/);
    const mnemonic = parts[0].toUpperCase();
    const operand  = parts[1];

    const def = MNEMONICS[mnemonic];
    if (!def) {
      throw new Error('Unknown mnemonic: ' + mnemonic);
    }

    instructions.push({ def, operand });
    // Each instruction occupies 1 slot (opcode) plus 1 slot if it has an operand.
    pos += (def.args === 0) ? 1 : 2;
  }

  // Second pass: emit bytecode, resolving label references.
  const bytecode = [];
  for (const { def, operand } of instructions) {
    bytecode.push(def.op);
    if (def.args === 'num') {
      bytecode.push(Number(operand));
    } else if (def.args === 'sym') {
      bytecode.push(operand);
    } else if (def.args === 'lbl') {
      if (!(operand in labels)) {
        throw new Error('Undefined label: ' + operand);
      }
      bytecode.push(labels[operand]);
    }
    // args === 0: nothing extra to push
  }

  return bytecode;
}
