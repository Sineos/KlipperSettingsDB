const fs = require('fs');
const path = require('path');

const mergeJsonFiles = (directory, outputFile) => {
  const mergedData = [];

  try {
    fs.readdirSync(directory).forEach((filename) => {
      if (filename.endsWith('.json')) {
        const filePath = path.join(directory, filename);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        mergedData.push(data);
      }
    });

    fs.writeFileSync(outputFile, JSON.stringify(mergedData, null, 4));
  } catch (error) {
    console.error('Error merging JSON files:', error);
    throw error;
  }
};

mergeJsonFiles('settings', 'master.json');
