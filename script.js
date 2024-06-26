document.addEventListener('DOMContentLoaded', () => {
  const fetchJSONData = async() => {
    const response = await fetch('master.json');
    const data = await response.json();

    // Combine interface values with pin values
    data.forEach((entry) => {
      const commonSettings = entry['Common Settings'];

      // Handling interface values and their pins
      if (!commonSettings['Communication interface USB']) {
        commonSettings['Communication interface USB'] = false;
      } else {
        commonSettings['Communication interface USB'] = `${commonSettings['Communication interface USB']} on ${commonSettings['Communication interface USB Pins'].join(', ')}`;
      }

      if (!commonSettings['Communication interface USART']) {
        commonSettings['Communication interface USART'] = false;
      } else {
        commonSettings['Communication interface USART'] = `${commonSettings['Communication interface USART']} on ${commonSettings['Communication interface USART Pins'].join(', ')}`;
      }

      if (!commonSettings['Communication interface CAN']) {
        commonSettings['Communication interface CAN'] = false;
      } else {
        commonSettings['Communication interface CAN'] = `${commonSettings['Communication interface CAN']} on ${commonSettings['Communication interface CAN Pins'].join(', ')}`;
      }

      // Concatenate array values for all fields
      Object.keys(entry).forEach((section) => {
        Object.keys(entry[section]).forEach((key) => {
          if (Array.isArray(entry[section][key])) {
            entry[section][key] = entry[section][key].join(', ');
          }
        });
      });
    });

    return data;
  };

  const downloadIcon = function(cell, formatterParams, onRendered) {
    return '<i class=\'fa fa-download\'></i>';
  };

  const downloadRowData = function(e, cell) {
    const rowData = cell.getRow().getData();
    let dataStr = '';

    Object.keys(rowData).forEach((section) => {
      dataStr += `${section}:\n`;
      Object.keys(rowData[section]).forEach((key) => {
        dataStr += `  ${key}: ${rowData[section][key]}\n`;
      });
      dataStr += '\n';
    });

    const blob = new Blob([dataStr], { type: 'text/plain' });
    const boardName = rowData['Board Information']['Board Name'];
    const boardRevision = rowData['Board Information']['Board Revision'];
    const processor = rowData['Common Settings']['Processor model'];
    const fileName = `${boardName}_${boardRevision}_${processor}.txt`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const customFormatter = function(cell, formatterParams, onRendered) {
    const value = cell.getValue();

    if (value === true || value === false) {
      cell.getElement().style.textAlign = 'center';

      return value ? '✔' : '✘';
    }
    cell.getElement().style.textAlign = 'left';

    return value;
  };

  const linkFormatter = function(cell, formatterParams, onRendered) {
    const value = cell.getValue();
    const url = value ? value : '#';
    const label = value ? 'Link' : '';


    return `<a href="${url}" target="_blank">${label}</a>`;
  };

  const commentFormatter = function(cell, formatterParams, onRendered) {
    const value = cell.getValue();

    if (value && value.length > 100) {
      return value.substring(0, 100) + '...';
    }

    return value;
  };

  const createTable = async() => {
    const data = await fetchJSONData();

    const columns = [
      {
        title: 'Board Information',
        columns: [
          { title: 'Board Manufacturer', field: 'Board Information.Board Manufacturer', headerVertical: 'flip', headerFilter: 'input', cssClass: 'board-information', resizable: true },
          { title: 'Board Name', field: 'Board Information.Board Name', headerVertical: 'flip', headerFilter: 'input', cssClass: 'board-information', resizable: true },
          { title: 'Board Revision', field: 'Board Information.Board Revision', headerVertical: 'flip', headerFilter: 'input', cssClass: 'board-information', resizable: true },
          { title: 'USB2CAN Enabled', field: 'Board Information.USB2CAN Enabled', headerVertical: 'flip', headerFilter: 'input', formatter: customFormatter, cssClass: 'board-information', resizable: true },
          { title: 'Klipper Flashing Method', field: 'Board Information.Klipper Flashing Method', headerVertical: 'flip', headerFilter: 'input', cssClass: 'board-information', resizable: true },
          { title: 'Katapult Flashing Method', field: 'Board Information.Katapult Flashing Method', headerVertical: 'flip', headerFilter: 'input', cssClass: 'board-information', resizable: true }
        ]
      },
      {
        title: 'Common Settings',
        columns: [
          { title: 'Micro-controller Architecture', field: 'Common Settings.Micro-controller Architecture', headerVertical: 'flip', headerFilter: 'input', cssClass: 'common-settings', resizable: true },
          { title: 'Processor model', field: 'Common Settings.Processor model', headerVertical: 'flip', headerFilter: 'input', cssClass: 'common-settings', resizable: true },
          { title: 'Communication interface USB', field: 'Common Settings.Communication interface USB', headerVertical: 'flip', headerFilter: 'input', cssClass: 'common-settings', formatter: customFormatter, resizable: true },
          { title: 'Communication interface USART', field: 'Common Settings.Communication interface USART', headerVertical: 'flip', headerFilter: 'input', cssClass: 'common-settings', formatter: customFormatter, resizable: true },
          { title: 'Communication interface CAN', field: 'Common Settings.Communication interface CAN', headerVertical: 'flip', headerFilter: 'input', formatter: customFormatter, cssClass: 'common-settings', resizable: true },
          { title: 'Baud rate for serial port', field: 'Common Settings.Baud rate for serial port', headerVertical: 'flip', headerFilter: 'input', cssClass: 'common-settings', resizable: true },
          { title: 'CAN bus speed', field: 'Common Settings.CAN bus speed', headerVertical: 'flip', headerFilter: 'input', cssClass: 'common-settings', resizable: true }
        ]
      },
      {
        title: 'Klipper Settings',
        columns: [
          { title: 'Bootloader offset', field: 'Klipper Settings.Bootloader offset', headerVertical: 'flip', headerFilter: 'input', cssClass: 'klipper-settings', resizable: true },
          { title: 'Clock Reference', field: 'Klipper Settings.Clock Reference', headerVertical: 'flip', headerFilter: 'input', cssClass: 'klipper-settings', resizable: true },
          { title: 'CAN Pins USB2CAN', field: 'Klipper Settings.CAN Pins USB2CAN', headerVertical: 'flip', headerFilter: 'input', formatter: customFormatter, cssClass: 'klipper-settings', resizable: true },
          { title: 'GPIO pins to set at micro-<br>controller startup', field: 'Klipper Settings.GPIO pins to set at micro-controller startup', headerVertical: 'flip', headerFilter: 'input', formatter: customFormatter, cssClass: 'klipper-settings', resizable: true }
        ]
      },
      {
        title: 'Katapult Settings',
        columns: [
          { title: 'Build Katapult deployment <br>application', field: 'Katapult Settings.Build Katapult deployment application', headerVertical: 'flip', headerFilter: 'input', formatter: customFormatter, cssClass: 'katapult-settings', resizable: true },
          { title: 'Application start offset', field: 'Katapult Settings.Application start offset', headerVertical: 'flip', headerFilter: 'input', formatter: customFormatter, cssClass: 'katapult-settings', resizable: true },
          { title: 'GPIO pins to set on <br>bootloader entry', field: 'Katapult Settings.GPIO pins to set on bootloader entry', headerVertical: 'flip', headerFilter: 'input', formatter: customFormatter, cssClass: 'katapult-settings', resizable: true },
          { title: 'Support bootloader entry on <br>rapid double click of reset button', field: 'Katapult Settings.Support bootloader entry on rapid double click of reset button', headerVertical: 'flip', headerFilter: 'input', formatter: customFormatter, cssClass: 'katapult-settings', resizable: true },
          { title: 'Enable Status LED', field: 'Katapult Settings.Enable Status LED', headerVertical: 'flip', headerFilter: 'input', formatter: customFormatter, cssClass: 'katapult-settings', resizable: true }
        ]
      },
      {
        title: 'Miscellaneous',
        columns: [
          { title: 'Download', formatter: downloadIcon, headerVertical: 'flip', hozAlign: 'center', cellClick: downloadRowData, cssClass: 'misc-settings', resizable: true },
          { title: 'Board Link 1', field: 'Miscellaneous.Board Link 1', headerVertical: 'flip', formatter: linkFormatter, cssClass: 'misc-settings', resizable: true },
          { title: 'Board Link 2', field: 'Miscellaneous.Board Link 2', headerVertical: 'flip', formatter: linkFormatter, cssClass: 'misc-settings', resizable: true },
          {
            title: 'Comment',
            field: 'Miscellaneous.Comment',
            maxWidth: 100,
            headerVertical: 'flip',
            cssClass: 'misc-settings',
            // formatter: commentFormatter,
            tooltip(e, cell, onRendered) {
              const el = document.createElement('div');

              el.style.fontSize = '1.2em';
              el.style.padding = '10px';
              el.style.border = '1px solid #ccc';
              el.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';
              el.style.whiteSpace = 'pre-wrap';
              el.innerText = cell.getValue();

              return el;
            }
          }
        ]
      }
    ];

    new Tabulator('#table', {
      data,
      layout: 'fitDataTable',
      columns,
      resizableColumns: true,
      initialSort: [
        { column: 'Board Information.Board Manufacturer', dir: 'asc' },
        { column: 'Board Information.Board Name', dir: 'asc' },
        { column: 'Common Settings.Processor model', dir: 'asc' }
      ],
      columnHeaderVertAlign: 'bottom',
      headerVertical: 'flip',
      groupBy: 'Board Information.Board Manufacturer',
      groupHeader(value, count, data, group) {
        return `${value} <span style="color:#d00">(${count} items)</span>`;
      }
    });
  };

  createTable();
});
