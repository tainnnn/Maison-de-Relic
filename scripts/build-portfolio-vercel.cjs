const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(path.join(root, 'frontend'), output, {
  recursive: true,
  filter: (source) => !source.split(path.sep).includes('test') && path.basename(source) !== 'vercel.json',
});

if (!process.env.VERCEL) {
  console.log('Static frontend prepared; database setup runs on Vercel builds.');
  process.exit(0);
}

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.PORTFOLIO_DEMO !== 'true') {
  throw new Error('Set DATABASE_URL, JWT_SECRET and PORTFOLIO_DEMO=true in the Vercel project before deploying.');
}

for (const file of ['migrate.js', 'seed.js']) {
  const result = spawnSync(process.execPath, [path.join(root, 'backend', 'scripts', file)], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) throw new Error(`${file} failed during the Vercel build`);
}
