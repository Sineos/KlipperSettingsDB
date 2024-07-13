const INPUT_FOLDER = '../settings';
const OLDCONFIG_DIR = '../oldconfig';

const fs = require('fs');
const path = require('path');

// Delete the oldconfig directory if it exists, then recreate it
const oldconfigDir = path.join(__dirname, OLDCONFIG_DIR);

if (fs.existsSync(oldconfigDir)) {
  fs.rmSync(oldconfigDir, { recursive: true, force: true });
}

fs.mkdirSync(oldconfigDir);

// Read all JSON files in the settings directory
const settingsDir = path.join(__dirname, INPUT_FOLDER);
const jsonFiles = fs.readdirSync(settingsDir).filter((file) => file.endsWith('.json'));

jsonFiles.forEach((file) => {
  const filePath = path.join(settingsDir, file);
  const rowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const boardInfo = rowData['Board Information'];
  const settingsTypes = ['Klipper Settings', 'Katapult Settings'];

  settingsTypes.forEach((type) => {
    const settingsArray = rowData[type];

    if (!settingsArray) {
      console.error(`Settings for ${type} not found in ${file}.`);
      
      return;
    }

    // Construct each part of the filename
    const manufacturer = boardInfo.Manufacturer.trim().toLowerCase().replace(/\s+/g, '_');
    const name = boardInfo.Name.trim().toLowerCase().replace(/\s+/g, '_');
    const revision = boardInfo.Revision.trim().toLowerCase().replace(/\s+/g, '_');
    const role = boardInfo.Role.trim().toLowerCase().replace(/\s+/g, '_');
    const settingsType = type.replace(' ', '_').toLowerCase();

    // Join the parts with underscores
    const filename = `${manufacturer}_${name}_${revision}_${role}_${settingsType}.oldconfig`;

    const content = [
      `# Manufacturer: ${boardInfo.Manufacturer}`,
      `# Name: ${boardInfo.Name}`,
      `# Revision: ${boardInfo.Revision}`,
      `# Role: ${boardInfo.Role}`,
      ''
    ];

    const lowLevelOptionExists = settingsArray.some((setting) => setting.trim().startsWith('LOW_LEVEL_OPTIONS'));

    if (!lowLevelOptionExists) {
      content.push('CONFIG_LOW_LEVEL_OPTIONS=y');
    }

    settingsArray.forEach((setting) => {
      let [key, value] = setting.split('=');

      key = `CONFIG_${key.trim()}`;

      if (value === undefined) {
        value = 'y';
      }

      if (value !== 'y' && isNaN(value) && !/^-?\d+\.?\d*$/.test(value)) {
        value = `"${value.trim()}"`;
      } else {
        value = value.trim();
      }

      content.push(`${key}=${value}`);
    });

    const oldconfigPath = path.join(oldconfigDir, filename);

    fs.writeFileSync(oldconfigPath, content.join('\n'), { encoding: 'ascii' });
    console.log(`Generated ${oldconfigPath}`);
  });
});
