#!/usr/bin/env node
'use strict';
if (process.argv.indexOf('--no-color') === -1) {
  process.argv.push('--color');
}
require('./lib/Cli');
