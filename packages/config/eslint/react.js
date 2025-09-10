module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
  },
  rules: {
    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed with React 18
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // JSX rules
    'react/jsx-uses-react': 'off', // Not needed with React 18
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-pascal-case': 'error',
    
    // Performance
    'react/jsx-no-bind': ['warn', {
      ignoreDOMComponents: false,
      ignoreRefs: true,
      allowArrowFunctions: true,
      allowFunctions: false,
      allowBind: false,
    }],
  },
};