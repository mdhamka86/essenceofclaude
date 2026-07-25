import {assemble as _assemble} from './assembler.mjs';
export {_assemble as assemble};

export const Op={
  PUSH:0,ADD:1,SUB:2,MUL:3,DIV:4,MOD:5,
  DUP:6,POP:7,SWAP:8,NEG:9,HALT:10,
  EQ:11,LT:12,GT:13,NEQ:14,LTE:15,GTE:16,
  AND:17,OR:18,NOT:19,
  JMP:20,JZ:21,JNZ:22,
  STORE:23,LOAD:24,CALL:25,RET:26,PRINT:27
};

export function run(code){
  const stack=[];
  const mem={};
  const callStack=[];
  let pc=0;
  const pop=()=>stack.pop();
  const push=v=>stack.push(v);
  while(pc<code.length){
    const op=code[pc++];
    switch(op){
      case 0:{push(code[pc++]);break;} // PUSH
      case 1:{const b=pop(),a=pop();push(a+b);break;} // ADD
      case 2:{const b=pop(),a=pop();push(a-b);break;} // SUB
      case 3:{const b=pop(),a=pop();push(a*b);break;} // MUL
      case 4:{const b=pop(),a=pop();push(Math.trunc(a/b));break;} // DIV
      case 5:{const b=pop(),a=pop();push(a%b);break;} // MOD
      case 6:{const t=pop();push(t);push(t);break;} // DUP
      case 7:{pop();break;} // POP
      case 8:{const b=pop(),a=pop();push(b);push(a);break;} // SWAP
      case 9:{push(-pop());break;} // NEG
      case 10:{return stack;} // HALT
      case 11:{const b=pop(),a=pop();push(a===b?1:0);break;} // EQ
      case 12:{const b=pop(),a=pop();push(a<b?1:0);break;} // LT
      case 13:{const b=pop(),a=pop();push(a>b?1:0);break;} // GT
      case 14:{const b=pop(),a=pop();push(a!==b?1:0);break;} // NEQ
      case 15:{const b=pop(),a=pop();push(a<=b?1:0);break;} // LTE
      case 16:{const b=pop(),a=pop();push(a>=b?1:0);break;} // GTE
      case 17:{const b=pop(),a=pop();push((a&&b)?1:0);break;} // AND
      case 18:{const b=pop(),a=pop();push((a||b)?1:0);break;} // OR
      case 19:{push(pop()?0:1);break;} // NOT
      case 20:{pc=code[pc];break;} // JMP
      case 21:{const t=code[pc++];if(pop()===0)pc=t;break;} // JZ
      case 22:{const t=code[pc++];if(pop()!==0)pc=t;break;} // JNZ
      case 23:{const k=code[pc++];mem[k]=pop();break;} // STORE
      case 24:{const k=code[pc++];const v=mem[k];push(v===undefined?null:v);break;} // LOAD
      case 25:{const t=code[pc++];callStack.push(pc);pc=t;break;} // CALL
      case 26:{pc=callStack.pop();break;} // RET
      case 27:{console.log(pop());break;} // PRINT
      default: throw new Error('Unknown opcode: '+op);
    }
  }
  return stack;
}

export function createVM(){
  return {
    run,
    assemble:_assemble
  };
}
