// Pico VM Assembler
// Parses .pico text source into a program array for the VM
import { OP } from './vm.mjs';

// Mnemonics that take one operand (string name)
const STR_OPERAND = new Set(['STORE', 'LOAD']);
// Mnemonics that take one numeric/label operand
const NUM_OPERAND = new Set(['PUSH', 'JMP', 'JZ', 'JNZ', 'CALL']);
// Mnemonics with no operand
const NO_OPERAND = new Set([
  'POP','DUP','SWAP','ADD','SUB','MUL','DIV','MOD','NEG','HALT',
  'EQ','NEQ','LT','GT','LTE','GTE','AND','OR','NOT','RET','PRINT',
]);

export function assemble(source) {
  const lines = source.split('\n');
  const tokens = []; // { type: 'label'|'instr'|'operand', value }
  const labels = {}; // label -> program index

  // Tokenize
  for (let line of lines) {
    // Remove comments
    const ci = line.indexOf(';');
    if (ci !== -1) line = line.slice(0, ci);
    line = line.trim();
    if (!line) continue;

    // Could be: label: [instr [operand]]
    // Split on whitespace
    const parts = line.split(/\s+/);
    let i = 0;

    // Check for label definition
    if (parts[i].endsWith(':')) {
      tokens.push({ type: 'label', value: parts[i].slice(0, -1) });
      i++;
    }

    if (i < parts.length) {
      const mnem = parts[i].toUpperCase();
      tokens.push({ type: 'instr', value: mnem });
      i++;
      if (i < parts.length) {
        tokens.push({ type: 'operand', value: parts[i] });
      }
    }
  }

  // Pass 1: calculate label positions
  let pos = 0;
  for (const tok of tokens) {
    if (tok.type === 'label') {
      labels[tok.value] = pos;
    } else if (tok.type === 'instr') {
      const m = tok.value;
      pos++; // opcode
      if (NUM_OPERAND.has(m) || STR_OPERAND.has(m)) pos++; // operand
    }
    // operand tokens counted via instr
  }

  // Pass 2: emit bytecode
  const program = [];
  const patches = []; // { index, label } for label refs
  let ti = 0;

  while (ti < tokens.length) {
    const tok = tokens[ti];
    if (tok.type === 'label') { ti++; continue; }
    if (tok.type === 'operand') { ti++; continue; } // should be consumed by instr

    // instr
    const mnem = tok.value;
    ti++;

    if (!(mnem in OP)) {
      throw new Error(`Unknown mnemonic: ${mnem}`);
    }
    program.push(OP[mnem]);

    if (NUM_OPERAND.has(mnem)) {
      const opTok = tokens[ti];
      if (!opTok || opTok.type !== 'operand') throw new Error(`${mnem} requires operand`);
      ti++;
      const raw = opTok.value;
      const n = Number(raw);
      if (!isNaN(n)) {
        program.push(n);
      } else {
        // label reference - patch later
        patches.push({ index: program.length, label: raw });
        program.push(0); // placeholder
      }
    } else if (STR_OPERAND.has(mnem)) {
      const opTok = tokens[ti];
      if (!opTok || opTok.type !== 'operand') throw new Error(`${mnem} requires operand`);
      ti++;
      program.push(opTok.value);
    }
    // NO_OPERAND: nothing more
  }

  // Apply patches
  for (const { index, label } of patches) {
    if (!(label in labels)) throw new Error(`Undefined label: ${label}`);
    program[index] = labels[label];
  }

  return program;
}
