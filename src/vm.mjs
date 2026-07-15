// Pico VM - stack-based bytecode interpreter
// Opcodes are plain strings for readability.

export class VMError extends Error {
  constructor(msg) { super(msg); this.name = 'VMError'; }
}

export function createVM() {
  return { stack: [], pc: 0, halted: false };
}

function pop(vm) {
  if (vm.stack.length === 0) throw new VMError('stack underflow');
  return vm.stack.pop();
}

function peek(vm) {
  if (vm.stack.length === 0) throw new VMError('stack underflow');
  return vm.stack[vm.stack.length - 1];
}

export function run(vm, program) {
  vm.pc = 0;
  vm.halted = false;
  while (!vm.halted && vm.pc < program.length) {
    const op = program[vm.pc];
    switch (op) {
      case 'PUSH': {
        if (vm.pc + 1 >= program.length) throw new VMError('PUSH missing operand');
        vm.stack.push(program[++vm.pc]);
        vm.pc++;
        break;
      }
      case 'POP': { pop(vm); vm.pc++; break; }
      case 'DUP': { vm.stack.push(peek(vm)); vm.pc++; break; }
      case 'SWAP': {
        if (vm.stack.length < 2) throw new VMError('SWAP needs 2 values');
        const a = pop(vm), b = pop(vm);
        vm.stack.push(a); vm.stack.push(b);
        vm.pc++; break;
      }
      case 'ADD': { const r = pop(vm); vm.stack.push(pop(vm) + r); vm.pc++; break; }
      case 'SUB': { const r = pop(vm); vm.stack.push(pop(vm) - r); vm.pc++; break; }
      case 'MUL': { const r = pop(vm); vm.stack.push(pop(vm) * r); vm.pc++; break; }
      case 'DIV': {
        const r = pop(vm);
        if (r === 0) throw new VMError('division by zero');
        vm.stack.push(pop(vm) / r); vm.pc++; break;
      }
      case 'MOD': {
        const r = pop(vm);
        if (r === 0) throw new VMError('modulo by zero');
        vm.stack.push(pop(vm) % r); vm.pc++; break;
      }
      case 'NEG': { vm.stack.push(-pop(vm)); vm.pc++; break; }
      // Comparison ops - push 1 (true) or 0 (false)
      case 'EQ':  { const r = pop(vm); vm.stack.push(pop(vm) === r ? 1 : 0); vm.pc++; break; }
      case 'NEQ': { const r = pop(vm); vm.stack.push(pop(vm) !== r ? 1 : 0); vm.pc++; break; }
      case 'LT':  { const r = pop(vm); vm.stack.push(pop(vm) <   r ? 1 : 0); vm.pc++; break; }
      case 'GT':  { const r = pop(vm); vm.stack.push(pop(vm) >   r ? 1 : 0); vm.pc++; break; }
      case 'LTE': { const r = pop(vm); vm.stack.push(pop(vm) <=  r ? 1 : 0); vm.pc++; break; }
      case 'GTE': { const r = pop(vm); vm.stack.push(pop(vm) >=  r ? 1 : 0); vm.pc++; break; }
      // Logical ops - treat 0 as false, non-zero as true; push 1 or 0
      case 'AND': { const b = pop(vm), a = pop(vm); vm.stack.push((a !== 0 && b !== 0) ? 1 : 0); vm.pc++; break; }
      case 'OR':  { const b = pop(vm), a = pop(vm); vm.stack.push((a !== 0 || b !== 0) ? 1 : 0); vm.pc++; break; }
      case 'NOT': { vm.stack.push(pop(vm) === 0 ? 1 : 0); vm.pc++; break; }
      // Jump instructions - operand is absolute program index
      case 'JMP': {
        if (vm.pc + 1 >= program.length) throw new VMError('JMP missing operand');
        vm.pc = program[vm.pc + 1];
        break;
      }
      case 'JZ': {
        if (vm.pc + 1 >= program.length) throw new VMError('JZ missing operand');
        const target = program[vm.pc + 1];
        const cond = pop(vm);
        vm.pc = (cond === 0) ? target : vm.pc + 2;
        break;
      }
      case 'JNZ': {
        if (vm.pc + 1 >= program.length) throw new VMError('JNZ missing operand');
        const target = program[vm.pc + 1];
        const cond = pop(vm);
        vm.pc = (cond !== 0) ? target : vm.pc + 2;
        break;
      }
      case 'HALT': { vm.halted = true; break; }
      default: throw new VMError('unknown opcode: ' + op);
    }
  }
  return vm.stack[vm.stack.length - 1];
}
