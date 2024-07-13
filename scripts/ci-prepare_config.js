const fs = require('fs');
const path = require('path');

// Get the JSON file path and target directory from the command line arguments
const jsonFilePath = process.argv[2];
const targetDirectory = process.argv[3];

if (!jsonFilePath || !targetDirectory) {
  console.error('Usage: node script.js <jsonFilePath> <targetDirectory>');
  process.exit(1);
}

// Read and parse the JSON file
const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
let settingsArray; let configFilePath;

if (targetDirectory.toLowerCase() === 'klipper') {
  settingsArray = data['Klipper Settings'];
  configFilePath = path.join('klipper', '.config');
} else if (targetDirectory.toLowerCase() === 'katapult') {
  settingsArray = data['Katapult Settings'];
  configFilePath = path.join('katapult', '.config');
} else {
  console.error('Invalid target directory. Must be "klipper" or "katapult".');
  process.exit(1);
}

const content = [];

// Check if LOW_LEVEL_OPTIONS is already present, if not, add as default setting
const lowLevelOptionExists = settingsArray.some((setting) => setting.trim().startsWith('LOW_LEVEL_OPTIONS'));

if (!lowLevelOptionExists) {
  content.push('CONFIG_LOW_LEVEL_OPTIONS=y'); // Add default setting if it doesn't exist
}

// Process each setting in the array
settingsArray.forEach((setting) => {
  let [key, value] = setting.split('=');

  key = 'CONFIG_' + key.trim();
  if (value === undefined) {
    value = 'y';
  }
  if (value !== 'y' && isNaN(value) && !/^-?\d+\.?\d*$/.test(value)) {
    value = '\"' + value.trim() + '\"';
  } else {
    value = value.trim();
  }
  content.push(key + '=' + value);
});

// Write the content to the .config file in the appropriate directory
fs.writeFileSync(configFilePath, content.join('\n'));
