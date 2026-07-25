import { assemble as _asm } from './assembler.mjs';

export const assemble = _asm;

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

export function run(code, opts) {
  const stack = [];
  const mem = {};
  const calls = [];
  let pc = 0;
  function pop() {
    if (!stack.length) throw new VMError('Stack underflow');
    return stack.pop();
  }
  while (pc < code.length) {
    const op = code[pc++];
    if (op === Op.PUSH)  { stack.push(code[pc++]); }
    else if (op === Op.ADD)  { const b=pop(),a=pop(); stack.push(a+b); }
    else if (op === Op.SUB)  { const b=pop(),a=pop(); stack.push(a-b); }
    else if (op === Op.MUL)  { const b=pop(),a=pop(); stack.push(a*b); }
    else if (op === Op.DIV)  { const b=pop(),a=pop(); if(!b) throw new VMError('Division by zero'); stack.push(Math.trunc(a/b)); }
    else if (op === Op.MOD)  { const b=pop(),a=pop(); if(!b) throw new VMError('Division by zero'); stack.push(a%b); }
    else if (op === Op.DUP)  { const a=pop(); stack.push(a,a); }
    else if (op === Op.POP)  { pop(); }
    else if (op === Op.SWAP) { const b=pop(),a=pop(); stack.push(b,a); }
    else if (op === Op.NEG)  { stack.push(-pop()); }
    else if (op === Op.HALT) { return stack; }
    else if (op === Op.EQ)   { const b=pop(),a=pop(); stack.push(a===b?1:0); }
    else if (op === Op.LT)   { const b=pop(),a=pop(); stack.push(a<b?1:0); }
    else if (op === Op.GT)   { const b=pop(),a=pop(); stack.push(a>b?1:0); }
    else if (op === Op.NEQ)  { const b=pop(),a=pop(); stack.push(a!==b?1:0); }
    else if (op === Op.LTE)  { const b=pop(),a=pop(); stack.push(a<=b?1:0); }
    else if (op === Op.GTE)  { const b=pop(),a=pop(); stack.push(a>=b?1:0); }
    else if (op === Op.AND)  { const b=pop(),a=pop(); stack.push((a&&b)?1:0); }
    else if (op === Op.OR)   { const b=pop(),a=pop(); stack.push((a||b)?1:0); }
    else if (op === Op.NOT)  { stack.push(pop()?0:1); }
    else if (op === Op.JMP)  { pc=code[pc]; }
    else if (op === Op.JZ)   { const t=code[pc++]; if(!pop()) pc=t; }
    else if (op === Op.JNZ)  { const t=code[pc++]; if(pop()) pc=t; }
    else if (op === Op.STORE){ const k=code[pc++]; mem[k]=pop(); }
    else if (op === Op.LOAD) { const k=code[pc++]; const v=mem[k]; stack.push(v===undefined?null:v); }
    else if (op === Op.CALL) { const t=code[pc++]; calls.push(pc); pc=t; }
    else if (op === Op.RET)  { if(!calls.length) throw new VMError('Empty call stack'); pc=calls.pop(); }
    else if (op === Op.PRINT){ console.log(pop()); }
    else throw new VMError('Unknown opcode: '+op);
  }
  return stack;
}
