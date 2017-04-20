import {Row, Cell, Column, Table} from './models';
import {Config, getTheme, getDefaults} from './config';
import {parseHtml} from "./htmlParser";
import {assign} from './polyfills';
import {getStringWidth, ellipsize} from './common';
import state from './state';

export function validateInput(allOptions) {
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
        if (typeof settings.showHeader !== 'undefined') {
            if (settings.showHead == undefined) settings.showHead = settings.showHeader;
            console.error("Deprecation warning: showHeader renamed to showHead");
        }
        if (typeof settings.headerStyles !== 'undefined') {
            if (settings.headStyles == undefined) settings.headStyles = settings.headerStyles;
            console.error("Deprecation warning: headerStyles renamed to headStyles");
        }
        if (settings.pageBreak != undefined) {
            if (settings.avoidTableSplit == undefined) settings.avoidTableSplit = settings.pageBreak === 'avoid';
            console.error("Deprecation warning: pageBreak renamed to avoidTableSplit");
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
        
        let oldHooks = ["createdHeaderCell", "createdCell", "drawHeaderRow", "drawRow", "drawHeaderCell", "drawCell", "addPageContent"];
        for (let hookName of oldHooks) {
            if (settings[hookName]) {
                console.error(`The hook "${hookName}" has been removed/renamed in version 3.0 of jspdf-autotable. Make sure you update your project according to the migration guide.`);
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
        
        var checkStyles = function(styles) {
            if (styles.rowHeight) {
                console.error("Use of deprecated style rowHeight. It is renamed to minCellHeight.");
                if (!styles.minCellHeight) {
                    styles.minCellHeight = styles.rowHeight;
                }
            } else if (styles.columnWidth) {
                console.error("Use of deprecated style columnWidth. It is renamed to cellWidth.");
                if (!styles.cellWidth) {
                    styles.cellWidth = styles.columnWidth;
                }
            }
        };
        
        for (let styleProp of ['styles', 'bodyStyles', 'headStyles', 'footStyles']) {
            checkStyles(settings[styleProp] || {});
        }
        
        let columnStyles = settings['columnStyles'] || {};
        for (let dataKey of Object.keys(columnStyles)) {
            checkStyles(columnStyles[dataKey] || {});
        }
    }
}

export function parseArguments(args) {
    if (typeof args[0] === 'number') {
        let opts = args[1];
        opts.startY = args[0];
        return opts;
    } else if (Array.isArray(args[0])) {
        // Deprecated initialization
        let opts = args[2] || {};
        
        if (!opts.columns && !opts.head && !opts.body) {
            opts.columns = [];

            let headers = args[0];
            if (!opts.head) opts.head = [[]];
            let dataKeys = [];
            headers.forEach(function (item, i) {
                if (item && item.dataKey != undefined) {
                    item = {dataKey: item.dataKey, content: item.title};
                } else {
                    item = {dataKey: i, content: item};
                }
                dataKeys.push(item.dataKey);
                opts.head[0].push(item);
            });

            opts.body = [];
            for (let rawRow of args[1]) {
                let row = {};
                for (let dataKey of dataKeys) {
                    row[dataKey] = rawRow[dataKey];
                }
                opts.body.push(row);
            }
        }
        return opts;
    } else {
        return args[0];
    }
}

/**
 * Create models from the user input
 */
export function parseInput(doc, allOptions) {
    validateInput(allOptions);
    
    let table = new Table(doc);
    let settings = parseSettings(table, allOptions, getDefaults());
    table.id = settings.tableId;
    state().table = table;
    
    if (settings.theme === 'auto') {
        settings.theme = settings.useCss ? 'plain' : 'striped';
    }
    
    let theme = getTheme(settings.theme);
 
    let cellStyles = {
        head: [theme.table, theme.foot, table.styles.styles, table.styles.headStyles],
        body: [theme.table, theme.body, table.styles.styles, table.styles.bodyStyles],
        foot: [theme.table, theme.foot, table.styles.styles, table.styles.footStyles]
    };
    
    let htmlContent = {};
    if (table.settings.fromHtml) {
        htmlContent = parseHtml(settings.fromHtml, settings.includeHiddenHtml, settings.useCss);
        if (!htmlContent) htmlContent = {};
    }
    let columnMap = {};
    let spanColumns = {};
    for (let sectionName of ['head', 'body', 'foot']) {
        let section = table.settings[sectionName] || htmlContent[sectionName] || [];
        let rowColumns = [];
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

                let style = Config.styles(cellStyles[sectionName].concat([rowStyles, colStyles]));
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
    
    table.settings.margin = Config.marginOrPadding(table.settings.margin, getDefaults().margin);
    
    return table;
}

function parseSettings(table: Table, allOptions, defaults) {    
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

    // Merge all other options one level
    table.settings = assign(defaults, ...allOptions);
    
    return table.settings;
}