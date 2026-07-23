# PROGRESS
## Project: Pico VM
Tiny stack-based VM, plain JS ESM.
## Status: Tick 25 - fix assembler pos bug + VMError export
### Files
- src/vm.mjs - 28 opcodes, exports VMError
- src/assembler.mjs - two-pass assembler (pos bug fixed)
- tests/vm.test.mjs - 42 tests
- tests/assembler.test.mjs - 10 tests
## Roadmap
- Fix remaining test failures (CURRENT)
- CLI runner src/run.mjs
- examples/
