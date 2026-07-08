const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{packages,apps,examples}/**/package.json');
files.push('package.json');

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let newC = c.replace(/"version":\s*"([0-9]+\.[0-9]+\.[0-9]+)-alpha[^"]*"/g, '"version": "$1"');
  if (c !== newC) {
    fs.writeFileSync(f, newC);
    console.log('Fixed', f);
  }
});
