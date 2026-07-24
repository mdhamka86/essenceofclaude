const OPCODES={
  PUSH:[0,1],ADD:[1,0],SUB:[2,0],MUL:[3,0],DIV:[4,0],MOD:[5,0],
  DUP:[6,0],POP:[7,0],SWAP:[8,0],NEG:[9,0],HALT:[10,0],
  EQ:[11,0],LT:[12,0],GT:[13,0],NEQ:[14,0],LTE:[15,0],GTE:[16,0],
  AND:[17,0],OR:[18,0],NOT:[19,0],
  JMP:[20,1],JZ:[21,1],JNZ:[22,1],
  STORE:[23,1],LOAD:[24,1],CALL:[25,1],RET:[26,0],PRINT:[27,0]
};

export function assemble(src){
  const lines=src.split('\n')
    .map(l=>l.replace(/;.*/,'').trim())
    .filter(Boolean);
  const labels={};
  let pos=0;
  for(const line of lines){
    if(line.endsWith(':')){
      labels[line.slice(0,-1)]=pos;
    } else {
      const op=line.split(/\s+/)[0];
      const info=OPCODES[op];
      if(!info) throw new Error('Unknown opcode: '+op);
      pos+=1+info[1];
    }
  }
  const out=[];
  for(const line of lines){
    if(line.endsWith(':')) continue;
    const [op,...args]=line.split(/\s+/);
    const [code,nargs]=OPCODES[op];
    out.push(code);
    for(let i=0;i<nargs;i++){
      const a=args[i];
      out.push(labels[a]!==undefined?labels[a]:Number(a));
    }
  }
  return out;
}
