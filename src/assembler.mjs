// Two-pass assembler for Pico VM
// Opcode table: [opcode_number, num_args]
const OPS = {
  PUSH:  [0,  1],
  ADD:   [1,  0],
  SUB:   [2,  0],
  MUL:   [3,  0],
  DIV:   [4,  0],
  MOD:   [5,  0],
  DUP:   [6,  0],
  POP:   [7,  0],
  SWAP:  [8,  0],
  NEG:   [9,  0],
  HALT:  [10, 0],
  EQ:    [11, 0],
  LT:    [12, 0],
  GT:    [13, 0],
  AND:   [14, 0],
  OR:    [15, 0],
  NOT:   [16, 0],
  JMP:   [20, 1],
  JZ:    [21, 1],
  JNZ:   [22, 1],
  STORE: [23, 1],
  LOAD:  [24, 1],
  CALL:  [25, 1],
  RET:   [26, 0],
  PRINT: [27, 0],
};

function tokenize(src) {
  const lines = [];
  for (const raw of src.split('\n')) {
    const line = raw.replace(/;.*$/, '').trim();
    if (line) lines.push(line);
  }
  return lines;
}

export function assemble(src) {
  const lines = tokenize(src);
  const labels = {};

  // First pass: compute label positions
  let pos = 0;
  for (const line of lines) {
    if (line.endsWith(':')) {
      labels[line.slice(0, -1)] = pos;
    } else {
      const parts = line.split(/\s+/);
      const mnemonic = parts[0].toUpperCase();
      const def = OPS[mnemonic];
      if (!def) throw new Error('Unknown opcode: ' + mnemonic);
      // advance by 1 (opcode) + nargs
      pos += 1 + def[1];
    }
  }

  // Second pass: emit bytecode
  const out = [];
  for (const line of lines) {
    if (line.endsWith(':')) continue;
    const parts = line.split(/\s+/);
    const mnemonic = parts[0].toUpperCase();
    const def = OPS[mnemonic];
    out.push(def[0]);
    for (let i = 0; i < def[1]; i++) {
      const tok = parts[1 + i];
      if (tok === undefined) throw new Error('Missing arg for ' + mnemonic);
      const val = Object.prototype.hasOwnProperty.call(labels, tok)
        ? labels[tok]
        : Number(tok);
      out.push(val);
    }
  }
  return out;
}
