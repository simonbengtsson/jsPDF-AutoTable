/**
 * jsPDF AutoTable plugin
 * Copyright (c) 2014 Simon Bengtsson, https://github.com/someatoms/jsPDF-AutoTable
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function (API) {
    'use strict';

    // Ratio between font size and font height, number comes from jspdf source code
    var FONT_ROW_RATIO = 1.25;

    var doc, // The current jspdf instance
        cursor, // An object keeping track of the x and y position of the next table cell to draw
        settings, // Default options merged with user options
        table; // The current Table instance

    // Base style for all themes
    var defaultStyles = {
        cellPadding: 5,
        fontSize: 10,
        font: "helvetica", // helvetica, times, courier
        lineColor: 200,
        lineWidth: 0.1,
        fontStyle: 'normal', // normal, bold, italic, bolditalic
        rowHeight: 20,
        overflow: 'ellipsize', // visible, hidden, ellipsize or linebreak
        fillColor: 255,
        textColor: 20,
        halign: 'left', // left, center, right
        valign: 'middle', // top, middle, bottom
        fillStyle: 'F' // 'S', 'F' or 'DF' (stroke, fill or fill then stroke)
    };

    // Styles for the themes
    var themes = {
        'striped': {
            table: {
                fillColor: 255,
                textColor: 80,
                fontStyle: 'normal',
                fillStyle: 'F'
            },
            header: {
                textColor: 255,
                fillColor: [41, 128, 185],
                rowHeight: 23,
                fontStyle: 'bold'
            },
            alternateRow: {fillColor: 245}
        },
        'grid': {
            table: {
                fillColor: 255,
                textColor: 80,
                fontStyle: 'normal',
                lineWidth: 0.1,
                fillStyle: 'S'
            },
            header: {
                textColor: 255,
                fillColor: [26, 188, 156],
                rowHeight: 23,
                fillStyle: 'F',
                fontStyle: 'bold'
            },
            alternateRow: {}
        },
        'plain': {header: {fontStyle: 'bold'}}
    };

    // See README.md or examples.js for documentation of the options
    var defaultOptions = function () {
        return {
            theme: 'striped', // 'striped', 'grid' or 'plain'
            styles: {},
            headerStyles: {},
            alternateRowStyles: {},
            renderHeader: function (doc, pageNumber, settings) {},
            renderFooter: function (doc, lastCellPos, pageNumber, settings) {},
            margins: {right: 40, left: 40, top: 50, bottom: 40},
            startY: false,
            columnOptions: {},
            pageBreak: 'auto', // auto, avoid, always
            tableWidth: 'auto',
            createdHeaderCell: function (cell, data) {},
            createdCell: function (cell, data) {},
            renderHeaderCell: function (cell, data) {
                doc.rect(cell.x, cell.y, cell.width, cell.height, cell.styles.fillStyle);
                doc.autoTableText(cell.text, cell.textPos.x, cell.textPos.y,  {halign: cell.styles.halign, valign: cell.styles.valign});
            },
            renderCell: function (cell, data) {
                doc.rect(cell.x, cell.y, cell.width, cell.height, cell.styles.fillStyle);
                doc.autoTableText(cell.text, cell.textPos.x, cell.textPos.y,  {halign: cell.styles.halign, valign: cell.styles.valign});
            }
        }
    };

    /**
     * Create a table from a set of rows and columns.
     *
     * @param {Object[]|String[]} headers Either as an array of objects or array of strings
     * @param {Object[][]|String[][]} data Either as an array of objects or array of strings
     * @param {Object} [options={}] Options that will override the default ones
     */
    API.autoTable = function (headers, data, options) {
        doc = this;
        settings = initOptions(options || {});
        cursor = {
            x: settings.margins.left,
            y: settings.startY === false ? settings.margins.top : settings.startY
        };

        var userStyles = {
            textColor: 30, // Setting text color to dark gray as it can't be obtained from jsPDF
            fontSize: doc.internal.getFontSize(),
            fontStyle: doc.internal.getFont().fontStyle
        };

        // Create the table model with its columns, rows and cells
        createModels(headers, data);
        calculateWidths();

        // Page break if there is room for only the first data row
        var firstRowHeight = table.rows[0] && settings.pageBreak === 'auto' ? table.rows[0].height : 0;
        var minTableBottomPos = settings.startY + settings.margins.bottom + table.headerRow.height + firstRowHeight;
        if (settings.pageBreak === 'avoid') {
            minTableBottomPos += table.height;
        }
        if ((settings.pageBreak === 'always' && settings.startY !== false) ||
            (settings.startY !== false && minTableBottomPos > doc.internal.pageSize.height)) {
            doc.addPage();
            table.pageCount++;
            cursor.y = settings.margins.top;
        }

        settings.renderHeader(doc, table.pageCount, settings);
        printHeader();
        printRows();
        settings.renderFooter(doc, cursor, table.pageCount, settings);

        applyStyles(userStyles);

        return this;
    };

    /**
     *
     * @param hook string|string[] renderCell, createdCell, beforePageContent, afterPageContent
     * @param handler The function to be called
     */
    API.autoTableAddHook = function (hook, handler) {

    };

    /**
     * Returns the Y position of the last drawn cell
     * @returns int
     */
    API.autoTableEndPosY = function () {
        if (typeof cursor === 'undefined' || typeof cursor.y === 'undefined') {
            console.error("autoTableEndPosY() called without autoTable() being called first");
            return 0;
        }
        return cursor.y;
    };

    /**
     * Parses an html table
     *
     * @param table Html table element
     * @returns Object Object with two properties, columns and rows
     */
    API.autoTableHtmlToJson = function (table) {
        var data = [], headers = [], header = table.rows[0], i, tableRow, rowData, j;
        for (i = 0; i < header.cells.length; i++) {
            headers.push(header.cells[i] ? header.cells[i].textContent : '');
        }

        for (i = 1; i < table.rows.length; i++) {
            tableRow = table.rows[i];
            rowData = [];
            for (j = 0; j < header.cells.length; j++) {
                rowData.push(tableRow.cells[j] ? tableRow.cells[j].textContent : '');
            }
            data.push(rowData);
        }
        return {columns: headers, data: data, rows: data};
    };

    /**
     * Improved text function with halign and valign support
     * Inspiration from: http://stackoverflow.com/questions/28327510/align-text-right-using-jspdf/28433113#28433113
     */
    API.autoTableText = function (text, x, y, styles) {
        var fontSize = doc.internal.getFontSize() / doc.internal.scaleFactor;

        // As defined in jsPDF source code
        var lineHeightProportion = 1.15;

        var splitRegex = /\r\n|\r|\n/g;
        var splittedText = null;
        var lineCount = 1;
        if (styles.valign === 'middle' || styles.valign === 'bottom' || styles.halign === 'center' || styles.halign === 'right') {
            splittedText = typeof text === 'string' ? text.split(splitRegex) : text;

            lineCount = splittedText.length || 1;
        }

        // Align the top
        y += fontSize * (2 - lineHeightProportion);

        if (styles.valign  === 'middle')
            y -= (lineCount / 2) * fontSize;
        else if (styles.valign  === 'bottom')
            y -= lineCount * fontSize;

        if (styles.halign === 'center' || styles.halign  === 'right') {
            var alignSize = fontSize;
            if (styles.halign === 'center')
                alignSize *= 0.5;

            if (lineCount >= 1) {
                for (var iLine = 0; iLine < splittedText.length; iLine++) {
                    doc.text(splittedText[iLine], x - doc.getStringUnitWidth(splittedText[iLine]) * alignSize, y);
                    y += fontSize;
                }
                return doc;
            }
            x -= doc.getStringUnitWidth(text) * alignSize;
        }

        doc.text(text, x, y);
        return doc;
    };

    function initOptions(userOptions) {
        var settings = extend(defaultOptions(), userOptions);

        // Backwards compatibility
        if (settings.margins.horizontal !== undefined) {
            settings.margins.left = settings.margins.horizontal;
            settings.margins.right = settings.margins.horizontal;
            console.error("Use of deprecated option: margins.horizontal. Use margins.left and margins.right instead.");
        } else {
            settings.margins.horizontal = settings.margins.left;
        }

        if (typeof settings.extendWidth !== 'undefined') {
            settings.tableWidth = settings.extendWidth ? 'auto' : 'wrap';
            console.error("Use of deprecated option: extendWidth, use tableWidth instead.");
        }

        // Styles
        if (typeof settings.padding !== 'undefined') {
            settings.styles.cellPadding = settings.padding;
            console.error("Use of deprecated option: padding, use styles.cellPadding instead.");
        }
        if (typeof settings.lineHeight !== 'undefined') {
            settings.styles.rowHeight = settings.lineHeight;
            console.error("Use of deprecated option: lineHeight, use styles.rowHeight instead.");
        }
        if (typeof settings.fontSize !== 'undefined') {
            settings.styles.fontSize = settings.fontSize;
            console.error("Use of deprecated option: fontSize, use styles.fontSize instead.");
        }
        if (typeof settings.overflow !== 'undefined') {
            settings.styles.overflow = settings.overflow;
            console.error("Use of deprecated option: overflow, use styles.overflow instead.");
        }

        return settings;
    }

    /**
     * Create models from the user input
     *
     * @param inputHeaders
     * @param inputData
     */
    function createModels(inputHeaders, inputData) {
        table = new Table();
        table.pageCount = 1;

        // Header row and columns
        var headerRow = new Row();
        headerRow.raw = inputHeaders;
        headerRow.styles = extend(defaultStyles, themes[settings.theme].table, themes[settings.theme].header, settings.headerStyles);

        // Columns and header row
        inputHeaders.forEach(function (value, key) {
            if (typeof value === 'object' && typeof value.key !== 'undefined') {
                key = value.key;
            }

            var col = new Column(key);
            var colOptions = settings.columnOptions[col.key];
            var colOptionsStyles = {};
            if (typeof colOptions !== 'undefined') {
                if (typeof colOptions.styles !== 'undefined') colOptionsStyles = colOptions.styles;
                if (typeof colOptions.width !== 'undefined') col.widthSetting = colOptions.width;
                if (typeof colOptions.title !== 'undefined') col.title = colOptions.title;
            }
            col.styles = colOptionsStyles;
            table.columns.push(col);

            var cell = new Cell();
            cell.raw = typeof value === 'object' ? value.title : value;
            cell.styles = headerRow.styles;
            cell.text = '' + cell.raw;
            cell.contentWidth = cell.styles.cellPadding * 2 + getStringWidth(cell.text, cell.styles);
            cell.text = [cell.text];
            headerRow.cells[key] = cell;
            settings.createdHeaderCell(cell, {column: col, row: headerRow, settings: settings});
        });
        table.headerRow = headerRow;

        // Rows och cells
        inputData.forEach(function (rawRow, i) {
            var row = new Row(rawRow);
            var isAlternate = i % 2 === 0;
            var themeStyles = extend(defaultStyles, themes[settings.theme].table, isAlternate ? themes[settings.theme].alternateRow : {});
            row.styles = extend(themeStyles, settings.styles, isAlternate ? settings.alternateRowStyles : {});
            table.columns.forEach(function (column) {
                var cell = new Cell();
                cell.raw = rawRow[column.key];
                cell.styles = extend(row.styles, column.styles);
                cell.text = typeof cell.raw !== 'undefined' ? '' + cell.raw : ''; // Stringify 0 and false, but not undefined
                row.cells[column.key] = cell;
                settings.createdCell(cell, {column: column, row: row, settings: settings});
                cell.contentWidth = cell.styles.cellPadding * 2 + getStringWidth(cell.text, cell.styles);
                cell.text = [cell.text];
            });
            table.rows.push(row);
        });
    }

    /**
     * Calculate the column widths
     */
    function calculateWidths() {
        // Column and table content width
        var tableContentWidth = 0;
        table.columns.forEach(function (column) {
            column.contentWidth = table.headerRow.cells[column.key].contentWidth;
            table.rows.forEach(function (row) {
                var cellWidth = row.cells[column.key].contentWidth;
                if (cellWidth > column.contentWidth) {
                    column.contentWidth = cellWidth;
                }
            });
            column.width = column.contentWidth;
            tableContentWidth += column.contentWidth;
        });
        table.contentWidth = tableContentWidth;
        table.width = table.contentWidth;

        // Actual width
        if (settings.tableWidth !== 'wrap') {

            var tableWidth = doc.internal.pageSize.width - settings.margins.left - settings.margins.right;
            if (settings.tableWidth !== 'auto') {
                // If not auto or wrap it should be a number
                tableWidth = settings.tableWidth;
            }
            table.width = tableWidth;

            // Figure out dynamic columns
            var fairPart = tableWidth / table.columns.length;
            var flexibleColumns = [];
            var flexibleColumnsWidth = tableWidth;
            table.columns.forEach(function (column) {
                if (column.widthSetting === 'auto' && column.contentWidth > fairPart) {
                    flexibleColumns.push(column);
                } else {
                    flexibleColumnsWidth -= column.contentWidth;
                }
            });

            // First increase or decrease the column by as much as needed
            var newColumnWidth = flexibleColumnsWidth / flexibleColumns.length;
            flexibleColumns.forEach(function (column, i) {
                if (newColumnWidth < fairPart) {
                    flexibleColumns.slice(i, 1);
                    column.width = fairPart;
                    newColumnWidth += fairPart - newColumnWidth / flexibleColumns.length;
                } else {
                    column.width = newColumnWidth;
                }
            });
        }

        // Row height, table height and text overflow
        table.height = 0;
        var all = table.rows.concat(table.headerRow);
        all.forEach(function (row, i) {
            var lineBreakCount = 0;
            table.columns.forEach(function (col) {
                var cell = row.cells[col.key];
                applyStyles(cell.styles);
                var textSpace = col.width - cell.styles.cellPadding * 2;
                if (cell.styles.overflow === 'linebreak') {
                    // Add one pt to textSpace to fix rounding error
                    cell.text = doc.splitTextToSize(cell.text, textSpace + 1, {fontSize: cell.styles.fontSize});
                    var count = cell.text.length - 1;
                    if (count > lineBreakCount) {
                        lineBreakCount = count;
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
            });
            row.height = row.styles.rowHeight + lineBreakCount * row.styles.fontSize * FONT_ROW_RATIO;
            table.height += row.height;
        });
    }

    function printHeader() {
        table.columns.forEach(function (col, i) {
            drawCell(table.headerRow.cells[col.key], col, table.headerRow, -1);
        });

        cursor.y += table.headerRow.height;
        cursor.x = settings.margins.left;
    }

    function printRows() {
        table.rows.forEach(function (row, i) {
            table.columns.forEach(function (col) {
                drawCell(row.cells[col.key], col, row, i);
            });

            cursor.y += row.height;
            cursor.x = settings.margins.left;

            // Add a new page if cursor is at the end of page
            var newPage = table.rows[i + 1] && (cursor.y + table.rows[i + 1].height + settings.margins.bottom) >= doc.internal.pageSize.height;
            if (newPage) {
                settings.renderFooter(doc, cursor, table.pageCount, settings);
                doc.addPage();
                cursor = {x: settings.margins.left, y: settings.margins.top};
                table.pageCount++;
                settings.renderHeader(doc, table.pageCount, settings);
                printHeader();
            }
        });
    }

    function applyStyles(styles) {
        var arr = [
            {func: doc.setFillColor, value: styles.fillColor},
            {func: doc.setTextColor, value: styles.textColor},
            {func: doc.setFontStyle, value: styles.fontStyle},
            {func: doc.setDrawColor, value: styles.lineColor},
            {func: doc.setLineWidth, value: styles.lineWidth},
            {func: doc.setFont, value: styles.font},
            {func: doc.setFontSize, value: styles.fontSize}
        ];
        arr.forEach(function (obj) {
            if (typeof obj.value !== 'undefined') {
                if (obj.value.constructor === Array) {
                    obj.func.apply(this, obj.value);
                } else {
                    obj.func(obj.value);
                }
            }
        });
    }

    function drawCell(cell, column, row, rowIndex) {
        applyStyles(cell.styles);

        cell.x = cursor.x;
        cell.y = cursor.y;
        cell.height = row.height;
        cell.width = column.width;

        if (cell.styles.valign === 'top') {
            cell.textPos.y = cursor.y + cell.styles.cellPadding;
        } else if (cell.styles.valign === 'bottom') {
            cell.textPos.y = cursor.y + row.height - cell.styles.cellPadding;
        } else {
            cell.textPos.y = cursor.y + row.height / 2;
        }

        if (cell.styles.halign === 'right') {
            cell.textPos.x = cursor.x + cell.width - cell.styles.cellPadding;
        } else if (cell.styles.halign === 'center') {
            cell.textPos.x = cursor.x + cell.width / 2;
        } else {
            cell.textPos.x = cursor.x + cell.styles.cellPadding;
        }

        var data = {
            settings: settings,
            table: table,
            cursor: cursor,
            pageNumber: doc.pageNumber,
            rowIndex: rowIndex,
            column: column,
            row: row
        };

        if (rowIndex < 0) {
            settings.renderHeaderCell(cell, data);
        } else {
            settings.renderCell(cell, data);
        }

        cursor.x += cell.width;
    }

    /**
     * Ellipsize the text to fit in the width
     */
    function ellipsize(text, width, styles, ellipsizeStr) {
        ellipsizeStr = typeof  ellipsizeStr !== 'undefined' ? ellipsizeStr : '...';

        if (Array.isArray(text)) {
            text = text[0];
        }

        if (width >= getStringWidth(text, styles)) {
            return text;
        }
        while (width < getStringWidth(text + ellipsizeStr, styles)) {
            if (text.length < 2) {
                break;
            }
            text = text.substring(0, text.length - 1);
        }
        return text.trim() + ellipsizeStr;
    }

    function getStringWidth(text, styles) {
        applyStyles(styles);
        var w = doc.getStringUnitWidth(text);
        return w * styles.fontSize;
    }

    function extend(defaults) {
        var extended = {};
        var prop;
        for (prop in defaults) {
            if (defaults.hasOwnProperty(prop)) {
                extended[prop] = defaults[prop];
            }
        }
        for (var i = 1; i < arguments.length; i++) {
            var options = arguments[i];
            for (prop in options) {
                if (options.hasOwnProperty(prop)) {
                    if (typeof options[prop] === 'object' && !Array.isArray(options[prop])) {
                        //extended[prop] = extend(extended[prop] || {}, options[prop])
                        extended[prop] = options[prop];
                    } else {
                        extended[prop] = options[prop];
                    }
                }
            }
        }
        return extended;
    }

})(jsPDF.API);

var Table = function () {
    this.height = 0;
    this.width = 0;
    this.contentWidth = 0;
    this.rows = [];
    this.columns = [];
    this.headerRow = null;
    this.cursor = {x: 0, y: 0};
    this.settings = {};
    this.pageCount = 0;
};

var Row = function () {
    this.raw = {};
    this.styles = {};
    this.cells = {};
    this.height = -1;
};

var Cell = function (raw) {
    this.raw = raw;
    this.styles = {};
    this.text = '';
    this.contentWidth = -1;
    this.textPos = {};
    this.height = 0;
    this.width = 0;
    this.x = 0;
    this.y = 0;
};

var Column = function (id) {
    this.key = id;
    this.id = id;
    this.styles = {};
    this.contentWidth = -1;
    this.width = -1;
    this.widthSetting = 'auto';
};