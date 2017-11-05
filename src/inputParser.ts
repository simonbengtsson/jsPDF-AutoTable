import {Row, Cell, Column, Table} from './models';
import {getTheme, defaultConfig} from './config';
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

    table.id = tableOptions.tableId;
    table.doc = state().doc;
    table.scaleFactor = state().doc.internal.scaleFactor;

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
            if (opts && opts[hookName]) {
                table.cellHooks[hookName].push(opts[hookName]);
                delete opts[hookName];
            }
        }
    }
    
    table.settings = assign({}, defaultConfig(), ...allOptions);

    if (table.settings.theme === 'auto') {
        table.settings.theme = table.settings.useCss ? 'plain' : 'striped';
    }
    
    let settings = table.settings;
    state().table = table;
    
    let theme = getTheme(settings.theme);
    
    let htmlContent = {};
    if (table.settings.html) {
        htmlContent = parseHtml(settings.html, settings.includeHiddenHTML, settings.useCss) || {};
    }
    let columnMap = {};
    let spanColumns = {};
    for (let sectionName of ['head', 'body', 'foot']) {
        let section = table.settings[sectionName] || htmlContent[sectionName] || [];
        let rowColumns: Column[] = [];
        for (let rowIndex = 0; rowIndex < section.length; rowIndex++) {
            let rawRow = section[rowIndex];
            let row = new Row(rawRow, rowIndex, sectionName);
            let rowStyles = sectionName === 'body' && rowIndex % 2 === 0 ? assign({}, theme.alternateRow, table.styles.alternateRowStyles) : {};

            let keys = Object.keys(rawRow);
            let columnIndex = 0;
            for (let i = 0; i < keys.length; i++) {
                let rawCell = rawRow[keys[i]];
                let dataKey = rawCell.dataKey || rawCell.key || (Array.isArray(rawRow) ? columnIndex : keys[i]);

                let colStyles = sectionName === 'body' ? table.styles.columnStyles[dataKey] || {} : {};
                let column = columnMap[dataKey];
                if (!column) {
                    if (spanColumns[columnIndex]) {
                        column = spanColumns[columnIndex];
                        column.dataKey = dataKey;
                    } else {
                        column = new Column(dataKey); 
                    }
                }
                rowColumns.push(column);

                let cellStyles = {
                    head: [theme.table, theme.foot, table.styles.styles, table.styles.headStyles],
                    body: [theme.table, theme.body, table.styles.styles, table.styles.bodyStyles],
                    foot: [theme.table, theme.foot, table.styles.styles, table.styles.footStyles]
                };
                let style = styles(cellStyles[sectionName].concat([rowStyles, colStyles]));
                let cell = new Cell(rawCell, style, sectionName);

                if (Array.isArray(rawRow)) {
                    for (var j = 0; j < cell.colSpan - 1; j++) {
                        columnIndex++;
                        let column = new Column(columnIndex);
                        spanColumns[columnIndex] = column;
                        rowColumns.push(column);
                    }
                }

                if (table.callCellHooks(table.cellHooks.willParseCell, cell, row, column) !== false) {
                    row.cells[dataKey] = cell;
                    cell.contentWidth = cell.padding('horizontal') + getStringWidth(cell.text, cell.styles);
                    if (typeof cell.styles.cellWidth === 'number') {
                        cell.minWidth = cell.styles.cellWidth;
                        cell.wrappedWidth = cell.styles.cellWidth;
                    } else if (cell.styles.cellWidth === 'wrap') {
                        cell.minWidth = cell.contentWidth;
                        cell.wrappedWidth = cell.contentWidth;
                    } else { // auto
                        cell.minWidth = 10 / state().scaleFactor;
                        cell.wrappedWidth = cell.contentWidth;
                    }
                    
                    if (cell.wrappedWidth > column.wrappedWidth) {
                        column.wrappedWidth = cell.wrappedWidth;
                    }
                    if (cell.minWidth > column.minWidth) {
                        column.minWidth = cell.minWidth;
                    }
                }
                
                columnIndex++;
            }
            
            //if (keys.length > 0 && table.emitEvent(new HookData('parsingRow', table, row)) !== false) {
            table[sectionName].push(row);
            for (let i = 0; i < rowColumns.length; i++) {
                let column = rowColumns[i];
                if (!columnMap[column.dataKey]) {
                    table.columns.splice(i, 0, column);
                    columnMap[column.dataKey] = column;
                }
            }
            //}
        }
    }
    
    for (let column of table.columns) {
        table.minWidth += column.minWidth;
        table.wrappedWidth += column.wrappedWidth;
    }

    if (typeof table.settings.tableWidth === 'number') {
        table.width = table.settings.tableWidth;
    } else if (table.settings.tableWidth === 'wrap') {
        table.width = table.wrappedWidth;
    } else {
        table.width = state().pageWidth() - table.margin('left') - table.margin('right');
    }
    
    table.settings.margin = marginOrPadding(table.settings.margin, defaultConfig().margin);
    
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