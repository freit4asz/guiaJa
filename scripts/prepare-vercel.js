const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const buildDirectory = path.join(projectRoot, 'client', 'dist', 'client', 'browser');
const publicDirectory = path.join(projectRoot, 'public');

if (!fs.existsSync(path.join(buildDirectory, 'index.html'))) {
  throw new Error('Build Angular não encontrado. Execute npm run build:client antes.');
}

fs.cpSync(buildDirectory, publicDirectory, {recursive: true});
