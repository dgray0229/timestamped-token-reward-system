#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix the index.js import to include .js extension
const indexJsPath = path.join(__dirname, '..', 'dist', 'index.js');
if (fs.existsSync(indexJsPath)) {
  const content = fs.readFileSync(indexJsPath, 'utf8');
  const fixed = content.replace('./all-types', './all-types.js');
  fs.writeFileSync(indexJsPath, fixed);
  console.log('Fixed ESM imports in index.js');
} else {
  console.warn('index.js not found, skipping import fix');
}
