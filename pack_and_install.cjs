const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, 'packages');
const testAppDir = path.join(__dirname, '../teste-sdk-walletnow');
const packages = ['core', 'crypto', 'contracts', 'identity', 'wallet', 'onboarding'];

const tarballs = [];

for (const pkg of packages) {
  const pkgDir = path.join(packagesDir, pkg);
  if (fs.existsSync(pkgDir)) {
    console.log(`Packing ${pkg}...`);
    try {
      execSync('npm pack', { cwd: pkgDir, stdio: 'inherit' });
      const files = fs.readdirSync(pkgDir).filter(f => f.endsWith('.tgz'));
      for (const file of files) {
        const oldPath = path.join(pkgDir, file);
        const newPath = path.join(testAppDir, file);
        fs.renameSync(oldPath, newPath);
        tarballs.push(newPath);
      }
    } catch (e) {
      console.error(`Failed to pack ${pkg}:`, e);
    }
  }
}

console.log('Tarballs moved to teste-sdk-walletnow:');
console.log(tarballs.join('\n'));

if (tarballs.length > 0) {
  console.log('Installing tarballs in teste-sdk-walletnow...');
  const tarballNames = tarballs.map(t => path.basename(t)).join(' ');
  try {
    execSync(`npm install ${tarballNames}`, { cwd: testAppDir, stdio: 'inherit' });
    console.log('Installation successful!');
  } catch (e) {
    console.error('Failed to install tarballs:', e);
  }
}
