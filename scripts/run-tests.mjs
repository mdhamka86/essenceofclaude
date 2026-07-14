// run-tests.mjs
// A deliberately simple, dependency-free test runner so the agent can add
// tests without pulling in a framework. It finds every file ending in
// ".test.mjs" anywhere in the repo (except node_modules) and runs it.
//
// A test file just imports and calls things and throws on failure. If it
// runs to completion without throwing, it passes. If NO test files exist
// yet, that's a pass too — an empty project shouldn't fail CI.

import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(process.cwd());

function findTests(dir) {
  let found = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) found = found.concat(findTests(full));
    else if (name.endsWith(".test.mjs")) found.push(full);
  }
  return found;
}

const tests = findTests(ROOT);

if (tests.length === 0) {
  console.log("No test files found yet. Passing (empty project).");
  process.exit(0);
}

let failures = 0;
for (const file of tests) {
  try {
    await import(pathToFileURL(file).href);
    console.log(`PASS  ${file.replace(ROOT + "/", "")}`);
  } catch (err) {
    failures++;
    console.error(`FAIL  ${file.replace(ROOT + "/", "")}`);
    console.error("      " + String(err).split("\n").join("\n      "));
  }
}

console.log(`\n${tests.length - failures}/${tests.length} test files passed.`);
process.exit(failures ? 1 : 0);
