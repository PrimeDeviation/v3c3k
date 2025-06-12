#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common API key patterns
const API_KEY_PATTERNS = [
  /sk-[a-zA-Z0-9]{32,}/,  // OpenAI
  /sk-ant-[a-zA-Z0-9]{32,}/,  // Anthropic
  /AIza[a-zA-Z0-9_-]{35}/,  // Google
  /[a-zA-Z0-9_-]{32,}/,  // Generic API key pattern
];

// Files/directories to ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /dist/,
  /\.git/,
  /package-lock\.json/,
];

function checkFile(filePath) {
  if (IGNORE_PATTERNS.some(pattern => pattern.test(filePath))) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return API_KEY_PATTERNS.some(pattern => pattern.test(content));
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return false;
  }
}

function main() {
  const stagedFiles = process.argv.slice(2);
  const filesWithSecrets = stagedFiles.filter(checkFile);

  if (filesWithSecrets.length > 0) {
    console.error('\n⚠️  Potential API keys found in staged files:');
    filesWithSecrets.forEach(file => console.error(`   - ${file}`));
    console.error('\nPlease remove any API keys before committing.');
    process.exit(1);
  }
}

main(); 