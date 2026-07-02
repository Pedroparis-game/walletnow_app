const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('dist')) {
                results = results.concat(getFiles(fullPath));
            }
        } else if (file === 'package.json') {
            results.push(fullPath);
        }
    }
    return results;
}

getFiles('packages').forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('"workspace:*"')) {
        content = content.replace(/"workspace:\*"/g, '"*"');
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
});
