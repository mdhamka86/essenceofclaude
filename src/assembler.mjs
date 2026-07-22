const DEFS=['PUSH:1','ADD:0','SUB:0','MUL:0','DIV:0','MOD:0','NEG:0','POP:0','DUP:0','SWAP:0','HALT:0','EQ:0','NEQ:0','LT:0','GT:0','LTE:0','GTE:0','AND:0','OR:0','NOT:0','JMP:1','JZ:1','JNZ:1','STORE:1','LOAD:1','CALL:1','RET:0','PRINT:0'];
const T={};
DEFS.forEach(function(s,i){var p=s.split(':');T[p[0]]=[i,Number(p[1])];});
export function assemble(src){
var NL=String.fromCharCode(10);
var lines=src.split(NL);
var labels={},ops=[],pos=0;
for(var i=0;i<lines.length;i++){
var line=lines[i].split(';')[0].trim();
if(!line)continue;
if(line.charAt(line.length-1)===':'){labels[line.slice(0,-1).trim()]=pos;continue;}
var parts=line.split(' ').filter(function(x){return x;});
var mn=parts[0].toUpperCase();
var arg=parts[1]||null;
var d=T[mn];
if(!d)throw new Error('Unknown: '+mn);
ops.push([d,arg]);
pos+=1+d[1];
}
var bc=[];
for(var j=0;j<ops.length;j++){
var op=ops[j][0],a=ops[j][1];
bc.push(op[0]);
if(op[1]){
var n=Number(a);
bc.push(isNaN(n)?(labels[a]!==undefined?labels[a]:a):n);
}
}
return bc;
}
