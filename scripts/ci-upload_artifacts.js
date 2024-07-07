const fs = require('fs');
const path = require('path');
const { DefaultArtifactClient } = require('@actions/artifact');

// Get the JSON file path and build type (klipper/katapult) from the command line arguments
const [jsonFilePath, buildType] = process.argv.slice(2);

if (!jsonFilePath || !buildType) {
  console.error('No JSON file path or build type provided.');
  process.exit(1);
}

// Load the JSON configuration
const config = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

const manufacturer = config['Board Information']['Manufacturer'];
const name = config['Board Information']['Name'].replace(/\s+/g, '-');
const revision = config['Board Information']['Revision'];
const role = config['Board Information']['Role'].replace(/\s+/g, '-');

const klipperOutDir = 'klipper/out';
const katapultOutDir = 'katapult/out';
const klipperConfigDir = 'klipper';
const katapultConfigDir = 'katapult';
const outputDir = 'artifacts';

// Ensure the output directory exists and is empty
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

// Function to rename and move files
function processFiles(sourceDir, configDir, prefix, files) {
  files.forEach((file) => {
    const sourcePath = path.join(sourceDir, file);

    if (fs.existsSync(sourcePath)) {
      const ext = path.extname(file);
      const baseName = path.basename(file, ext);
      const newFileName = file === 'deployer.bin'
        ? `${prefix}_deployer_${manufacturer}_${name}_${revision}_${role}${ext}`
        : `${prefix}_${manufacturer}_${name}_${revision}_${role}${ext}`;
      const destPath = path.join(outputDir, newFileName);

      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${sourcePath} to ${destPath}`);
    }
  });

  // Handle .config file
  const configFilePath = path.join(configDir, '.config');

  if (fs.existsSync(configFilePath)) {
    const newConfigFileName = `${prefix}_${manufacturer}_${name}_${revision}_${role}.config`;
    const destConfigPath = path.join(outputDir, newConfigFileName);

    fs.copyFileSync(configFilePath, destConfigPath);
    console.log(`Copied ${configFilePath} to ${destConfigPath}`);
  }
}

// Process files based on the build type
if (buildType === 'klipper') {
  processFiles(klipperOutDir, klipperConfigDir, 'klipper', ['klipper.bin', 'klipper.dict']);
} else if (buildType === 'katapult') {
  processFiles(katapultOutDir, katapultConfigDir, 'katapult', ['katapult.bin', 'deployer.bin'].filter((file) => fs.existsSync(path.join(katapultOutDir, file))));
}

// Upload artifacts
(async() => {
  const artifactClient = new DefaultArtifactClient();
  const files = fs.readdirSync(outputDir).map((file) => path.join(outputDir, file));

  for (const file of files) {
    try {
      const artifactName = path.basename(file);
      const rootDirectory = outputDir;

      const { id, size } = await artifactClient.uploadArtifact(artifactName, [file], rootDirectory);

      console.log(`Artifact uploaded with ID: ${id} and size: ${size} bytes`);
    } catch (error) {
      console.error(`Artifact upload failed: ${error}`);
    }
  }
})();
