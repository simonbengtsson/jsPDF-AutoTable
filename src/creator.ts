import {Row, Cell, Column} from './models';
import {Config, getTheme} from './config';

declare function require(path: string): any;
var assign = require('object-assign');

export function validateInput(headers, data, options) {
    if (!headers || typeof headers !== 'object') {
        console.error("The headers should be an object or array, is: " + typeof headers);
    }

    if (!data || typeof data !== 'object') {
        console.error("The data should be an object or array, is: " + typeof data);
    }

    if (!!options && typeof options !== 'object') {
        console.error("The data should be an object or array, is: " + typeof data);
    }

    if (!Array.prototype.forEach) {
        console.error("The current browser does not support Array.prototype.forEach which is required for " +
            "jsPDF-AutoTable. You can try to polyfill it by including this script " +
            "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Polyfill");
    }
}

/**
 * Create models from the user input
 *
 * @param inputHeaders
 * @param inputData
 */
export function createModels(inputHeaders, inputData) {
    let splitRegex = /\r\n|\r|\n/g;
    let table = Config.tableInstance();
    let settings = table.settings;
    let theme = getTheme(settings.theme);

    // Header row and columns
    let headerRow = new Row(inputHeaders, -1);
    headerRow.index = -1;

    // Columns and header row
    inputHeaders.forEach(function (rawColumn, index) {
        let dataKey = index;
        if (typeof rawColumn.dataKey !== 'undefined') {
            dataKey = rawColumn.dataKey;
        } else if (typeof rawColumn.key !== 'undefined') {
            console.error("Deprecation warning: Use dataKey instead of key");
            dataKey = rawColumn.key; // deprecated since 2.x
        }

        let col = new Column(dataKey, index);
        col.widthStyle = Config.styles([theme.table, theme.header, settings.styles, settings.columnStyles[col.dataKey] || {}]).columnWidth;
        table.columns.push(col);

        let cell = new Cell(rawColumn);
        cell.styles = Config.styles([theme.table, theme.header, settings.styles, settings.headerStyles]);

        if (cell.raw instanceof HTMLElement) {
            cell.text = (cell.raw.innerText || '').trim();
        } else {
            let text = typeof cell.raw === 'object' ? cell.raw.title : cell.raw;
            // Stringify 0 and false, but not undefined
            cell.text = typeof cell.raw !== 'undefined' ? '' + text : '';
        }
        cell.text = cell.text.split(splitRegex);

        headerRow.cells[dataKey] = cell;
        settings.createdHeaderCell(cell, {column: col, row: headerRow, settings: settings});
    });
    table.headerRow = headerRow;

    // Rows och cells
    inputData.forEach(function (rawRow, i) {
        let row = new Row(rawRow, i);
        let rowStyles = i % 2 === 0 ? assign({}, theme.alternateRow, settings.alternateRowStyles) : {};
        table.columns.forEach(function (column) {
            let cell = new Cell(rawRow[column.dataKey]);
            let colStyles = settings.columnStyles[column.dataKey] || {};
            cell.styles = Config.styles([theme.table, theme.body, settings.styles, settings.bodyStyles, rowStyles, colStyles]);

            if (cell.raw && cell.raw instanceof HTMLElement) {
                cell.text = (cell.raw.innerText || '').trim();
            } else {
                // Stringify 0 and false, but not undefined
                cell.text = typeof cell.raw !== 'undefined' ? '' + cell.raw : '';
            }
            cell.text = cell.text.split(splitRegex);

            row.cells[column.dataKey] = cell;
            settings.createdCell(cell, Config.hooksData({column: column, row: row}));
        });
        table.rows.push(row);
    });
}