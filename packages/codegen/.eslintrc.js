const base = require('../../.eslintrc.js');
module.exports = {
  ...base,
  parserOptions: {
    project: require('path').join(__dirname, 'tsconfig.json'),
  },
  rules: {
    ...base.rules,
    'no-console': 'off',
  },
};
