import {assemble} from './assembler.mjs';
export {assemble};

export class VMError extends Error{
  constructor(msg){super(msg);this.name='VMError';}
}

export const Op={
  PUSH:0,ADD:1,SUB:2,MUL:3,DIV:4,MOD:5,
  DUP:6,POP:7,SWAP:8,NEG:9,HALT:10,
  EQ:11,LT:12,GT:13,NEQ:14,LTE:15,GTE:16,
  AND:17,OR:18,NOT:19,
  JMP:20,JZ:21,JNZ:22,
  STORE:23,LOAD:24,CALL:25,RET:26,PRINT:27
};

export class VM{
  constructor(){this.stack=[];this.mem={};this.callStack=[];}
  pop(){
    if(this.stack.length===0) throw new VMError('Stack underflow');
    return this.stack.pop();
  }
  push(v){this.stack.push(v);}
  run(code){
    let pc=0;
    while(pc<code.length){
      const op=code[pc++];
      switch(op){
        case Op.PUSH: this.push(code[pc++]); break;
        case Op.ADD: {const b=this.pop(),a=this.pop();this.push(a+b);} break;
        case Op.SUB: {const b=this.pop(),a=this.pop();this.push(a-b);} break;
        case Op.MUL: {const b=this.pop(),a=this.pop();this.push(a*b);} break;
        case Op.DIV: {const b=this.pop(),a=this.pop();if(b===0)throw new VMError('Division by zero');this.push(Math.trunc(a/b));} break;
        case Op.MOD: {const b=this.pop(),a=this.pop();if(b===0)throw new VMError('Division by zero');this.push(a%b);} break;
        case Op.DUP: {const a=this.pop();this.push(a);this.push(a);} break;
        case Op.POP: this.pop(); break;
        case Op.SWAP: {const b=this.pop(),a=this.pop();this.push(b);this.push(a);} break;
        case Op.NEG: this.push(-this.pop()); break;
        case Op.HALT: return this.stack;
        case Op.EQ: {const b=this.pop(),a=this.pop();this.push(a===b?1:0);} break;
        case Op.LT: {const b=this.pop(),a=this.pop();this.push(a<b?1:0);} break;
        case Op.GT: {const b=this.pop(),a=this.pop();this.push(a>b?1:0);} break;
        case Op.NEQ: {const b=this.pop(),a=this.pop();this.push(a!==b?1:0);} break;
        case Op.LTE: {const b=this.pop(),a=this.pop();this.push(a<=b?1:0);} break;
        case Op.GTE: {const b=this.pop(),a=this.pop();this.push(a>=b?1:0);} break;
        case Op.AND: {const b=this.pop(),a=this.pop();this.push((a&&b)?1:0);} break;
        case Op.OR: {const b=this.pop(),a=this.pop();this.push((a||b)?1:0);} break;
        case Op.NOT: this.push(this.pop()?0:1); break;
        case Op.JMP: pc=code[pc]; break;
        case Op.JZ: {const t=code[pc++];if(this.pop()===0)pc=t;} break;
        case Op.JNZ: {const t=code[pc++];if(this.pop()!==0)pc=t;} break;
        case Op.STORE: {const k=code[pc++];this.mem[k]=this.pop();} break;
        case Op.LOAD: {const k=code[pc++];const v=this.mem[k];this.push(v===undefined?null:v);} break;
        case Op.CALL: {const t=code[pc++];this.callStack.push(pc);pc=t;} break;
        case Op.RET: {if(this.callStack.length===0)throw new VMError('Empty call stack');pc=this.callStack.pop();} break;
        case Op.PRINT: console.log(this.pop()); break;
        default: throw new VMError('Unknown opcode: '+op);
      }
    }
    return this.stack;
  }
}

export function run(code){
  const vm=new VM();
  return vm.run(code);
}
