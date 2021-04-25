// @ts-check
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const normalizePath = require('normalize-path');
const assert = require('assert');
const findUp = require('find-up');
const path = require('path');
const args = yargs(hideBin(process.argv)).argv;

if (!args.script) {
  console.error('No valid script selected');
  process.exit(0);
}

assert(typeof args.script === 'string');
assert(args._ instanceof Array);
// if (args.cwd) {
//   assert(typeof args.cwd === 'string');
//   process.chdir(normalizePath(args.cwd));
// }

const debugJs = findUp.sync(['.debug.js', '.debug.ts']);
if (debugJs) {
  console.log(`Redirecting to debug script`);
  args.script = debugJs;
}

assert(typeof args.script === 'string');

process.argv[1] = args.script;
// @ts-ignore
process.argv.splice(2, process.argv.length - 2, ...args._);
process.chdir(normalizePath(path.dirname(args.script)));

if (args.script.endsWith('.ts')) {
  require('ts-node').register({ preferTsExts: true });
} else if (!args.script.endsWith('.js')) {
  console.error('No valid script selected');
  process.exit(-1);
}
require(args.script);
