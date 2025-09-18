module.exports = {
  extends: [
    '../../packages/config/eslint/base.js',
    '../../packages/config/eslint/react.js',
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};