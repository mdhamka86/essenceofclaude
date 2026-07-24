# PROGRESS
## Project: Pico VM
Tiny stack-based VM, plain JS ESM.
## Status: Tick 30 - fix assembler 0-arg pos count + vm run() returns stack
### Files
- src/assembler.mjs - two-pass assembler
- src/vm.mjs - VM + re-exports assemble
- tests/vm.test.mjs - 42 tests
- tests/assembler.test.mjs - 10 tests
## Roadmap
- Fix remaining test failures (CURRENT)
- CLI runner src/run.mjs
- examples/
