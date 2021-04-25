module.exports = {
  ...require('../../.eslintrc.js'),
  parserOptions: {
    project: require('path').join(__dirname, 'tsconfig.json'),
  },
};
