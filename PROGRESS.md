# PROGRESS
## Project: Pico VM
Tiny stack-based VM, plain JS ESM.
## Status: Tick 34 - rewrite vm.mjs and assembler.mjs
### Files
- src/assembler.mjs - two-pass assembler
- src/vm.mjs - VM + re-exports assemble + exports Op, VMError
- tests/vm.test.mjs - 42 tests
- tests/assembler.test.mjs - 10 tests
## Roadmap
- Fix remaining test failures (CURRENT)
- CLI runner src/run.mjs
- examples/
