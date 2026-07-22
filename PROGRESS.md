# PROGRESS

## Project: Pico VM

Tiny stack-based VM in plain JavaScript (ESM, no deps).

## Status: Tick 14 - fixing assembler (again)

### Files
- src/vm.mjs - core VM, 28 opcodes
- src/assembler.mjs - two-pass assembler
- tests/vm.test.mjs - 42 passing
- tests/assembler.test.mjs - 2 pass 8 fail (fixing)

## OP values
PUSH=0 ADD=1 SUB=2 MUL=3 DIV=4 MOD=5 NEG=6 POP=7 DUP=8 SWAP=9 HALT=10
EQ=11 NEQ=12 LT=13 GT=14 LTE=15 GTE=16 AND=17 OR=18 NOT=19
JMP=20 JZ=21 JNZ=22 STORE=23 LOAD=24 CALL=25 RET=26 PRINT=27

## Roadmap
- Fix assembler tests (CURRENT)
- CLI runner src/run.mjs
- examples/ directory

## CRITICAL
Keep JSON responses SHORT. Error recovery commits overwrite fixes.