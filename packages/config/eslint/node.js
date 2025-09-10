module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    browser: false,
  },
  rules: {
    // Node.js specific rules
    'no-console': 'off', // Console logging is common in Node.js
    'no-process-env': 'off',
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Error handling
    'handle-callback-err': 'error',
    'no-mixed-requires': 'error',
    'no-new-require': 'error',
    'no-path-concat': 'error',
    
    // Best practices for Node.js
    'prefer-promise-reject-errors': 'error',
    'require-await': 'error',
    'no-return-await': 'error',
  },
};