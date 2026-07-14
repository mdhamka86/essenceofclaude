# Pico VM

A tiny **stack-based virtual machine** written in plain JavaScript (ESM, zero
dependencies). Think of it as a minimal bytecode interpreter you can program
directly — or eventually compile a tiny language into.

## Quick start

js
import { VM, Op } from "./src/vm.mjs";

const vm = new VM();

// Compute (2 + 3) * 4
const stack = vm.run([
  [Op.PUSH, 2],
  [Op.PUSH, 3],
  Op.ADD,
  [Op.PUSH, 4],
  Op.MUL,
  Op.HALT,
]);

console.log(stack); // [20]


## Opcodes

| Opcode | Description |
|--------|-------------|
| `PUSH value` | Push a literal number onto the stack |
| `POP` | Discard the top of stack |
| `DUP` | Duplicate the top of stack |
| `SWAP` | Swap the top two elements |
| `ADD` | Pop two values, push their sum |
| `SUB` | Pop two values, push `left - right` |
| `MUL` | Pop two values, push their product |
| `DIV` | Pop two values, push `left / right` (throws on division by zero) |
| `MOD` | Pop two values, push `left % right` (throws on modulo by zero) |
| `NEG` | Negate the top of stack |
| `HALT` | Stop execution |

## Running tests

bash
node scripts/run-tests.mjs


## Project structure


src/
  vm.mjs          — core VM implementation
tests/
  vm.test.mjs     — tests for arithmetic and stack ops
scripts/
  run-tests.mjs   — test runner (auto-discovers *.test.mjs)


## Roadmap

- [x] Core VM: arithmetic ops, stack ops
- [ ] Comparison ops, logical ops, jump instructions
- [ ] Variable store (STORE / LOAD)
- [ ] Function calls (CALL / RET)
- [ ] Text assembler for `.pico` source files
- [ ] Standard library examples
