export class VMError extends Error{}

export const Op={
  PUSH:0,ADD:1,SUB:2,MUL:3,DIV:4,MOD:5,
  DUP:6,POP:7,SWAP:8,NEG:9,HALT:10,
  EQ:11,LT:12,GT:13,NEQ:14,LTE:15,GTE:16,
  AND:17,OR:18,NOT:19,
  JMP:20,JZ:21,JNZ:22,
  STORE:23,LOAD:24,CALL:25,RET:26,PRINT:27
};

export {assemble} from './assembler.mjs';

export class VM{
  constructor(code){
    this.code=code;
    this.ip=0;
    this.stack=[];
    this.mem={};
    this.calls=[];
  }
  pop(){
    if(!this.stack.length) throw new VMError('Stack underflow');
    return this.stack.pop();
  }
  run(){
    const {code}=this;
    while(true){
      const op=code[this.ip++];
      switch(op){
        case Op.PUSH: this.stack.push(code[this.ip++]); break;
        case Op.ADD:{ const b=this.pop(),a=this.pop(); this.stack.push(a+b); break;}
        case Op.SUB:{ const b=this.pop(),a=this.pop(); this.stack.push(a-b); break;}
        case Op.MUL:{ const b=this.pop(),a=this.pop(); this.stack.push(a*b); break;}
        case Op.DIV:{ const b=this.pop(),a=this.pop(); if(b===0) throw new VMError('Div by zero'); this.stack.push(Math.trunc(a/b)); break;}
        case Op.MOD:{ const b=this.pop(),a=this.pop(); if(b===0) throw new VMError('Mod by zero'); this.stack.push(a%b); break;}
        case Op.DUP:{ const a=this.pop(); this.stack.push(a,a); break;}
        case Op.POP: this.pop(); break;
        case Op.SWAP:{ const b=this.pop(),a=this.pop(); this.stack.push(b,a); break;}
        case Op.NEG:{ this.stack.push(-this.pop()); break;}
        case Op.HALT: return this.stack;
        case Op.EQ:{ const b=this.pop(),a=this.pop(); this.stack.push(a===b?1:0); break;}
        case Op.LT:{ const b=this.pop(),a=this.pop(); this.stack.push(a<b?1:0); break;}
        case Op.GT:{ const b=this.pop(),a=this.pop(); this.stack.push(a>b?1:0); break;}
        case Op.NEQ:{ const b=this.pop(),a=this.pop(); this.stack.push(a!==b?1:0); break;}
        case Op.LTE:{ const b=this.pop(),a=this.pop(); this.stack.push(a<=b?1:0); break;}
        case Op.GTE:{ const b=this.pop(),a=this.pop(); this.stack.push(a>=b?1:0); break;}
        case Op.AND:{ const b=this.pop(),a=this.pop(); this.stack.push((a&&b)?1:0); break;}
        case Op.OR:{ const b=this.pop(),a=this.pop(); this.stack.push((a||b)?1:0); break;}
        case Op.NOT:{ this.stack.push(this.pop()===0?1:0); break;}
        case Op.JMP: this.ip=code[this.ip]; break;
        case Op.JZ:{ const addr=code[this.ip++]; if(this.pop()===0) this.ip=addr; break;}
        case Op.JNZ:{ const addr=code[this.ip++]; if(this.pop()!==0) this.ip=addr; break;}
        case Op.STORE:{ const k=code[this.ip++]; this.mem[k]=this.pop(); break;}
        case Op.LOAD:{ const k=code[this.ip++]; const v=this.mem[k]; this.stack.push(v!==undefined?v:null); break;}
        case Op.CALL:{ const addr=code[this.ip++]; this.calls.push(this.ip); this.ip=addr; break;}
        case Op.RET:{ if(!this.calls.length) throw new VMError('Empty call stack'); this.ip=this.calls.pop(); break;}
        case Op.PRINT:{ console.log(this.pop()); break;}
        default: throw new VMError('Unknown opcode: '+op);
      }
    }
  }
}

export function run(code){
  const vm=new VM(code);
  return vm.run();
}
