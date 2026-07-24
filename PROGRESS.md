# PROGRESS
## Project: Pico VM
Tiny stack-based VM, plain JS ESM.
## Status: Tick 28 - fix ADD/PRINT opcodes, 0-arg pos count, export run
### Files
- src/vm.mjs - 28 opcodes, exports VM, VMError, Op, assemble, run
- src/assembler.mjs - two-pass assembler
- tests/vm.test.mjs - 42 tests
- tests/assembler.test.mjs - 10 tests
## Roadmap
- Fix remaining test failures (CURRENT)
- CLI runner src/run.mjs
- examples/
