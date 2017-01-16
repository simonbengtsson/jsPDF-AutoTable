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
        if (settings.head && typeof settings.head !== 'object') {
            console.error("The headers should be an object or array, is: " + typeof settings.head);
        } else if (settings.body && typeof settings.body !== 'object') {
            console.error("The data should be an object or array, is: " + typeof settings.body);
        }
        
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
    
    let head: any[] = table.settings.head;
    let body = table.settings.body;
    if (table.settings.fromHtml) {
        let c = parseHtml(table.settings.fromHtml, table.settings.includeHiddenHtml, table.settings.useCssStyles);
        if (!head) head = c.head[0] || [];
        if (!body) body = c.body || [];
    }
    
    let settings = table.settings;
    let theme = getTheme(settings.theme);

    // Header row and columns
    let headerRow = new Row(table.settings.head, 0, 'head');
    headerRow.index = -1;

    // Columns and header row
    for (let index = 0; index < head.length; index++) {
        let rawCell = head[index];
        let dataKey = index;
        if (typeof rawCell.dataKey !== 'undefined') {
            dataKey = rawCell.dataKey;
        } else if (typeof rawCell.key !== 'undefined' && window.console) {
            console.error("Deprecation warning: Use dataKey instead of key");
            dataKey = rawCell.key; // deprecated since 2.x
        }

        let col = new Column(dataKey, index);
        col.widthStyle = Config.styles([theme.table, theme.header, table.styles.styles, table.styles.columnStyles[col.dataKey] || {}]).columnWidth;
        table.columns.push(col);

        let cellStyles = Config.styles([theme.table, theme.header, table.styles.styles, table.styles.headerStyles]);
        let cell = new Cell(rawCell, cellStyles, 'head');

        headerRow.cells[dataKey] = cell;
        
        table.emitEvent(new ATEvent('parsedCell', table, headerRow, col, cell));
    }
    table.headerRow = headerRow;

    // Rows och cells
    for (let i = 0; i < body.length; i++) {
        let rawRow = body[i];
        let row = new Row(rawRow, i, 'body');
        let rowStyles = i % 2 === 0 ? assign({}, theme.alternateRow, table.styles.alternateRowStyles) : {};
        table.columns.forEach(function (column) {
            let colStyles = table.styles.columnStyles[column.dataKey] || {};
            let cellStyles = Config.styles([theme.table, theme.body, table.styles.styles, table.styles.bodyStyles, rowStyles, colStyles]);
            let cell = new Cell(rawRow[column.dataKey], cellStyles, 'body');

            row.cells[column.dataKey] = cell;
            
            table.emitEvent(new ATEvent('parsedCell', table, row, column, cell));
        });
        table.rows.push(row);
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
            case 'parsedCell':
                if (event.section === 'head' && typeof opts.createdHeaderCell === 'function') {
                    opts.createdHeaderCell(event.cell, event);
                } else if (event.section === 'body' && typeof opts.createdCell === 'function') {
                    opts.createdCell(event.cell, event);
                }
                break;
            case 'parsedRow':
                if (event.section === 'head' && typeof opts.createdHeaderRow === 'function') {
                    opts.createdHeaderRow(event.cell, event);
                } else if (event.section === 'body' && typeof opts.createdRow === 'function') {
                    opts.createdRow(event.cell, event);
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