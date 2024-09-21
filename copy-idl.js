const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'target', 'idl');
const destDir = path.join(__dirname, 'chads-defi-frontend', 'public');

fs.readdirSync(sourceDir).forEach(file => {
  if (file.endsWith('.json')) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, 'idl.json'));
    console.log(`Copied ${file} to frontend public directory`);
  }
});