// @ts-check
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const deepEqual = require('deep-equal');
const clone = require('rfdc/default');
const JSON = require('comment-json'); // override system JSON lib
const normalizePath = require('normalize-path');
const getRootDir = require('./get-root-dir');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function updateJson(filePath, callback) {
  const data = readJson(filePath);
  const updatedData = callback(clone(data)) || data;
  if (!deepEqual(data, updatedData)) {
    console.log(filePath, updatedData);
    if (process.argv.indexOf('--dry') == -1) {
      fs.writeFileSync(filePath, JSON.stringify(updatedData, undefined, 2));
    }
  }
}

function updateReferences() {
  console.log('Checking and updating TS project references!');
  const workspaceInfo = JSON.parse(execSync('yarn --silent workspaces info', { encoding: 'utf8' }));

  const tsWorkspaces = {};
  const rootDir = getRootDir();

  workspaceInfo['<root>'] = {
    location: '',
    workspaceDependencies: Object.keys(workspaceInfo),
  };

  for (const [packageName, { location: dir, workspaceDependencies }] of Object.entries(workspaceInfo)) {
    const tsConfigPath = path.join(rootDir, dir, 'tsconfig.json');
    const packageJsonPath = path.join(rootDir, dir, 'package.json');
    if (!fs.existsSync(tsConfigPath)) {
      // not a TS project
      continue;
    }
    tsWorkspaces[packageName] = {
      packageName,
      dir: path.join(rootDir, dir),
      tsConfigPath,
      workspaceDependencies,
      packageJsonPath,
    };
  }

  for (const workspace of Object.values(tsWorkspaces)) {
    if (!workspace.tsConfigPath) {
      continue;
    }
    updateJson(workspace.tsConfigPath, (tsConfig) => {
      const package = readJson(workspace.packageJsonPath);
      const depKeys = Object.keys(package.dependencies || [])
        .concat(Object.keys(package.devDependencies || []))
        .concat(Object.keys(package.peerDependencies || []))
        .filter((dep) => !!tsWorkspaces[dep]);
      const deps = new Set(depKeys.concat(workspace.workspaceDependencies));
      tsConfig.references = Array.from(deps.values())
        .filter((moduleId) => !!tsWorkspaces[moduleId]) // only modules which were added to tsWorkspaces
        .map((moduleId) => ({
          path: normalizePath(path.relative(workspace.dir, tsWorkspaces[moduleId].tsConfigPath)),
        }));
      return tsConfig;
    });
  }

  console.log('done!');
}

module.exports = { updateReferences };
