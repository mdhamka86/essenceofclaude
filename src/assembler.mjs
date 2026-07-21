import { OP } from './vm.mjs';

const M = {
  PUSH:  [OP.PUSH,  1],
  ADD:   [OP.ADD,   0],
  SUB:   [OP.SUB,   0],
  MUL:   [OP.MUL,   0],
  DIV:   [OP.DIV,   0],
  MOD:   [OP.MOD,   0],
  NEG:   [OP.NEG,   0],
  POP:   [OP.POP,   0],
  DUP:   [OP.DUP,   0],
  SWAP:  [OP.SWAP,  0],
  HALT:  [OP.HALT,  0],
  EQ:    [OP.EQ,    0],
  NEQ:   [OP.NEQ,   0],
  LT:    [OP.LT,    0],
  GT:    [OP.GT,    0],
  LTE:   [OP.LTE,   0],
  GTE:   [OP.GTE,   0],
  AND:   [OP.AND,   0],
  OR:    [OP.OR,    0],
  NOT:   [OP.NOT,   0],
  JMP:   [OP.JMP,   1],
  JZ:    [OP.JZ,    1],
  JNZ:   [OP.JNZ,   1],
  STORE: [OP.STORE, 1],
  LOAD:  [OP.LOAD,  1],
  CALL:  [OP.CALL,  1],
  RET:   [OP.RET,   0],
  PRINT: [OP.PRINT, 0],
};

export function assemble(source) {
  const NL = String.fromCharCode(10);
  const lines = source.split(NL);
  const labels = {};
  const instrs = [];
  let pos = 0;

  for (const raw of lines) {
    const line = raw.split(';')[0].trim();
    if (!line) continue;
    if (line[line.length - 1] === ':') {
      labels[line.slice(0, -1).trim()] = pos;
      continue;
    }
    const sp = line.indexOf(' ');
    const mn = (sp < 0 ? line : line.slice(0, sp)).toUpperCase();
    const operand = sp < 0 ? null : line.slice(sp + 1).trim();
    const def = M[mn];
    if (!def) throw new Error('Unknown mnemonic: ' + mn);
    instrs.push({ def, operand });
    pos += 1 + def[1];
  }

  const bc = [];
  for (const { def, operand } of instrs) {
    bc.push(def[0]);
    if (def[1] === 1) {
      const n = Number(operand);
      if (!isNaN(n)) {
        bc.push(n);
      } else if (operand in labels) {
        bc.push(labels[operand]);
      } else {
        bc.push(operand);
      }
    }
  }
  return bc;
}
