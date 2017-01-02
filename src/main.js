'use strict';

import jsPDF from 'jspdf';
import {Table, Row, Cell, Column} from './models.js';
import {Config, getTheme, FONT_ROW_RATIO} from './config.js';
import './polyfills.js';

let cursor, // An object keeping track of the x and y position of the next table cell to draw
    settings, // Default options merged with user options
    globalAddPageContent = function() {}, // Override with doc.autoTableAddPageContent
    table; // The current Table instance

/**
 * Create a table from a set of rows and columns.
 *
 * @param {Object[]|String[]} headers Either as an array of objects or array of strings
 * @param {Object[][]|String[][]} data Either as an array of objects or array of strings
 * @param {Object} [userOptions={}] Options that will override the default ones
 */
jsPDF.API.autoTable = function (headers, data, userOptions = {}) {
    validateInput(headers, data, userOptions);
    Config.setJspdfInstance(this);
    let doc = Config.getJspdfInstance();
    settings = Config.initSettings(userOptions);

    // Need a cursor y as it needs to be reset after each page (row.y can't do that)
    // Also prefer cursor to column.x as the cursor is easier to modify in the hooks
    cursor = {
        x: settings.margin.left,
        y: settings.startY === false ? settings.margin.top : settings.startY
    };

    // Create the table model with its columns, rows and cells
    createModels(headers, data);
    calculateWidths(this, doc.internal.pageSize.width);

    let minTableBottomPos = settings.startY + settings.margin.bottom + table.headerRow.height;
    if (settings.pageBreak === 'avoid') {
        minTableBottomPos += table.height;
    }
    let pageHeight = doc.internal.pageSize.height;
    if ((settings.pageBreak === 'always' && settings.startY !== false) ||
        (settings.startY !== false && minTableBottomPos > pageHeight)) {
        Config.getJspdfInstance().addPage();
        cursor.y = settings.margin.top;
    }

    Config.applyStyles(Config.getUserStyles());
    if (settings.showHeader === true || settings.showHeader === 'always' || settings.showHeader === 'once') {
        printRow(table.headerRow, settings.drawHeaderRow, settings.drawHeaderCell);
    }
    Config.applyStyles(Config.getUserStyles());

    table.rows.forEach(function (row) {
        printFullRow(row, settings.drawRow, settings.drawCell);
    });

    settings.addPageContent(hooksData());
    Config.applyStyles(Config.getUserStyles());
    globalAddPageContent(hooksData());
    Config.applyStyles(Config.getUserStyles());

    return this;
};

/**
 * Returns the Y position of the last drawn cell
 * @returns int
 */
jsPDF.API.autoTableEndPosY = function () {
    let sameDocument = Config.getJspdfInstance() === this;
    if (sameDocument && cursor && typeof cursor.y === 'number') {
        return cursor.y;
    } else {
        return 0;
    }
};

jsPDF.API.autoTableAddPageContent = function (hook) {
    if (typeof hook !== "function") {
        console.error("A function has to be provided to autoTableAddPageContent, got: " + typeof hook)
    }
    globalAddPageContent = hook;
};

/**
 * Parses an html table
 *
 * @param tableElem Html table element
 * @param includeHiddenElements If to include hidden rows and columns (defaults to false)
 * @returns Object Object with two properties, columns and rows
 */
jsPDF.API.autoTableHtmlToJson = function (tableElem, includeHiddenElements) {
    includeHiddenElements = includeHiddenElements || false;
    
    if (!tableElem || !(tableElem instanceof HTMLTableElement)) {
        console.error("A HTMLTableElement has to be sent to autoTableHtmlToJson");
        return null;
    }
    
    let columns = {}, rows = [];

    let header = tableElem.rows[0];

    for (let i = 0; i < header.cells.length; i++) {
        let cell = header.cells[i];
        let style = window.getComputedStyle(cell);
        if (includeHiddenElements || style.display !== 'none') {
            columns[i] = cell;
        }
    }

    for (let i = 1; i < tableElem.rows.length; i++) {
        let tableRow = tableElem.rows[i];
        let style = window.getComputedStyle(tableRow);
        if (includeHiddenElements || style.display !== 'none') {
            let rowData = [];
            for (let j of Object.keys(columns)) {
                let cell = tableRow.cells[j];
                rowData.push(cell);
            }
            rows.push(rowData);
        }
    }

    return {columns: Object.values(columns), rows: rows, data: rows};
};

/**
 * Add a new page including an autotable header etc. Use this function in the hooks.
 */
jsPDF.API.autoTableAddPage = function () {
    addPage();
};

/**
 * Improved text function with halign and valign support
 * Inspiration from: http://stackoverflow.com/questions/28327510/align-text-right-using-jspdf/28433113#28433113
 */
jsPDF.API.autoTableText = function (text, x, y, styles) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        console.error('The x and y parameters are required. Missing for the text: ', text);
    }
    let k = this.internal.scaleFactor;
    let fontSize = this.internal.getFontSize() / k;

    let splitRegex = /\r\n|\r|\n/g;
    let splittedText = null;
    let lineCount = 1;
    if (styles.valign === 'middle' || styles.valign === 'bottom' || styles.halign === 'center' || styles.halign === 'right') {
        splittedText = typeof text === 'string' ? text.split(splitRegex) : text;

        lineCount = splittedText.length || 1;
    }

    // Align the top
    y += fontSize * (2 - FONT_ROW_RATIO);

    if (styles.valign === 'middle')
        y -= (lineCount / 2) * fontSize * FONT_ROW_RATIO;
    else if (styles.valign === 'bottom')
        y -= lineCount * fontSize * FONT_ROW_RATIO;

    if (styles.halign === 'center' || styles.halign === 'right') {
        let alignSize = fontSize;
        if (styles.halign === 'center')
            alignSize *= 0.5;

        if (lineCount >= 1) {
            for (let iLine = 0; iLine < splittedText.length; iLine++) {
                this.text(splittedText[iLine], x - this.getStringUnitWidth(splittedText[iLine]) * alignSize, y);
                y += fontSize;
            }
            return Config.getJspdfInstance();
        }
        x -= this.getStringUnitWidth(text) * alignSize;
    }

    this.text(text, x, y);

    return Config.getJspdfInstance();
};

function validateInput(headers, data, options) {
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
            "jsPDF-AutoTable. You can try polyfilling it by including this script " +
            "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Polyfill");
    }
}

/**
 * Create models from the user input
 *
 * @param inputHeaders
 * @param inputData
 */
function createModels(inputHeaders, inputData) {
    table = new Table();

    let splitRegex = /\r\n|\r|\n/g;
    let theme = getTheme(settings.theme);
    
    // Header row and columns
    let headerRow = new Row(inputHeaders);
    headerRow.heightStyle = Config.styles([theme.table, theme.header, settings.styles, settings.headerStyles]).rowHeight;
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

        if (!(rawColumn instanceof HTMLElement) && typeof rawColumn.width !== 'undefined') {
            console.error("Use of deprecated option: column.width, use column.styles.columnWidth instead.");
        }

        let col = new Column(dataKey, index);
        col.widthStyle = Config.styles([theme.table, theme.header, settings.styles, settings.columnStyles[col.dataKey] || {}]).columnWidth;
        table.columns.push(col);

        let cell = new Cell();
        cell.raw = rawColumn;
        cell.styles = Config.styles([theme.table, theme.header, settings.styles, settings.headerStyles]);

        if (cell.raw instanceof HTMLElement) {
            cell.text = cell.raw.textContent.trim();
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
        let rowStyles = i % 2 === 0 ? Object.assign({}, theme.alternateRow, settings.alternateRowStyles) : {};
        row.heightStyle = Config.styles([theme.table, theme.body, settings.styles, settings.bodyStyles, rowStyles]).rowHeight;
        table.columns.forEach(function (column) {
            let cell = new Cell();
            cell.raw = rawRow[column.dataKey];
            let colStyles = settings.columnStyles[column.dataKey] || {};
            cell.styles = Config.styles([theme.table, theme.body, settings.styles, settings.bodyStyles, rowStyles, colStyles]);
            
            if (cell.raw && cell.raw instanceof HTMLElement) {
                cell.text = cell.raw.textContent.trim();
            } else {
                // Stringify 0 and false, but not undefined
                cell.text = typeof cell.raw !== 'undefined' ? '' + cell.raw : '';
            }
            cell.text = cell.text.split(splitRegex);
            
            row.cells[column.dataKey] = cell;
            settings.createdCell(cell, hooksData({column: column, row: row}));
        });
        table.rows.push(row);
    });
}

/**
 * Calculate the column widths
 */
function calculateWidths(doc, pageWidth) {
    
    // Column and table content width
    let fixedWidth = 0;
    let autoWidth = 0;
    let dynamicColumns = [];
    table.columns.forEach(function (column) {
        column.contentWidth = 0;
        table.rows.concat(table.headerRow).forEach(function (row) {
            let cell = row.cells[column.dataKey];
            let hpadding = cell.styles.cellPadding.left + cell.styles.cellPadding.right;
            cell.contentWidth = hpadding + getStringWidth(cell.text, cell.styles);
            if (cell.contentWidth > column.contentWidth) {
                column.contentWidth = cell.contentWidth;
            }
        });
        table.contentWidth += column.contentWidth;
        if (typeof column.widthStyle === 'number') {
            column.preferredWidth = column.widthStyle;
            fixedWidth += column.preferredWidth;
            column.width = column.preferredWidth;
        } else if (column.widthStyle === 'wrap') {
            column.preferredWidth = column.contentWidth;
            fixedWidth += column.preferredWidth;
            column.width = column.preferredWidth;
        } else {
            column.preferredWidth = column.contentWidth;
            autoWidth += column.contentWidth;
            dynamicColumns.push(column);
        }
        table.preferredWidth += column.preferredWidth;
    });
    
    if (typeof settings.tableWidth === 'number') {
        table.width = settings.tableWidth;
    } else if (settings.tableWidth === 'wrap') {
        table.width = table.preferredWidth;
    } else {
        table.width = pageWidth - settings.margin.left - settings.margin.right;
    }
    
    distributeWidth(dynamicColumns, fixedWidth, autoWidth, 0);

    // Row height, table height and text overflow
    let all = table.rows.concat(table.headerRow);
    all.forEach(function (row, i) {
        let maxCellHeight = 0;
        table.columns.forEach(function (col) {
            let cell = row.cells[col.dataKey];
            
            Config.applyStyles(cell.styles);
            let textSpace = col.width - cell.styles.cellPadding.left - cell.styles.cellPadding.right;
            if (cell.styles.overflow === 'linebreak') {
                // Add one pt to textSpace to fix rounding error
                try {
                    cell.text = doc.splitTextToSize(cell.text, textSpace + 1, {fontSize: cell.styles.fontSize});
                } catch(e) {
                    if (e instanceof TypeError && Array.isArray(cell.text)) {
                        cell.text = doc.splitTextToSize(cell.text.join(' '), textSpace + 1, {fontSize: cell.styles.fontSize});
                    } else {
                        throw e;
                    }
                }
            } else if (cell.styles.overflow === 'ellipsize') {
                cell.text = ellipsize(cell.text, textSpace, cell.styles);
            } else if (cell.styles.overflow === 'visible') {
                // Do nothing
            } else if (cell.styles.overflow === 'hidden') {
                cell.text = ellipsize(cell.text, textSpace, cell.styles, '');
            } else if (typeof cell.styles.overflow === 'function') {
                cell.text = cell.styles.overflow(cell.text, textSpace);
            } else {
                console.error("Unrecognized overflow type: " + cell.styles.overflow);
            }
            
            let k = Config.getJspdfInstance().internal.scaleFactor;
            let lineCount = Array.isArray(cell.text) ? cell.text.length : 1;
            let fontHeight = cell.styles.fontSize / k * FONT_ROW_RATIO;
            let vpadding = cell.styles.cellPadding.top + cell.styles.cellPadding.bottom;
            let contentHeight = vpadding + fontHeight;
            let vextra = contentHeight > row.heightStyle ? vpadding : row.heightStyle - fontHeight;
            cell.contentHeight = lineCount * fontHeight + vextra;
            if (cell.contentHeight > maxCellHeight) {
                maxCellHeight = cell.contentHeight;
            }
        });

        row.height = maxCellHeight;
        table.height += row.height;
    });
}

function distributeWidth(dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth) {
    let extraWidth = table.width - staticWidth - dynamicColumnsContentWidth;
    for (let i = 0; i < dynamicColumns.length; i++) {
        let col = dynamicColumns[i];
        let ratio = col.contentWidth / dynamicColumnsContentWidth;
        // A column turned out to be none dynamic, start over recursively
        let isNoneDynamic = col.contentWidth + extraWidth * ratio < fairWidth;
        if (extraWidth < 0 && isNoneDynamic) {
            dynamicColumns.splice(i, 1);
            dynamicColumnsContentWidth -= col.contentWidth;
            col.width = fairWidth;
            staticWidth += col.width;
            distributeWidth(dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth);
            break;
        } else {
            col.width = col.contentWidth + extraWidth * ratio;
        } 
    }
}

function addContentHooks() {
    settings.addPageContent(hooksData());
    Config.applyStyles(Config.getUserStyles());
    globalAddPageContent(hooksData());
    Config.applyStyles(Config.getUserStyles());
}

function addPage() {
    // Add user content just before adding new page ensure it will 
    // be drawn above other things on the page
    addContentHooks();
    Config.getJspdfInstance().addPage();
    table.pageCount++;
    cursor = {x: settings.margin.left, y: settings.margin.top};
    if (settings.showHeader === true || settings.showHeader === 'always') {
        printRow(table.headerRow, settings.drawHeaderRow, settings.drawHeaderCell);
    }
}

/**
 * Add a new page if cursor is at the end of page
 */
function canFitOnPage(rowHeight) {
    let pageHeight = Config.getJspdfInstance().internal.pageSize.height;
    let pos = cursor.y + rowHeight + settings.margin.bottom;
    return pos < pageHeight;
}

function printFullRow(row, drawRowHook, drawCellHook) {
    let remainingRowHeight = 0;
    let remainingTexts = {};
    
    if (!canFitOnPage(row.height)) {
        // Simply move small rows to new page to avoid splitting
        // TODO Improve
        if (row.height < row.heightStyle * 3) {
            addPage();
        } else {
            
            // Modify the row to fit the current page and calculate text and height of partial row
            
            row.spansMultiplePages = true;
            
            let pageHeight = Config.getJspdfInstance().internal.pageSize.height;
            let maxCellHeight = 0;
            
            for (let j = 0; j < table.columns.length; j++) {
                let col = table.columns[j];
                let cell = row.cells[col.dataKey];

                let k = Config.getJspdfInstance().internal.scaleFactor;
                let fontHeight = cell.styles.fontSize / k * FONT_ROW_RATIO;
                let vpadding = 0 / k; // TODO
                let remainingPageSpace = pageHeight - cursor.y - settings.margin.bottom;
                let remainingLineCount = Math.floor((remainingPageSpace - vpadding) / fontHeight);
 
                if (Array.isArray(cell.text) && cell.text.length > remainingLineCount) {
                    let remainingLines = cell.text.splice(remainingLineCount, cell.text.length);
                    remainingTexts[col.dataKey] = remainingLines;
                    
                    let rowHeight1 = cell.text.length * fontHeight + vpadding;
                    if (rowHeight1 > maxCellHeight) {
                        maxCellHeight = rowHeight1;
                    }

                    let rowHeight2 = remainingLines.length * fontHeight + vpadding;
                    if (rowHeight2 > remainingRowHeight) {
                        remainingRowHeight = rowHeight2;
                    }
                }
            }
            
            // Reset row height since text are now removed
            row.height = maxCellHeight;
        }
    }

    printRow(row, drawRowHook, drawCellHook);

    // Parts of the row is now printed. Time for adding a new page, prune 
    // the text and start over
    
    if (Object.keys(remainingTexts).length > 0) {
        for (let j = 0; j < table.columns.length; j++) {
            let col = table.columns[j];
            let cell = row.cells[col.dataKey];
            cell.text = remainingTexts[col.dataKey] || '';
        }

        addPage();
        row.pageCount++;
        row.height = remainingRowHeight;
        printFullRow(row, drawRowHook, drawCellHook);
    }
}

function printRow(row, drawRowHook, drawCellHook) {
    row.y = cursor.y;

    if (drawRowHook(row, hooksData({row: row})) === false) {
        return;
    }

    cursor.x = settings.margin.left;
    for (let i = 0; i < table.columns.length; i++) {
        let column = table.columns[i];
        let cell = row.cells[column.dataKey];
        if(!cell) {
            continue;
        }
        Config.applyStyles(cell.styles);

        cell.x = cursor.x;
        cell.y = cursor.y;
        cell.height = row.height;
        cell.width = column.width;

        if (cell.styles.valign === 'top') {
            cell.textPos.y = cursor.y + cell.styles.cellPadding.top;
        } else if (cell.styles.valign === 'bottom') {
            cell.textPos.y = cursor.y + row.height - cell.styles.cellPadding.bottom;
        } else {
            cell.textPos.y = cursor.y + row.height / 2;
        }

        if (cell.styles.halign === 'right') {
            cell.textPos.x = cell.x + cell.width - cell.styles.cellPadding.right;
        } else if (cell.styles.halign === 'center') {
            cell.textPos.x = cell.x + cell.width / 2;
        } else {
            cell.textPos.x = cell.x + cell.styles.cellPadding.left;
        }

        let data = hooksData({column: column, row: row});
        if (drawCellHook(cell, data) !== false) {
            let fillStyle = getFillStyle(cell.styles);
            if (fillStyle) {
                Config.getJspdfInstance().rect(cell.x, cell.y, cell.width, cell.height, fillStyle);
            }
            Config.getJspdfInstance().autoTableText(cell.text, cell.textPos.x, cell.textPos.y, {
                halign: cell.styles.halign,
                valign: cell.styles.valign
            });
        }
        cursor.x += cell.width;
    }

    cursor.y += row.height;
}

function getFillStyle(styles) {
    let drawLine = styles.lineWidth > 0;
    let drawBackground = styles.fillColor !== false;
    if (drawLine && drawBackground) {
        return 'DF'; // Fill then stroke
    } else if (drawLine) {
        return 'S'; // Only stroke (transperant backgorund)
    } else if (drawBackground) {
        return 'F'; // Only fill, no stroke
    } else {
        return false;
    }
}

function hooksData(additionalData) {
    return Object.assign({
        pageCount: table.pageCount,
        settings: settings,
        table: table,
        doc: Config.getJspdfInstance(),
        cursor: cursor
    }, additionalData || {});
}

function getStringWidth(text, styles) {
    let k = Config.getJspdfInstance().internal.scaleFactor;
    let fontSize = styles.fontSize / k;
    Config.applyStyles(styles);
    text = Array.isArray(text) ? text : [text];
    let maxWidth = 0;
    text.forEach(function(line) {
        let width = Config.getJspdfInstance().getStringUnitWidth(line);
        if (width > maxWidth) {
            maxWidth = width;
        }
    });
    let precision = 10000 * k;
    maxWidth = Math.floor(maxWidth * precision) / precision;
    return maxWidth * fontSize;
}

/**
 * Ellipsize the text to fit in the width
 */
function ellipsize(text, width, styles, ellipsizeStr) {
    ellipsizeStr = typeof  ellipsizeStr !== 'undefined' ? ellipsizeStr : '...';

    if (Array.isArray(text)) {
        let value = [];
        text.forEach(function (str, i) {
            value[i] = ellipsize(str, width, styles, ellipsizeStr);
        });
        return value;
    }

    let k = Config.getJspdfInstance().internal.scaleFactor;
    let precision = 10000 * k;
    width = Math.ceil(width * precision) / precision;

    if (width >= getStringWidth(text, styles)) {
        return text;
    }
    while (width < getStringWidth(text + ellipsizeStr, styles)) {
        if (text.length <= 1) {
            break;
        }
        text = text.substring(0, text.length - 1);
    }
    return text.trim() + ellipsizeStr;
}
