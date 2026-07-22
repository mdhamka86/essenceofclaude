const T={PUSH:[0,1],ADD:[1,0],SUB:[2,0],MUL:[3,0],DIV:[4,0],MOD:[5,0],NEG:[6,0],POP:[7,0],DUP:[8,0],SWAP:[9,0],HALT:[10,0],EQ:[11,0],NEQ:[12,0],LT:[13,0],GT:[14,0],LTE:[15,0],GTE:[16,0],AND:[17,0],OR:[18,0],NOT:[19,0],JMP:[20,1],JZ:[21,1],JNZ:[22,1],STORE:[23,1],LOAD:[24,1],CALL:[25,1],RET:[26,0],PRINT:[27,0]};
export function assemble(src){
  const NL=String.fromCharCode(10);
  const lines=src.split(NL);
  const labels={};
  const ops=[];
  let pos=0;
  for(const raw of lines){
    const line=raw.split(';')[0].trim();
    if(!line)continue;
    if(line[line.length-1]===':'){
      labels[line.slice(0,-1).trim()]=pos;
      continue;
    }
    const i=line.indexOf(' ');
    const mn=(i<0?line:line.slice(0,i)).toUpperCase();
    const arg=i<0?null:line.slice(i+1).trim();
    const d=T[mn];
    if(!d)throw new Error('Unknown: '+mn);
    ops.push([d,arg]);
    pos+=1+d[1];
  }
  const bc=[];
  for(const [d,arg] of ops){
    bc.push(d[0]);
    if(d[1]){
      const n=Number(arg);
      bc.push(isNaN(n)?(arg in labels?labels[arg]:arg):n);
    }
  }
  return bc;
}
