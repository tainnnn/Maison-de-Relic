const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(path.join(root, 'frontend'), output, {
  recursive: true,
  filter: (source) => !source.split(path.sep).includes('test') && path.basename(source) !== 'vercel.json',
});
const configPath = path.join(output, 'js', 'config.js');
fs.writeFileSync(configPath, fs.readFileSync(configPath, 'utf8').replace(
  'export const BROWSER_DEMO = false;', 'export const BROWSER_DEMO = true;'
));

console.log('Static browser demo prepared; no database is needed.');
