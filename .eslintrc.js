module.exports = {
  root: true,
  extends: ['./packages/config/eslint/base.js'],
  settings: {
    next: {
      rootDir: ['apps/*/'],
    },
  },
};