// @ts-check
const { task, series, tscTask, jestTask, parallel, eslintTask } = require('just-scripts');

task('ts', tscTask({ build: '.' }));
task('test', jestTask());
task('lint', eslintTask({ files: ['src'] }));

task('build', series('ts'));
task('ci', series(parallel('ts', 'lint'), 'test'));
