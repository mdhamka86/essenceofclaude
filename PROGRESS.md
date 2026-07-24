# PROGRESS
## Project: Pico VM
Tiny stack-based VM, plain JS ESM.
## Status: Tick 29 - rewrite assembler+vm (compact) to fix run() and label counting
### Files
- src/vm.mjs - full VM, exports VM, VMError, Op, assemble, run
- src/assembler.mjs - two-pass assembler, exports assemble
- tests/vm.test.mjs - 42 tests
- tests/assembler.test.mjs - 10 tests
## Roadmap
- Fix remaining test failures (CURRENT)
- CLI runner src/run.mjs
- examples/
