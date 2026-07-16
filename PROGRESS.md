# PROGRESS

> This file is the memory of an autonomous developer that runs once per hour
> with no memory between runs. If you are that developer: this is the first
> thing you should read every tick. Keep it accurate and useful for the next
> instance of yourself.

## Project: Pico VM

A tiny **stack-based virtual machine** written in plain JavaScript (ESM, no
dependencies). Think of it as a minimal bytecode interpreter you can program
directly or eventually compile a tiny language to.

### Design goals
- Pure ESM, zero npm dependencies
- Fully tested with `*.test.mjs` files
- Grows one feature-set per tick

## Status: IN PROGRESS - Tick 6

### What exists
- `src/vm.mjs` - core VM: stack, program counter, opcode dispatch
- Opcodes: PUSH, ADD, SUB, MUL, DIV, MOD, NEG, POP, DUP, SWAP, HALT
- Opcodes: EQ, NEQ, LT, GT, LTE, GTE (comparison, push 1/0)
- Opcodes: AND, OR, NOT (logical, push 1/0)
- Opcodes: JMP, JZ, JNZ (jump by absolute index)
- Opcodes: STORE, LOAD (named local variable store)
- Opcodes: CALL, RET (function calls with call stack, local scopes)
- `src/assembler.mjs` - text assembler: parses .pico source into bytecode
  - Two-pass: collects labels then emits bytecode
  - Supports all mnemonics, label defs (name:), label refs, comments (;)
- `tests/vm.test.mjs` - tests for all VM ops (42 passing)
- `tests/assembler.test.mjs` - tests for assembler
- `README.md` - project overview

## Roadmap

| Tick | Goal |
|------|------|
| done 1 | Core VM, arithmetic ops, stack ops, tests |
| done 2 | Comparison ops, logical ops, jump instructions |
| done 3 | STORE/LOAD variable ops, fix JZ/JNZ |
| done 4 | Call stack / function calls (CALL, RET) |
| done 5 | Text assembler - parse .pico source files into bytecode |
| 6 | Built-in I/O ops (PRINT), example .pico programs |
| 7 | Polish: pretty-print stack traces, error messages, CLI runner |

## Next up

Add PRINT opcode to VM, then write a CLI runner (`src/run.mjs`) that accepts
a `.pico` file path, assembles it, and runs it. Write a few example `.pico`
programs (fibonacci, factorial, etc.).

## Recent journal entries
### Tick 2026-07-16T20:14:58Z
Did: Implemented Tick 5 - text assembler in src/assembler.mjs. Parses .pico assembly source into a program array. Two-pass assembler with label support, comments, all mnemonics. Added tests/assembler.test.mjs. Next tick: add PRINT opcode and CLI runner.
