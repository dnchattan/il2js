// @ts-check
const { execSync } = require('child_process');
const path = require('path');
const resolveBin = require('resolve-bin');

const args = process.argv.slice(2);
let target;
for (let n = 0; n < args.length; ++n) {
  if (args[n].toLocaleLowerCase() === '--target') {
    target = args[++n];
  }
}

const validTargets = ['electron', 'node'];
if (!validTargets.includes(target)) {
  throw new Error(`Must specify a valid --target [${validTargets.join(' | ')}]`);
}

const modules = ['lz4'];
const modulePaths = modules.map((name) => path.dirname(require.resolve(`${name}/package.json`)));
const nodeGypBuildArgs = { electron: '--target=12.0.0 --arch=x64 --dist-url=https://electronjs.org/headers', node: '' }[
  target
];
resolveBin('node-gyp', (err, bin) => {
  for (const modulePath of modulePaths) {
    const cmd = `node ${bin} rebuild ${nodeGypBuildArgs}`;
    console.log(cmd, { modulePath });
    execSync(cmd, { cwd: modulePath });
  }
});
