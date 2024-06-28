import fs from 'fs';
import path from 'path';

function parseKconfigFile(filePath, rootDir, choiceOptions, helpOptions, defaults, includeAllOptions = false) {
  filePath = path.resolve(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  let inChoiceBlock = false;
  let inHelpBlock = false;
  let currentOption = null;

  fileContent.split('\n').forEach((line) => {
    // Handle source directives in Kconfig
    const sourceMatch = line.match(/^\s*source\s+"([^"]+)"/);

    if (sourceMatch) {
      const subKconfigPath = path.join(rootDir, sourceMatch[1]);

      parseKconfigFile(subKconfigPath, rootDir, choiceOptions, helpOptions, defaults);
    }

    // Handle choice blocks
    if (/^\s*choice\s*$/.test(line)) {
      inChoiceBlock = true;
    } else if (/^\s*endchoice\s*$/.test(line)) {
      inChoiceBlock = false;
    } else if (inChoiceBlock) {
      const configMatch = line.match(/^\s*config\s+([A-Z0-9_]+)/);

      if (configMatch) {
        choiceOptions.add('CONFIG_' + configMatch[1]);
      }
    }

    // Handle config options and help blocks
    const configMatch = line.match(/^\s*config\s+([A-Z0-9_]+)/);

    if (configMatch) {
      currentOption = 'CONFIG_' + configMatch[1];
      inHelpBlock = false; // Reset help block flag
      if (includeAllOptions) {
        helpOptions.add(currentOption);
      }
    } else if (/^\s*help\s*$/.test(line)) {
      inHelpBlock = true;
    } else if (inHelpBlock && currentOption) {
      helpOptions.add(currentOption);
    } else if (inHelpBlock && !line.startsWith('\t')) {
      inHelpBlock = false;
      currentOption = null;
    }

    // Handle default values
    const defaultMatch = line.match(/^\s*default\s+"?([^"]+)"?/);

    if (defaultMatch && currentOption) {
      defaults[currentOption] = defaultMatch[1];
    }
  });
}

// Function to parse .config file
function parseConfig(configFile) {
  return fs.readFileSync(configFile, 'utf-8').split('\n');
}

// Function to filter relevant options from .config
function filterRelevantOptions(configLines, choiceOptions, helpOptions, defaults) {
  return configLines.filter((line) => {
    const match = line.match(/^(CONFIG_[A-Z0-9_]+)="?([^"]+)"?/);

    if (match) {
      const option = match[1];
      const value = match[2];

      return (choiceOptions.has(option) || helpOptions.has(option)) && value !== defaults[option];
    }

    return false;
  });
}

// Main function
function main() {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  const options = {
    firmware: 'klipper',
    firmwarePath: path.join(process.env.HOME, 'klipper') // Default to Klipper
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--klipper') {
      options.firmware = 'klipper';
      options.firmwarePath = path.join(process.env.HOME, 'klipper');
    } else if (args[i] === '--katapult') {
      options.firmware = 'katapult';
      options.firmwarePath = path.join(process.env.HOME, 'katapult');
    } else if (args[i] === '--klipper_path') {
      options.firmware = 'klipper';
      options.firmwarePath = args[++i]; // Take the next argument as the path
    } else if (args[i] === '--katapult_path') {
      options.firmware = 'katapult';
      options.firmwarePath = args[++i]; // Take the next argument as the path
    }
  }

  // Adjusted paths based on arguments
  const mainKconfigPath = path.join(options.firmwarePath, 'src', 'Kconfig');
  const configFilePath = path.join(options.firmwarePath, '.config');

  const choiceOptions = new Set();
  const helpOptions = new Set();
  const defaults = {};

  if (options.firmware === 'katapult') {
    // Include all options from main Kconfig for Kataplut
    parseKconfigFile(mainKconfigPath, options.firmwarePath, choiceOptions, helpOptions, defaults, true);
  } else {
    // Reduced scope for Klipper, i.e. only "choice" and "help" blocks
    parseKconfigFile(mainKconfigPath, options.firmwarePath, choiceOptions, helpOptions, defaults);
  }

  const configLines = parseConfig(configFilePath);

  filterRelevantOptions(configLines, choiceOptions, helpOptions, defaults)
    .forEach((line) => console.log(line.trim()));
}

main();
