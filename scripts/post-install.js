// @ts-check
const { execSync } = require('child_process');
const { updateReferences } = require('./sync-ts-refs');
const { fork } = require('child_process');
const getRootDir = require('./get-root-dir');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

updateReferences();

fork(require.resolve('patch-package'), { cwd: getRootDir() });
const workspaceInfo = JSON.parse(execSync('yarn --silent workspaces info', { encoding: 'utf8' }));
const rootDir = getRootDir();
for (const [name, { location }] of Object.entries(workspaceInfo)) {
  const cwd = path.join(rootDir, location);
  if (!fs.existsSync(path.join(cwd, 'patches'))) {
    continue;
  }
  console.log(chalk.greenBright(`Patching ${name}`));
  fork(require.resolve('patch-package'), { cwd });
}
