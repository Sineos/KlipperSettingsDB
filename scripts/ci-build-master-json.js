const INPUT_FOLDER = 'settings';
const OUTPUT = 'master.json';

const fs = require('fs');
const path = require('path');

const mergeJsonFiles = (directory, outputFile) => {
  const mergedData = [];

  try {
    const files = fs.readdirSync(directory);

    files.forEach((filename) => {
      if (filename.endsWith('.json')) {
        const filePath = path.join(directory, filename);

        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          mergedData.push(data);
        } catch (parseError) {
          console.error(`Error parsing JSON file ${filename}:`, parseError);
          throw parseError;
        }
      }
    });

    fs.writeFileSync(outputFile, JSON.stringify(mergedData, null, 4));
    console.log(`Merged data written to ${outputFile}`);
  } catch (error) {
    console.error('Error merging JSON files:', error);
    throw error;
  }
};

mergeJsonFiles(INPUT_FOLDER, OUTPUT);
