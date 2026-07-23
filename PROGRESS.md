# PROGRESS
## Project: Pico VM
Tiny stack-based VM, plain JS ESM.
## Status: Tick 27 - fix opcode numbers, first-pass pos, assemble export
### Files
- src/vm.mjs - 28 opcodes, exports VM, VMError, Op, assemble
- src/assembler.mjs - two-pass assembler
- tests/vm.test.mjs - 42 tests
- tests/assembler.test.mjs - 10 tests
## Roadmap
- Fix remaining test failures (CURRENT)
- CLI runner src/run.mjs
- examples/
