// @ts-check
const { task, series, tscTask, jestTask, parallel, eslintTask } = require('just-scripts');
const glob = require('glob');
const path = require('path');

task('ts', tscTask({ build: true }));
task('test', jestTask());
task(
  'lint',
  parallel(
    ...glob
      .sync('./packages/**/.eslintrc.js')
      .map((config) => eslintTask({ files: [path.dirname(config)], configPath: config }))
  )
);
task('ci', series('ts', parallel('test', 'lint')));
