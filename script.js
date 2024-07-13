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
      { title: 'Klipper Flashing Method Initial', field: 'Board Information.Flashing Methods Initial.Klipper', headerFilter: 'input', formatter: flashingMethodFormatter, responsive: 0 },
      { title: 'Klipper Flashing Method Update', field: 'Board Information.Flashing Methods Update.Klipper', headerFilter: 'input', formatter: flashingMethodFormatter, responsive: 0 },
      { title: 'Katapult Flashing Method Initial', field: 'Board Information.Flashing Methods Initial.Katapult', headerFilter: 'input', formatter: flashingMethodFormatter, responsive: 0 },
      { title: 'Katapult Flashing Method Update', field: 'Board Information.Flashing Methods Update.Katapult', headerFilter: 'input', formatter: flashingMethodFormatter, responsive: 0 },
      { title: 'Board Link 1', field: 'Board Information.Links.Board Link 1', formatter: linkFormatter },
      { title: 'Board Link 2', field: 'Board Information.Links.Board Link 2', formatter: linkFormatter, responsive: 0 },
      { title: 'Comment', field: 'Board Information.Comment', formatter: commentFormatter },
      { title: 'Klipper Settings', field: 'Klipper Settings', formatter: 'html', minWidth: 900 },
      { title: 'Katapult Settings', field: 'Katapult Settings', formatter: 'html', minWidth: 900 },
      {
        title: 'Download Klipper Settings',
        responsive: 0,
        hozAlign: 'center',
        formatter(cell, formatterParams, onRendered) {
          const rowData = cell.getRow().getData();


          return generateDownloadLink(rowData, 'Klipper Settings');
        }
      },
      {
        title: 'Download Katapult Settings',
        responsive: 0,
        hozAlign: 'center',
        formatter(cell, formatterParams, onRendered) {
          const rowData = cell.getRow().getData();


          return generateDownloadLink(rowData, 'Katapult Settings');
        }
      }
    ];

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
      layout: 'fitDataStretch',
      responsiveLayout: 'collapse',
      rowHeader: { formatter: 'responsiveCollapse', width: 30, minWidth: 30, hozAlign: 'center', resizable: false, headerSort: false },
      responsiveLayoutCollapseStartOpen: false,
      responsiveLayoutCollapseFormatter(data) {
        const list = document.createElement('ul');

        data.forEach((col) => {
          const item = document.createElement('li');

          if (col.title === 'Comment' && !col.value) {
            return;
          } // Skip empty comments
          item.innerHTML = `<strong>${col.title}</strong> ${col.value}`;
          list.appendChild(item);
        });

        return Object.keys(data).length ? list : '';
      }
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

    function generateDownloadLink(rowData, type) {
      const boardInfo = rowData['Board Information'];
      // Construct each part of the filename
      const manufacturer = boardInfo.Manufacturer.trim().toLowerCase()
        .replace(/\s+/g, '_');
      const name = boardInfo.Name.trim().toLowerCase()
        .replace(/\s+/g, '_');
      const revision = boardInfo.Revision.trim().toLowerCase()
        .replace(/\s+/g, '_');
      const role = boardInfo.Role.trim().toLowerCase()
        .replace(/\s+/g, '_');
      const settingsType = type.replace(' ', '_').toLowerCase();
      // Join the parts with underscores
      const filename = `${manufacturer}_${name}_${revision}_${role}_${settingsType}.oldconfig`;
      // Get the full path for the file URL
      const currentUrl = window.location.href;
      const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
      const fileUrl = `${baseUrl}/oldconfig/${filename}`;
      // Generate download and copy links
      const downloadLink = `<a href="${fileUrl}" download="${filename}" title="Download Setting"><i class="fa fa-download" aria-hidden="true"></i></a>`;
      const copyLink = `<a href="#" data-clipboard-text="${fileUrl}" class="copy-link" title="Copy link to clipboard"><i class="fa fa-copy" aria-hidden="true"></i></a>`;


      return `${downloadLink} / ${copyLink}`;
    }

    function flashingMethodFormatter(cell, formatterParams, onRendered) {
      const value = cell.getValue();

      if (Array.isArray(value)) {
        const firstElement = `<span style="color: green; font-weight: bold;">${value[0]}</span>`;
        const restElements = value.slice(1).join(', ');
        // Check if there are more than one elements in the array

        if (value.length > 1) {
          return `${firstElement}, ${restElements}`;
        } else {
          return firstElement;
        }
      } else {
        return value;
      }
    }

    function commentFormatter(cell, formatterParams, onRendered) {
      const value = cell.getValue();

      if (!value) {
        return ''; // Don't show anything if no comment is available
      }
      if (value.includes('\n')) {
        const listItems = value.split('\n').map((line) => `<li>${line}</li>`)
          .join('');


        return `<ul>${listItems}</ul>`;
      } else {
        return value;
      }
    }

    // Initialize ClipboardJS
    new ClipboardJS('.copy-link').on('success', (e) => {
      const originalTitle = e.trigger.title;

      e.trigger.title = 'Copied!';
      e.trigger.querySelector('i').style.color = 'green';
      setTimeout(() => {
        e.trigger.title = originalTitle;
        e.trigger.querySelector('i').style.color = '';
      }, 2000);
    });
  });
});
