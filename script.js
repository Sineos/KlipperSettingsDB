document.addEventListener('DOMContentLoaded', function () {
    const fetchJSONData = async () => {
        const response = await fetch('master.json');
        const data = await response.json();

        // Combine interface values with pin values
        data.forEach(entry => {
            entry["Common Settings"]["Communication interface USB"] = `${entry["Common Settings"]["Communication interface USB"]} on ${entry["Common Settings"]["Communication interface USB Pins"].join(', ')}`;
            entry["Common Settings"]["Communication interface USART"] = `${entry["Common Settings"]["Communication interface USART"]} on ${entry["Common Settings"]["Communication interface USART Pins"].join(', ')}`;
            entry["Common Settings"]["Communication interface CAN"] = entry["Common Settings"]["Communication interface CAN"]
                ? `${entry["Common Settings"]["Communication interface CAN"]} on ${entry["Common Settings"]["Communication interface CAN Pins"].join(', ')}`
                : false;
        });

        return data;
    };

    const downloadIcon = function (cell, formatterParams, onRendered) {
        return "<i class='fa fa-download'></i>";
    };

    const downloadRowData = function (e, cell) {
        const rowData = cell.getRow().getData();
        let dataStr = '';

        Object.keys(rowData).forEach(section => {
            dataStr += `${section}:\n`;
            Object.keys(rowData[section]).forEach(key => {
                dataStr += `  ${key}: ${rowData[section][key]}\n`;
            });
            dataStr += '\n';
        });

        const blob = new Blob([dataStr], { type: 'text/plain' });
        const boardName = rowData["Board Information"]["Board Name"];
        const boardRevision = rowData["Board Information"]["Board Revision"];
        const processor = rowData["Common Settings"]["Processor model"];
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

    const createTable = async () => {
        const data = await fetchJSONData();

        const columns = [
            { title: "Board Manufacturer", field: "Board Information.Board Manufacturer", headerVertical: "flip", headerFilter: "input", cssClass: "board-information" },
            { title: "Board Name", field: "Board Information.Board Name", headerVertical: "flip", headerFilter: "input", cssClass: "board-information" },
            { title: "Board Revision", field: "Board Information.Board Revision", headerVertical: "flip", headerFilter: "input", cssClass: "board-information" },
            { title: "USB2CAN Enabled", field: "Board Information.USB2CAN Enabled", headerVertical: "flip", headerFilter: "input", formatter: "tickCross", cssClass: "board-information" },
            { title: "Klipper Flashing Method", field: "Board Information.Klipper Flashing Method", headerVertical: "flip", headerFilter: "input", cssClass: "board-information" },
            { title: "Katapult Flashing Method", field: "Board Information.Katapult Flashing Method", headerVertical: "flip", headerFilter: "input", cssClass: "board-information" },
            { title: "Micro-controller Architecture", field: "Common Settings.Micro-controller Architecture", headerVertical: "flip", headerFilter: "input", cssClass: "common-settings" },
            { title: "Processor model", field: "Common Settings.Processor model", headerVertical: "flip", headerFilter: "input", cssClass: "common-settings" },
            { title: "Communication interface USB", field: "Common Settings.Communication interface USB", headerVertical: "flip", headerFilter: "input", cssClass: "common-settings" },
            { title: "Communication interface USART", field: "Common Settings.Communication interface USART", headerVertical: "flip", headerFilter: "input", cssClass: "common-settings" },
            { title: "Communication interface CAN", field: "Common Settings.Communication interface CAN", headerVertical: "flip", headerFilter: "input", formatter: "tickCross", cssClass: "common-settings" },
            { title: "Baud rate for serial port", field: "Common Settings.Baud rate for serial port", headerVertical: "flip", headerFilter: "input", cssClass: "common-settings" },
            { title: "CAN bus speed", field: "Common Settings.CAN bus speed", headerVertical: "flip", headerFilter: "input", cssClass: "common-settings" },
            { title: "Bootloader offset", field: "Klipper Settings.Bootloader offset", headerVertical: "flip", headerFilter: "input", cssClass: "klipper-settings" },
            { title: "Clock Reference", field: "Klipper Settings.Clock Reference", headerVertical: "flip", headerFilter: "input", cssClass: "klipper-settings" },
            { title: "CAN Pins USB2CAN", field: "Klipper Settings.CAN Pins USB2CAN", headerVertical: "flip", headerFilter: "input", cssClass: "klipper-settings" },
            { title: "GPIO pins to set at micro-controller startup", field: "Klipper Settings.GPIO pins to set at micro-controller startup", headerVertical: "flip", headerFilter: "input", formatter: "tickCross", cssClass: "klipper-settings" },
            { title: "Build Katapult deployment application", field: "Katapult Settings.Build Katapult deployment application", headerVertical: "flip", headerFilter: "input", formatter: "tickCross", cssClass: "katapult-settings" },
            { title: "Application start offset", field: "Katapult Settings.Application start offset", headerVertical: "flip", headerFilter: "input", cssClass: "katapult-settings" },
            { title: "GPIO pins to set on bootloader entry", field: "Katapult Settings.GPIO pins to set on bootloader entry", headerVertical: "flip", headerFilter: "input", cssClass: "katapult-settings" },
            { title: "Support bootloader entry on rapid double click of reset button", field: "Katapult Settings.Support bootloader entry on rapid double click of reset button", headerVertical: "flip", headerFilter: "input", formatter: "tickCross", cssClass: "katapult-settings" },
            { title: "Enable Status LED", field: "Katapult Settings.Enable Status LED", headerVertical: "flip", headerFilter: "input", cssClass: "katapult-settings" },
            { title: "Download", formatter: downloadIcon, width: 40, hozAlign: "center", cellClick: downloadRowData, headerSort: false, cssClass: "download-button" }
        ];

        new Tabulator("#table", {
            data: data,
            columns: columns,
            layout: "fitDataFill",
            initialSort: [
                { column: "Board Information.Board Manufacturer", dir: "asc" },
                { column: "Board Information.Board Name", dir: "asc" },
                { column: "Common Settings.Processor model", dir: "asc" }
            ],
            columnHeaderVertAlign: "bottom"
        });
    };

    createTable();
});
