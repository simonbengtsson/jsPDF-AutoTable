import {Row, Cell, Column, ATEvent, Table} from './models';
import {Config, getTheme, getDefaults} from './config';
import {parseHtml} from "./htmlParser";

declare function require(path: string): any;
var assign = require('object-assign');
var entries = require('object.entries');

export function validateInput(allOptions) {
    if (typeof console === 'undefined') {
        var console = {error: function(msg) {}, log: function(msg) {}}
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
                console.error("Use of deprecated style rowHeight. It is renamed to minCellHeight.");
                settings[styleProp].minCellHeight = settings[styleProp].rowHeight;
            }
        }
    }
}

/**
 * Create models from the user input
 */
export function parseInput(doc, allOptions) {
    let table = Config.createTable(doc);
    parseSettings(table, allOptions);
    
    let settings = table.settings;
    let theme = getTheme(settings.theme);

    let cellStyles = {
        head: [theme.table, theme.header, table.styles.styles, table.styles.headerStyles],
        body: [theme.table, theme.body, table.styles.styles, table.styles.bodyStyles],
        foot: []
    };
    
    var htmlContent = table.settings.fromHtml ? parseHtml(settings.fromHtml, settings.includeHiddenHtml, settings.useCssStyles) : {};
    let columnMap = {};
    for (let sectionName of ['head', 'body', 'foot']) {
        let section = table.settings[sectionName] || htmlContent[sectionName] || [[]];
        let rowColumns = [];
        for (let rowIndex = 0; rowIndex < section.length; rowIndex++) {
            let rawRow = section[rowIndex];
            let row = new Row(rawRow, rowIndex, sectionName);
            let rowStyles = sectionName === 'body' && rowIndex % 2 === 0 ? assign({}, theme.alternateRow, table.styles.alternateRowStyles) : {};

            let keys = Object.keys(rawRow);
            for (let i = 0; i < keys.length; i++) {
                let rawCell = rawRow[keys[i]];
                let dataKey = rawCell.dataKey || rawCell.key || (Array.isArray(rawRow) ? i : keys[i]);

                let colStyles = sectionName === 'body' ? table.styles.columnStyles[dataKey] || {} : {};
                let column = columnMap[dataKey];
                if (!column) {
                    column = new Column(dataKey, colStyles.columnWidth || 'auto');
                }
                rowColumns.push(column);

                let style = Config.styles(cellStyles[sectionName].concat([rowStyles, colStyles]));
                let cell = new Cell(rawCell, style, sectionName);

                if (table.emitEvent(new ATEvent('parsingCell', table, row, column, cell)) !== false) {
                    row.cells[dataKey] = cell;
                }
            }
            if (table.emitEvent(new ATEvent('parsingCell', table, row)) !== false) {
                table[sectionName].push(row);
                for (let i = 0; i < rowColumns.length; i++) {
                    let column = rowColumns[i];
                    if (!columnMap[column.dataKey]) {
                        table.columns.splice(i, 0, column);
                        columnMap[column.dataKey] = column;
                    }
                }
            }
        }
    }
    
    table.settings.margin = Config.marginOrPadding(table.settings.margin, getDefaults().margin);
    
    return table;
}

function parseSettings(table: Table, allOptions) {    
    // Merge styles one level deeper
    for (let styleProp of Object.keys(table.styles)) {
        let styles = allOptions.map(function(opts) { return opts[styleProp] || {}});
        table.styles[styleProp] = assign({}, ...styles);
    }

    for (let opts of allOptions) {
        // Append event handlers instead of replacing them
        if (opts && opts.eventHandler) {
            table.eventHandlers.push(opts.eventHandler);
        }
        if (opts) {
            // Backwards compatibility
            table.eventHandlers.push(hookEventHandler(opts));
        }
    }

    // Merge all other options one level
    table.settings = assign(getDefaults(), ...allOptions);
    table.id = table.settings.tableId;
}

function hookEventHandler(opts) {
    return function(event) {
        switch(event.name) {
            case 'parsingCell':
                if (event.section === 'head' && typeof opts.createdHeaderCell === 'function') {
                    return opts.createdHeaderCell(event.cell, event);
                } else if (event.section === 'body' && typeof opts.createdCell === 'function') {
                    return opts.createdCell(event.cell, event);
                }
                break;
            case 'parsingRow':
                if (event.section === 'head' && typeof opts.createdHeaderRow === 'function') {
                    return opts.createdHeaderRow(event.cell, event);
                } else if (event.section === 'body' && typeof opts.createdRow === 'function') {
                    return opts.createdRow(event.cell, event);
                }
                break;
            case 'addingCell':
                if (event.section === 'head' && typeof opts.drawHeaderCell === 'function') {
                    return opts.drawHeaderRow(event.cell, event);
                } else if (event.section === 'body' && typeof opts.drawCell === 'function') {
                    return opts.drawCell(event.cell, event);
                }
                break;
            case 'addingRow':
                if (event.section === 'head' && typeof opts.drawHeaderRow === 'function') {
                    return opts.drawHeaderRow(event.row, event);
                } else if (event.section === 'body' && typeof opts.drawRow === 'function') {
                    return opts.drawRow(event.row, event);
                }
                break;
            case 'endedPage':
                if (typeof opts.addPageContent === 'function') {
                    opts.addPageContent(event);
                }
                break;
            default:
                break;
        }
    };
}