export function assemble(src) {
  const T = {};
  T['PUSH']=[0,1];T['ADD']=[1,0];T['SUB']=[2,0];T['MUL']=[3,0];
  T['DIV']=[4,0];T['MOD']=[5,0];T['NEG']=[6,0];T['POP']=[7,0];
  T['DUP']=[8,0];T['SWAP']=[9,0];T['HALT']=[10,0];T['EQ']=[11,0];
  T['NEQ']=[12,0];T['LT']=[13,0];T['GT']=[14,0];T['LTE']=[15,0];
  T['GTE']=[16,0];T['AND']=[17,0];T['OR']=[18,0];T['NOT']=[19,0];
  T['JMP']=[20,1];T['JZ']=[21,1];T['JNZ']=[22,1];T['STORE']=[23,1];
  T['LOAD']=[24,1];T['CALL']=[25,1];T['RET']=[26,0];T['PRINT']=[27,0];
  const lines = src.split(String.fromCharCode(10));
  const labels = {};
  const ops = [];
  let pos = 0;
  for (const raw of lines) {
    const line = raw.split(';')[0].trim();
    if (!line) continue;
    if (line.endsWith(':')) {
      labels[line.slice(0, -1).trim()] = pos;
      continue;
    }
    const parts = line.split(' ').filter(function(x){return x;});
    const mn = parts[0].toUpperCase();
    const arg = parts[1] || null;
    const d = T[mn];
    if (!d) throw new Error('Unknown: ' + mn);
    ops.push([d, arg]);
    pos += 1 + d[1];
  }
  const bc = [];
  for (let i = 0; i < ops.length; i++) {
    const d = ops[i][0];
    const arg = ops[i][1];
    bc.push(d[0]);
    if (d[1]) {
      const n = Number(arg);
      if (isNaN(n)) {
        bc.push(labels[arg] !== undefined ? labels[arg] : arg);
      } else {
        bc.push(n);
      }
    }
  }
  return bc;
}
