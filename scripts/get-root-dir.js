// @ts-check
const { execSync } = require('child_process');

function getRootDir() {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
}

module.exports = getRootDir;
