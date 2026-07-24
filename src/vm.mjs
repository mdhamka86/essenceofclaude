import {assemble as _assemble} from './assembler.mjs';
export {_assemble as assemble};
export function run(code){
  const stack=[];
  const mem={};
  const calls=[];
  let pc=0;
  const pop=()=>{if(!stack.length)throw new Error('Stack underflow');return stack.pop();};
  while(pc<code.length){
    const op=code[pc++];
    switch(op){
      case 0:{stack.push(code[pc++]);break;}
      case 1:{const b=pop(),a=pop();stack.push(a+b);break;}
      case 2:{const b=pop(),a=pop();stack.push(a-b);break;}
      case 3:{const b=pop(),a=pop();stack.push(a*b);break;}
      case 4:{const b=pop(),a=pop();if(b===0)throw new Error('Division by zero');stack.push(Math.trunc(a/b));break;}
      case 5:{const b=pop(),a=pop();if(b===0)throw new Error('Division by zero');stack.push(a%b);break;}
      case 6:{const v=pop();stack.push(v);stack.push(v);break;}
      case 7:{pop();break;}
      case 8:{const b=pop(),a=pop();stack.push(b);stack.push(a);break;}
      case 9:{stack.push(-pop());break;}
      case 10:{return stack;}
      case 11:{const b=pop(),a=pop();stack.push(a===b?1:0);break;}
      case 12:{const b=pop(),a=pop();stack.push(a<b?1:0);break;}
      case 13:{const b=pop(),a=pop();stack.push(a>b?1:0);break;}
      case 14:{const b=pop(),a=pop();stack.push(a!==b?1:0);break;}
      case 15:{const b=pop(),a=pop();stack.push(a<=b?1:0);break;}
      case 16:{const b=pop(),a=pop();stack.push(a>=b?1:0);break;}
      case 17:{const b=pop(),a=pop();stack.push((a&&b)?1:0);break;}
      case 18:{const b=pop(),a=pop();stack.push((a||b)?1:0);break;}
      case 19:{stack.push(pop()===0?1:0);break;}
      case 20:{pc=code[pc];break;}
      case 21:{const addr=code[pc++];if(pop()===0)pc=addr;break;}
      case 22:{const addr=code[pc++];if(pop()!==0)pc=addr;break;}
      case 23:{const k=code[pc++];mem[k]=pop();break;}
      case 24:{const k=code[pc++];stack.push(mem[k]!==undefined?mem[k]:null);break;}
      case 25:{calls.push(pc+1);pc=code[pc];break;}
      case 26:{if(!calls.length)throw new Error('Empty call stack');pc=calls.pop();break;}
      case 27:{console.log(pop());break;}
      default:throw new Error('Unknown opcode: '+op);
    }
  }
  return stack;
}
