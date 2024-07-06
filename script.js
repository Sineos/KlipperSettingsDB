document.addEventListener('DOMContentLoaded', () => {
  const linkFormatter = function(cell, formatterParams, onRendered) {
    const value = cell.getValue();
    const url = value ? value : '#';
    const label = value ? 'Link' : '';

    return `<a href="${url}" target="_blank">${label}</a>`;
  };

  Promise.all([
    fetch('master.json').then((response) => response.json()),
    fetch('lookup_klipper.json').then((response) => response.json()),
    fetch('lookup_katapult.json').then((response) => response.json())
  ]).then(([data, klipperLookup, katapultLookup]) => {
    const columns = [
      { title: 'Manufacturer', field: 'Board Information.Manufacturer', headerFilter: 'input', responsive: 0 },
      { title: 'Name', field: 'Board Information.Name', headerFilter: 'input', responsive: 0 },
      { title: 'Revision', field: 'Board Information.Revision', headerFilter: 'input', responsive: 0 },
      { title: 'Role', field: 'Board Information.Role', headerFilter: 'input', responsive: 0 },
      { title: 'Klipper Flashing Method', field: 'Board Information.Flashing Methods.Klipper', headerFilter: 'input', responsive: 0 },
      { title: 'Katapult Flashing Method', field: 'Board Information.Flashing Methods.Katapult', headerFilter: 'input', responsive: 0 },
      { title: 'Board Link 1', field: 'Board Information.Links.Board Link 1', responsive: 0, formatter: linkFormatter },
      { title: 'Board Link 2', field: 'Board Information.Links.Board Link 2', responsive: 0, formatter: linkFormatter },
      { title: 'Comment', field: 'Board Information.Comment', responsive: 1 },
      { title: 'Klipper Settings', field: 'Klipper Settings', responsive: 5, formatter: 'html' },
      { title: 'Katapult Settings', field: 'Katapult Settings', responsive: 5, formatter: 'html' }
    ];

    // Add download columns with FontAwesome download icon
    columns.push({
      title: 'Download Klipper Settings',
      formatter() {
        return '<i class="fa fa-download" aria-hidden="true"></i>';
      },
      hozAlign: 'center',
      cellClick(e, cell) {
        const rowData = cell.getRow().getData();

        downloadSettings(rowData, 'Klipper');
      },
      responsive: 3
    });
    columns.push({
      title: 'Download Katapult Settings',
      formatter() {
        return '<i class="fa fa-download" aria-hidden="true"></i>';
      },
      hozAlign: 'center',
      cellClick(e, cell) {
        const rowData = cell.getRow().getData();

        downloadSettings(rowData, 'Katapult');
      },
      responsive: 3
    });

    // Translate settings
    data.forEach((row) => {
      if (row['Klipper Settings']) {
        row['Klipper Settings Raw'] = row['Klipper Settings']; // Store raw settings
        row['Klipper Settings'] = formatSettings(klipperLookup, row['Klipper Settings']);
      }
      if (row['Katapult Settings']) {
        row['Katapult Settings Raw'] = row['Katapult Settings']; // Store raw settings
        row['Katapult Settings'] = formatSettings(katapultLookup, row['Katapult Settings']);
      }
    });

    const table = new Tabulator('#board-table', {
      data,
      columns,
      layout: 'fitData',
      responsiveLayout: 'collapse',
      rowHeader: { formatter: 'responsiveCollapse', width: 150, minWidth: 30, hozAlign: 'center', resizable: false, headerSort: false },
      responsiveLayoutCollapseStartOpen: false,
      responsiveLayoutCollapseFormatter(data) {
        const list = document.createElement('ul');

        data.forEach((col) => {
          const item = document.createElement('li');

          item.innerHTML = `<strong>${col.title}</strong> ${col.value}`;
          list.appendChild(item);
        });

        return Object.keys(data).length ? list : '';
      }
    });
  });

  function formatSettings(lookupJson, settings) {
    let settingsArray = [];

    if (typeof settings === 'string') {
      settingsArray = settings.split('\n');
    } else if (Array.isArray(settings)) {
      settingsArray = settings;
    } else {
      console.error('Unexpected settings format:', settings);

      return '';
    }

    const formattedItems = lookupItems(settingsArray, lookupJson);

    const list = formattedItems.map((item) => `<li>${item.friendlySetting}: ${item.friendlyValue}</li>`).join('');

    return `<ul>${list}</ul>`;
  }

  function lookupItems(items, jsonStructure) {
    const result = [];

    items.forEach((item) => {
      const [setting, value] = item.split('=');

      for (const category in jsonStructure) {
        const categoryObj = jsonStructure[category];

        if (category === 'General Settings' && isTopLevel(categoryObj, setting)) {
          result.push({
            setting,
            friendlySetting: categoryObj[setting],
            friendlyValue: value || ''
          });

          return; // Exit the loop once the item is found
        }

        if (isTopLevel(categoryObj, setting)) {
          result.push({
            setting,
            friendlySetting: category,
            friendlyValue: categoryObj[setting] || ''
          });

          return; // Exit the loop once the item is found
        }

        for (const subCategory in categoryObj) {
          const subCategoryObj = categoryObj[subCategory];

          if (subCategoryObj.hasOwnProperty(setting)) {
            result.push({
              setting,
              friendlySetting: subCategory,
              friendlyValue: subCategoryObj[setting] || ''
            });

            return; // Exit the loop once the item is found
          }
        }
      }
    });

    return result;
  }

  function isTopLevel(categoryObj, item) {
    return categoryObj.hasOwnProperty(item);
  }

  function downloadSettings(rowData, type) {
    const settingsArray = rowData[`${type} Settings Raw`]; // Use the raw settings from the original JSON

    if (!settingsArray) {
      console.error(`Raw settings for ${type} not found.`);

      return;
    }

    const filename = `${rowData['Board Information'].Manufacturer}_${rowData['Board Information'].Name}_${rowData['Board Information'].Revision}_${rowData['Board Information'].Role}`
      .replace(/\s+/g, '-') + '.oldconfig';

    const content = [
      `# Manufacturer: ${rowData['Board Information'].Manufacturer}`,
      `# Name: ${rowData['Board Information'].Name}`,
      `# Revision: ${rowData['Board Information'].Revision}`,
      `# Role: ${rowData['Board Information'].Role}`,
      ''
    ];

    // Check if "CONFIG_LOW_LEVEL_OPTIONS" exists
    // It seems that "make olddefconfig" does not respect settings
    // that depend on a higher level if this level is not set
    const lowLevelOptionExists = settingsArray.some((setting) => setting.trim().startsWith('LOW_LEVEL_OPTIONS'));

    if (!lowLevelOptionExists) {
      content.push('CONFIG_LOW_LEVEL_OPTIONS=y'); // Add default setting if it doesn't exist
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

    // Make sure to use correct encoding (Unix line endings / ASCII)
    const blob = new Blob([content.join('\n')], { type: 'text/plain;charset=ascii' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
