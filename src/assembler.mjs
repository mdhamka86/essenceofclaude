// Pico VM Text Assembler
// Parses .pico assembly source text into a program array.
//
// Syntax:
//   ; comment
//   label:          ; define a label
//   PUSH 42         ; instruction with operand
//   JMP loop        ; jump to label
//   HALT

import { OP } from './vm.mjs';

// Mnemonics that take one operand in the source
const ONE_OPERAND = new Set(['PUSH', 'JMP', 'JZ', 'JNZ', 'STORE', 'LOAD', 'CALL']);

// Map mnemonic -> opcode
const MNEMONIC = {
  PUSH: OP.PUSH,
  POP: OP.POP,
  DUP: OP.DUP,
  SWAP: OP.SWAP,
  ADD: OP.ADD,
  SUB: OP.SUB,
  MUL: OP.MUL,
  DIV: OP.DIV,
  MOD: OP.MOD,
  NEG: OP.NEG,
  HALT: OP.HALT,
  EQ: OP.EQ,
  NEQ: OP.NEQ,
  LT: OP.LT,
  GT: OP.GT,
  LTE: OP.LTE,
  GTE: OP.GTE,
  AND: OP.AND,
  OR: OP.OR,
  NOT: OP.NOT,
  JMP: OP.JMP,
  JZ: OP.JZ,
  JNZ: OP.JNZ,
  STORE: OP.STORE,
  LOAD: OP.LOAD,
  CALL: OP.CALL,
  RET: OP.RET,
};

/**
 * Assemble source text into a program array.
 * @param {string} source
 * @returns {Array}
 */
export function assemble(source) {
  // Tokenize: each entry is { type: 'label'|'instr', name, operand, lineNo }
  const tokens = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Strip comments
    const ci = line.indexOf(';');
    if (ci !== -1) line = line.slice(0, ci);
    line = line.trim();
    if (!line) continue;

    // Check for label definition: word followed by colon
    if (line.endsWith(':')) {
      const name = line.slice(0, -1).trim();
      if (!name) throw new Error('Empty label on line ' + (i + 1));
      tokens.push({ type: 'label', name, lineNo: i + 1 });
      continue;
    }

    // Could be "LABEL: INSTR operand" on same line
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const beforeColon = line.slice(0, colonIdx).trim();
      const afterColon = line.slice(colonIdx + 1).trim();
      // beforeColon must be a single word (label)
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(beforeColon)) {
        tokens.push({ type: 'label', name: beforeColon, lineNo: i + 1 });
        if (afterColon) {
          tokens.push(...parseInstr(afterColon, i + 1));
        }
        continue;
      }
    }

    tokens.push(...parseInstr(line, i + 1));
  }

  // Pass 1: calculate label addresses
  // We simulate layout: each instr emits 1 slot for opcode, 1 for operand if present
  const labels = {};
  let pos = 0;
  for (const tok of tokens) {
    if (tok.type === 'label') {
      labels[tok.name] = pos;
    } else {
      // instr
      pos += 1; // opcode slot
      if (ONE_OPERAND.has(tok.name)) pos += 1; // operand slot
    }
  }

  // Pass 2: emit bytecode
  const program = [];
  for (const tok of tokens) {
    if (tok.type === 'label') continue;
    const opcode = MNEMONIC[tok.name];
    if (opcode === undefined) {
      throw new Error('Unknown mnemonic: ' + tok.name + ' on line ' + tok.lineNo);
    }
    program.push(opcode);
    if (ONE_OPERAND.has(tok.name)) {
      const operand = tok.operand;
      if (operand === undefined) {
        throw new Error(tok.name + ' requires an operand on line ' + tok.lineNo);
      }
      program.push(resolveOperand(operand, labels, tok.name, tok.lineNo));
    }
  }

  return program;
}

function parseInstr(text, lineNo) {
  const parts = text.split(/\s+/);
  const name = parts[0].toUpperCase();
  const operand = parts[1]; // may be undefined
  return [{ type: 'instr', name, operand, lineNo }];
}

function resolveOperand(operand, labels, mnemonic, lineNo) {
  // If it looks like a number, return it as-is
  if (/^-?[0-9]+(\.[0-9]+)?$/.test(operand)) {
    return Number(operand);
  }
  // STORE/LOAD take string variable names
  if (mnemonic === 'STORE' || mnemonic === 'LOAD') {
    return operand; // keep as string
  }
  // Otherwise treat as label reference
  if (Object.prototype.hasOwnProperty.call(labels, operand)) {
    return labels[operand];
  }
  throw new Error('Undefined label: ' + operand + ' on line ' + lineNo);
}
