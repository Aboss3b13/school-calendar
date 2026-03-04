const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'expo-linear-gradient', 'tsconfig.json');

try {
  if (!fs.existsSync(target)) {
    process.exit(0);
  }

  const input = fs.readFileSync(target, 'utf8');
  const desired = '"../expo-module-scripts/tsconfig.base.json"';
  const output = input
    .replace('"expo-module-scripts/tsconfig.base"', desired)
    .replace('"expo-module-scripts/tsconfig.base.json"', desired);

  if (output === input) {
    process.exit(0);
  }

  fs.writeFileSync(target, output, 'utf8');
  console.log('Patched expo-linear-gradient tsconfig extends path');
} catch (error) {
  console.error('Failed to patch expo-linear-gradient tsconfig:', error);
  process.exit(1);
}
