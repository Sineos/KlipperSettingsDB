const fs = require('fs');
const path = require('path');

const settingsDir = path.join(__dirname, 'settings');
const masterFile = path.join(__dirname, 'master.json');

let masterJson = [];

fs.readdir(settingsDir, (err, files) => {
    if (err) {
        console.error('Unable to scan directory:', err);
        process.exit(1);
    }

    files.forEach(file => {
        if (file.endsWith('.json')) {
            const filePath = path.join(settingsDir, file);
            const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            masterJson.push(fileData);
        }
    });

    fs.writeFileSync(masterFile, JSON.stringify(masterJson, null, 2));
    console.log('master.json has been updated');
});
