const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const buildDirectory = path.join(projectRoot, 'client', 'dist', 'client', 'browser');
const publicDirectory = path.join(projectRoot, 'public');

if (!fs.existsSync(path.join(buildDirectory, 'index.html'))) {
  throw new Error('Build Angular não encontrado. Execute npm run build:client antes.');
}

const bundles = fs.readdirSync(buildDirectory).filter(file => file.endsWith('.js'));
const renamedBundles = new Map(bundles.map(file => [file, file.replace(/\.js$/, '.bundle')]));

for (const file of bundles) {
  const sourcePath = path.join(buildDirectory, file);
  let contents = fs.readFileSync(sourcePath, 'utf8');

  for (const [originalName, renamedName] of renamedBundles) {
    contents = contents.replaceAll(originalName, renamedName);
  }

  fs.writeFileSync(path.join(buildDirectory, renamedBundles.get(file)), contents);
  fs.unlinkSync(sourcePath);
}

const indexPath = path.join(buildDirectory, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');
for (const [originalName, renamedName] of renamedBundles) {
  index = index.replaceAll(originalName, renamedName);
}
fs.writeFileSync(indexPath, index);

fs.cpSync(buildDirectory, publicDirectory, {recursive: true});
