import {Row, Cell, Column} from './models';
import {Config, getTheme} from './config';

declare function require(path: string): any;
var assign = require('object-assign');

export function validateInput(headers, data, allOptions) {
    if (!headers || typeof headers !== 'object') {
        console.error("The headers should be an object or array, is: " + typeof headers);
    }

    if (!data || typeof data !== 'object') {
        console.error("The data should be an object or array, is: " + typeof data);
    }
    
    for (let settings of allOptions) {
        if (settings && typeof settings !== 'object') {
            console.error("The options parameter should be of type object, is: " + typeof settings);
        }
        if (typeof settings.extendWidth !== 'undefined') {
            settings.tableWidth = settings.extendWidth ? 'auto' : 'wrap';
            console.error("Use of deprecated option: extendWidth, use tableWidth instead.");
        }
        if (typeof settings.margins !== 'undefined') {
            if (typeof settings.margin === 'undefined') settings.margin = settings.margins;
            console.error("Use of deprecated option: margins, use margin instead.");
        }
        if (typeof settings.afterPageContent !== 'undefined' || typeof settings.beforePageContent !== 'undefined' || typeof settings.afterPageAdd !== 'undefined') {
            console.error("The afterPageContent, beforePageContent and afterPageAdd hooks are deprecated. Use addPageContent instead");
            if (typeof settings.addPageContent === 'undefined') {
                settings.addPageContent = function(data) {
                    Config.applyUserStyles();
                    if (settings.beforePageContent) settings.beforePageContent(data);
                    Config.applyUserStyles();
                    if (settings.afterPageContent) settings.afterPageContent(data);
                    Config.applyUserStyles();

                    if (settings.afterPageAdd && data.pageCount > 1) {
                        data.afterPageAdd(data);
                    }
                    Config.applyUserStyles();
                }
            }
        }

        [['padding', 'cellPadding'], ['lineHeight', 'rowHeight'], 'fontSize', 'overflow'].forEach(function (o) {
            let deprecatedOption = typeof o === 'string' ? o : o[0];
            let style = typeof o === 'string' ? o : o[1];
            if (typeof settings[deprecatedOption] !== 'undefined') {
                if (typeof settings.styles[style] === 'undefined') {
                    settings.styles[style] = settings[deprecatedOption];
                }
                console.error("Use of deprecated option: " + deprecatedOption + ", use the style " + style + " instead.");
            }
        });
        
        for (let styleProp of ['styles', 'bodyStyles', 'headerStyles', 'columnStyles']) {
            if (settings[styleProp] && typeof settings[styleProp] !== 'object') {
                console.error("The " + styleProp + " style should be of type object, is: " + typeof settings[styleProp]);
            } else if (settings[styleProp] && settings[styleProp].rowHeight) {
                console.error("Use of deprecated style: rowHeight, use vertical cell padding instead");
            }
        }
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
        col.raw = rawColumn;
        col.widthStyle = Config.styles([theme.table, theme.header, table.styles.styles, table.styles.columnStyles[col.dataKey] || {}]).columnWidth;
        table.columns.push(col);

        let cell = new Cell(rawColumn);
        cell.styles = Config.styles([theme.table, theme.header, table.styles.styles, table.styles.headerStyles]);

        if (cell.raw instanceof HTMLElement) {
            cell.text = (cell.raw.innerText || '').trim();
        } else {
            let text = typeof cell.raw === 'object' ? cell.raw.title : cell.raw;
            // Stringify 0 and false, but not undefined
            cell.text = typeof cell.raw !== 'undefined' ? '' + text : '';
        }
        cell.text = cell.text.split(splitRegex);

        headerRow.cells[dataKey] = cell;
        for (let hook of table.hooks.createdHeaderCell) {
            hook(cell, {cell: cell, column: col, row: headerRow, settings: settings});
        }
    });
    table.headerRow = headerRow;

    // Rows och cells
    inputData.forEach(function (rawRow, i) {
        let row = new Row(rawRow, i);
        let rowStyles = i % 2 === 0 ? assign({}, theme.alternateRow, table.styles.alternateRowStyles) : {};
        table.columns.forEach(function (column) {
            let cell = new Cell(rawRow[column.dataKey]);
            let colStyles = table.styles.columnStyles[column.dataKey] || {};
            cell.styles = Config.styles([theme.table, theme.body, table.styles.styles, table.styles.bodyStyles, rowStyles, colStyles]);

            if (cell.raw && cell.raw instanceof HTMLElement) {
                cell.text = (cell.raw.innerText || '').trim();
            } else {
                // Stringify 0 and false, but not undefined
                cell.text = typeof cell.raw !== 'undefined' ? '' + cell.raw : '';
            }
            cell.text = cell.text.split(splitRegex);

            row.cells[column.dataKey] = cell;
            
            for (let hook of table.hooks.createdCell) {
                hook(cell, Config.hooksData({cell: cell, column: column, row: row}));
            }
        });
        table.rows.push(row);
    });
}