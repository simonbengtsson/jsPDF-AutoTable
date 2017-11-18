import {Row, Cell, Column, Table} from './models';
import {getTheme, defaultConfig, defaultStyles} from './config';
import {parseHtml} from "./htmlParser";
import {assign} from './polyfills';
import {getStringWidth, ellipsize, applyUserStyles, marginOrPadding, styles} from './common';
import state, {getGlobalOptions, getDocumentOptions} from './state';
import validateInput from './inputValidator';

/**
 * Create models from the user input
 */
export function parseInput(args) {
    let tableOptions = parseUserArguments(args);
    let globalOptions = getGlobalOptions();
    let documentOptions = getDocumentOptions();
    let allOptions = [globalOptions, documentOptions, tableOptions];
    validateInput(allOptions);
    
    let table = new Table();
    state().table = table;
    table.id = tableOptions.tableId;

    // Move to state?
    table.userStyles = {
        textColor: 30, // Setting text color to dark gray as it can't be obtained from jsPDF
        fontSize: state().doc.internal.getFontSize(),
        fontStyle: state().doc.internal.getFont().fontStyle
    };

    // Merge styles one level deeper
    for (let styleProp of Object.keys(table.styles)) {
        let styles = allOptions.map(opts => (opts[styleProp] || {}));
        table.styles[styleProp] = assign({}, ...styles);
    }

    // Append hooks
    for (let opts of allOptions) {
        for (let hookName of Object.keys(table.cellHooks)) {
            if (opts && typeof opts[hookName] === 'function') {
                table.cellHooks[hookName].push(opts[hookName]);
                delete opts[hookName]
            }
        }
    }
    
    table.settings = assign({}, defaultConfig(), ...allOptions);
    table.settings.margin = marginOrPadding(table.settings.margin, defaultConfig().margin);

    if (table.settings.theme === 'auto') {
        table.settings.theme = table.settings.useCss ? 'plain' : 'striped';
    }

    let htmlContent: any = {};
    if (table.settings.html) {
        htmlContent = parseHtml(table.settings.html, table.settings.includeHiddenHTML, table.settings.useCss) || {};
    }
    table.settings.head = htmlContent.head || table.settings.head || [];
    table.settings.body = htmlContent.body || table.settings.body || [];
    table.settings.foot = htmlContent.foot || table.settings.foot || [];

    parseContent(table);

    table.minWidth = table.columns.reduce((total, col) => (total + col.minWidth), 0);
    table.wrappedWidth = table.columns.reduce((total, col) => (total + col.wrappedWidth), 0);

    if (typeof table.settings.tableWidth === 'number') {
        table.width = table.settings.tableWidth;
    } else if (table.settings.tableWidth === 'wrap') {
        table.width = table.wrappedWidth;
    } else {
        table.width = state().pageWidth() - table.margin('left') - table.margin('right');
    }
    
    return table;
}

function parseUserArguments(args) {
    // Initialization on format doc.autoTable(100, options) where 100 is startY 
    if (args.length === 2 && typeof args[0] === 'number') {
        let opts = args[1];
        opts.startY = args[0];
        return opts;
    }

    if (args.length === 1) {
        // Normal initialization on format doc.autoTable(options)
        return args[0];
    }

    // Deprecated initialization on format doc.autoTable(columns, body, [options])
    if (args.length > 1 && args[0] && args[1]) {
        //throw 'TODO Fix deprecated initialization';
        let opts = args[2] || {};
        opts.columns = args[0];
        opts.body = args[1];
        return opts;
    }

    throw 'Unsupported autoTable parameters'
}

function parseContent(table) {
    let settings = table.settings;
    
    table.columns = getTableColumns(settings);
    
    for (let sectionName of ['head', 'body', 'foot']) {
        let rowSpansLeftForColumn = {};
        let mergedSpansForColumn = {};
        settings[sectionName].forEach((rawRow, rowIndex) => {
            let row = new Row(rawRow, rowIndex, sectionName);
            table[sectionName].push(row);

            let colSpansAdded = 0;
            let columnSpansLeft = 0;
            for (let column of table.columns) {
                if (rowSpansLeftForColumn[column.dataKey] == null || rowSpansLeftForColumn[column.dataKey].left === 0) {
                    if (columnSpansLeft === 0) {
                        let rawCell;
                        if (Array.isArray(rawRow)) {
                            rawCell = rawRow[column.dataKey - colSpansAdded];
                        } else {
                            rawCell = rawRow[column.dataKey];
                        }

                        let styles = cellStyles(sectionName, column.dataKey, rowIndex);
                        let cell = new Cell(rawCell, styles, sectionName);
                        row.cells[column.dataKey] = cell;

                        table.callCellHooks(table.cellHooks.didParseCell, cell, row, column);

                        columnSpansLeft = cell.colSpan - 1;
                        rowSpansLeftForColumn[column.dataKey] = {left: cell.rowSpan - 1, times: columnSpansLeft};
                    } else {
                        columnSpansLeft--;
                        colSpansAdded++;
                    }   
                } else {
                    rowSpansLeftForColumn[column.dataKey].left--;
                    columnSpansLeft = rowSpansLeftForColumn[column.dataKey].times;
                }
            }
        });
    }

    table.allRows().forEach(row => {
        for (let column of table.columns) {
            let cell = row.cells[column.dataKey];
            
            // Kind of make sense to not consider width of cells with colspan columns
            // Consider this in a future release however
            if (cell && cell.colSpan === 1) {
                if (cell.wrappedWidth > column.wrappedWidth) {
                    column.wrappedWidth = cell.wrappedWidth;
                }
                if (cell.minWidth > column.minWidth) {
                    column.minWidth = cell.minWidth;
                }
            }
        }
    });
}

function getTableColumns(settings) {
    let dataKeys;
    if (settings.columns) {
        dataKeys = settings.columns.map((input, index) => (input.dataKey || input.key || index));
    } else {
        let merged = assign({}, settings.head[0] || {}, settings.body[0] || {}, settings.foot[0] || {});
        dataKeys = Object.keys(merged);
    }
    return dataKeys.map(key => new Column(key));
}

function cellStyles(sectionName, dataKey, rowIndex) {
    let table = state().table;
    let theme = getTheme(table.settings.theme);
    let otherStyles = [theme.table, theme[sectionName], table.styles.styles, table.styles[`${sectionName}Styles`]];
    let colStyles = sectionName === 'body' ? table.styles.columnStyles[dataKey] || {} : {};
    let rowStyles = sectionName === 'body' && rowIndex % 2 === 0 ? assign({}, theme.alternateRow, table.styles.alternateRowStyles) : {};
    return assign(defaultStyles(), ...[...otherStyles, rowStyles, colStyles]);
}