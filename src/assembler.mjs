// Two-pass assembler for Pico VM
// Opcode table: [opcode_number, num_args]
const T = {
  PUSH:  [0,  1],
  POP:   [1,  0],
  DUP:   [2,  0],
  SWAP:  [3,  0],
  ADD:   [4,  0],
  SUB:   [5,  0],
  MUL:   [6,  0],
  DIV:   [7,  0],
  MOD:   [8,  0],
  NEG:   [9,  0],
  HALT:  [10, 0],
  EQ:    [11, 0],
  LT:    [12, 0],
  GT:    [13, 0],
  AND:   [14, 0],
  OR:    [15, 0],
  NOT:   [16, 0],
  PRINT: [17, 0],
  NOP:   [18, 0],
  INC:   [19, 0],
  JMP:   [20, 1],
  JZ:    [21, 1],
  JNZ:   [22, 1],
  STORE: [23, 1],
  LOAD:  [24, 1],
  CALL:  [25, 1],
  RET:   [26, 0],
  DEC:   [27, 0],
};

export function assemble(src) {
  const lines = src.split('\n')
    .map(l => l.replace(/;.*/, '').trim())
    .filter(l => l.length > 0);

  // First pass: collect label positions
  const labels = {};
  let pos = 0;
  for (const line of lines) {
    if (line.endsWith(':')) {
      labels[line.slice(0, -1)] = pos;
    } else {
      const [mnem] = line.split(/\s+/);
      const d = T[mnem];
      if (!d) throw new Error('Unknown opcode: ' + mnem);
      pos += 1 + d[1];
    }
  }

  // Second pass: emit bytes
  const out = [];
  for (const line of lines) {
    if (line.endsWith(':')) continue;
    const parts = line.split(/\s+/);
    const mnem = parts[0];
    const d = T[mnem];
    out.push(d[0]);
    if (d[1] === 1) {
      const arg = parts[1];
      const val = (arg in labels) ? labels[arg] : parseInt(arg, 10);
      out.push(val);
    }
  }
  return out;
}
