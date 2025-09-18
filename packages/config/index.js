// Config package exports - for ESLint, TypeScript, and Jest configurations
module.exports = {
  eslint: {
    base: require('./eslint/base.js'),
    node: require('./eslint/node.js'),
    react: require('./eslint/react.js'),
  },
};