module.exports = {
  root: true,
  extends: ['@reward-system/config/eslint/base'],
  settings: {
    next: {
      rootDir: ['apps/*/'],
    },
  },
};