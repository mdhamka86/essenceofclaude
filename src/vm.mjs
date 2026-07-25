import { assemble as _assemble } from './assembler.mjs';
export { _assemble as assemble };

export class VMError extends Error {
  constructor(msg) { super(msg); this.name = 'VMError'; }
}

export const Op = {
  PUSH:0,ADD:1,SUB:2,MUL:3,DIV:4,MOD:5,
  DUP:6,POP:7,SWAP:8,NEG:9,HALT:10,
  EQ:11,LT:12,GT:13,NEQ:14,LTE:15,GTE:16,
  AND:17,OR:18,NOT:19,
  JMP:20,JZ:21,JNZ:22,
  STORE:23,LOAD:24,
  CALL:25,RET:26,PRINT:27
};

export function run(code) {
  const stack = [];
  const mem = {};
  const calls = [];
  let pc = 0;
  const pop = () => {
    if (stack.length === 0) throw new VMError('Stack underflow');
    return stack.pop();
  };
  while (pc < code.length) {
    const op = code[pc++];
    switch (op) {
      case Op.PUSH: stack.push(code[pc++]); break;
      case Op.ADD: { const b=pop(),a=pop(); stack.push(a+b); break; }
      case Op.SUB: { const b=pop(),a=pop(); stack.push(a-b); break; }
      case Op.MUL: { const b=pop(),a=pop(); stack.push(a*b); break; }
      case Op.DIV: { const b=pop(),a=pop(); if(b===0) throw new VMError('Division by zero'); stack.push(Math.trunc(a/b)); break; }
      case Op.MOD: { const b=pop(),a=pop(); if(b===0) throw new VMError('Division by zero'); stack.push(a%b); break; }
      case Op.DUP: { const a=pop(); stack.push(a,a); break; }
      case Op.POP: pop(); break;
      case Op.SWAP: { const b=pop(),a=pop(); stack.push(b,a); break; }
      case Op.NEG: stack.push(-pop()); break;
      case Op.HALT: return stack;
      case Op.EQ: { const b=pop(),a=pop(); stack.push(a===b?1:0); break; }
      case Op.LT: { const b=pop(),a=pop(); stack.push(a<b?1:0); break; }
      case Op.GT: { const b=pop(),a=pop(); stack.push(a>b?1:0); break; }
      case Op.NEQ: { const b=pop(),a=pop(); stack.push(a!==b?1:0); break; }
      case Op.LTE: { const b=pop(),a=pop(); stack.push(a<=b?1:0); break; }
      case Op.GTE: { const b=pop(),a=pop(); stack.push(a>=b?1:0); break; }
      case Op.AND: { const b=pop(),a=pop(); stack.push((a&&b)?1:0); break; }
      case Op.OR: { const b=pop(),a=pop(); stack.push((a||b)?1:0); break; }
      case Op.NOT: stack.push(pop()?0:1); break;
      case Op.JMP: pc=code[pc]; break;
      case Op.JZ: { const t=code[pc++]; if(pop()===0) pc=t; break; }
      case Op.JNZ: { const t=code[pc++]; if(pop()!==0) pc=t; break; }
      case Op.STORE: { const k=code[pc++]; mem[k]=pop(); break; }
      case Op.LOAD: { const k=code[pc++]; const v=mem[k]; stack.push(v===undefined?null:v); break; }
      case Op.CALL: { const t=code[pc++]; calls.push(pc); pc=t; break; }
      case Op.RET: { if(calls.length===0) throw new VMError('Empty call stack'); pc=calls.pop(); break; }
      case Op.PRINT: console.log(pop()); break;
      default: throw new VMError('Unknown opcode: '+op);
    }
  }
  return stack;
}
