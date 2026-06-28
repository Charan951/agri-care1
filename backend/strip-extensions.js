const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const srcDir = './src';
walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Replace relative imports ending with .js
    // e.g. import { User } from '../models/User.js' -> from '../models/User'
    const updated = content.replace(/(from\s+['"]\.\.?\/.*?)\.js(['"])/g, '$1$2');
    if (updated !== content) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`Stripped .js from imports in: ${filePath}`);
    }
  }
});
