// Two-pass assembler for Pico VM
// Mnemonic -> [opcode, numArgs]
const T = {
  PUSH:  [0, 1],
  ADD:   [1, 0],
  SUB:   [2, 0],
  MUL:   [3, 0],
  DIV:   [4, 0],
  MOD:   [5, 0],
  EQ:    [6, 0],
  LT:    [7, 0],
  GT:    [8, 0],
  NOT:   [9, 0],
  HALT:  [10, 0],
  POP:   [11, 0],
  DUP:   [12, 0],
  SWAP:  [13, 0],
  LOAD:  [20, 1],
  STORE: [22, 1],
  JMP:   [23, 1],
  JZ:    [21, 1],
  JNZ:   [24, 1],
  CALL:  [25, 1],
  RET:   [26, 0],
  PRINT: [27, 0],
};

export function assemble(src) {
  const lines = src.split('\n').map(l => l.replace(/;.*$/, '').trim()).filter(l => l);

  // Pass 1: compute label addresses
  const labels = {};
  let pos = 0;
  for (const line of lines) {
    if (line.endsWith(':')) {
      labels[line.slice(0, -1)] = pos;
    } else {
      const parts = line.split(/\s+/);
      const mn = parts[0].toUpperCase();
      const d = T[mn];
      if (!d) throw new Error('Unknown opcode: ' + mn);
      pos += 1 + d[1];
    }
  }

  // Pass 2: emit bytecode
  const bc = [];
  for (const line of lines) {
    if (line.endsWith(':')) continue;
    const parts = line.split(/\s+/);
    const mn = parts[0].toUpperCase();
    const d = T[mn];
    bc.push(d[0]);
    if (d[1] === 1) {
      const raw = parts[1];
      const val = (raw in labels) ? labels[raw] : Number(raw);
      bc.push(val);
    }
  }
  return bc;
}
