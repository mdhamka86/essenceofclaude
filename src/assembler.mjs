import { OP } from './vm.mjs';
const T = {
  PUSH:[OP.PUSH,1],ADD:[OP.ADD,0],SUB:[OP.SUB,0],MUL:[OP.MUL,0],
  DIV:[OP.DIV,0],MOD:[OP.MOD,0],NEG:[OP.NEG,0],POP:[OP.POP,0],
  DUP:[OP.DUP,0],SWAP:[OP.SWAP,0],HALT:[OP.HALT,0],
  EQ:[OP.EQ,0],NEQ:[OP.NEQ,0],LT:[OP.LT,0],GT:[OP.GT,0],
  LTE:[OP.LTE,0],GTE:[OP.GTE,0],AND:[OP.AND,0],OR:[OP.OR,0],
  NOT:[OP.NOT,0],JMP:[OP.JMP,1],JZ:[OP.JZ,1],JNZ:[OP.JNZ,1],
  STORE:[OP.STORE,1],LOAD:[OP.LOAD,1],CALL:[OP.CALL,1],
  RET:[OP.RET,0],PRINT:[OP.PRINT,0]
};
export function assemble(src) {
  const NL = String.fromCharCode(10);
  const lines = src.split(NL);
  const labels = {};
  const ops = [];
  let pos = 0;
  for (const raw of lines) {
    const line = raw.split(';')[0].trim();
    if (!line) continue;
    if (line[line.length-1] === ':') {
      labels[line.slice(0,-1).trim()] = pos;
      continue;
    }
    const i = line.indexOf(' ');
    const mn = (i<0?line:line.slice(0,i)).toUpperCase();
    const arg = i<0?null:line.slice(i+1).trim();
    const d = T[mn];
    if (!d) throw new Error('Unknown: '+mn);
    ops.push([d,arg]);
    pos += 1 + d[1];
  }
  const bc = [];
  for (const [d,arg] of ops) {
    bc.push(d[0]);
    if (d[1]) {
      const n = Number(arg);
      bc.push(isNaN(n) ? (arg in labels ? labels[arg] : arg) : n);
    }
  }
  return bc;
}
