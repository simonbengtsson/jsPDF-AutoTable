/**
 * jsPDF AutoTable plugin
 * Copyright (c) 2014 Simon Bengtsson, https://github.com/someatoms/jsPDF-AutoTable
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function (API) {
    'use strict';

    var FONT_ROW_RATIO = 1.25;

    var doc, cursor, pageCount = 1, settings, headerRow, columns, rows, table;

    var defaultStyles = {
        padding: 5,
        fontSize: 10,
        font: "helvetica", // helvetica, times, courier
        lineColor: 200,
        lineWidth: 0.1,
        fontStyle: 'normal', // normal, bold, italic, bolditalic
        rowHeight: 20,
        overflow: 'ellipsize', // 'visible', 'hidden', ellipsize or linebreak
        fillColor: 255,
        textColor: 20,
        textAlign: 'left',
        fillStyle: 'F' // 'S', 'F' or 'DF' (stroke, fill or fill then stroke)
    };

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
                fillStyle: 'DF'
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

    // See README.md or examples for documentation of the options
    // return a new instance every time to avoid references issues
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
            createdCell: function(cell, data) {},
            renderHeaderCell: function (cell, data) {
                data.settings.renderCell(cell, data);
            },
            renderCell: function (cell, data) {
                doc.rect(cell.rect.x, cell.rect.y, cell.rect.width, cell.rect.height, cell.styles.fillStyle);
                doc.text(cell.text, cell.textPos.x, cell.textPos.y);
            }
        }
    };

    /**
     * Create a table from a set of rows and columns.
     *
     * @param {Object[]|String[]} rawColumns Either as an array of objects or array of strings
     * @param {Object[][]|String[][]} rawRows Either as an array of objects or array of strings
     * @param {Object} [options={}] Options that will override the default ones (above)
     */
    API.autoTable = function (rawColumns, rawRows, options) {
        table = new Table();
        doc = this;

        var userStyles = {
            textColor: 30, // Text color can't be fetched from jsPDF
            fontSize: doc.internal.getFontSize(),
            fontStyle: doc.internal.getFont().fontStyle
        };

        settings = initOptions(options || {});
        table.styles = extend(defaultStyles, themes[settings.theme].table, settings.styles);

        pageCount = 1;
        headerRow = undefined;
        columns = [];
        rows = [];

        initData(rawColumns, rawRows);

        cursor = {
            x: settings.margins.left,
            y: settings.startY === false ? settings.margins.top : settings.startY
        };

        // Page break
        var firstRowsHeight = rows[0] && settings.pageBreak === 'auto' ? rows[0].height : 0; // Page break if place for only the first data row
        var tableEndPosY = settings.startY + settings.margins.bottom + headerRow.height + firstRowsHeight;
        if(settings.pageBreak === 'avoid') tableEndPosY += table.height;
        if ((settings.pageBreak === 'always' && settings.startY !== false) ||
            (settings.startY !== false && tableEndPosY > doc.internal.pageSize.height)) {
            doc.addPage();
            pageCount++;
            cursor.y = settings.margins.top;
        }

        settings.renderHeader(doc, pageCount, settings);
        printHeader();
        printRows();
        settings.renderFooter(doc, cursor, pageCount, settings);

        applyStyles(userStyles);

        return this;
    };

    /**
     * Returns the Y position of the last drawn cell
     * @returns int
     */
    API.autoTableEndPosY = function () {
        if (typeof cursor === 'undefined' || typeof cursor.y === 'undefined') {
            throw new Error("No AutoTable has been drawn and therefore autoTableEndPosY can't be called");
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

    function initOptions(raw) {
        var settings = extend(defaultOptions(), raw);

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
        }

        // Styles
        if (typeof settings.padding !== 'undefined') {
            settings.styles.padding = settings.padding;
            console.error("Use of deprecated option: padding, use styles.padding instead.");
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
     * Create models from input data
     */
    function initData(rawHeaders, rawRows) {


        // Header row and columns
        headerRow = new Row(rawHeaders);
        headerRow.styles = extend(table.styles, themes[settings.theme].header, settings.headerStyles);
        rawHeaders.forEach(function (value, key) {
            if (typeof value === 'object' && typeof value.key !== 'undefined') key = value.key;

            var col = new Column(key);
            var colOptions = settings.columnOptions[col.key];
            var colOptionsStyles = {};
            if (typeof colOptions !== 'undefined') {
                if (typeof colOptions.styles !== 'undefined') colOptionsStyles = colOptions.styles;
                if (typeof colOptions.width !== 'undefined') col.widthSetting = colOptions.width;
                if (typeof colOptions.parse !== 'undefined') col.parse = colOptions.parse;
                if (typeof colOptions.title !== 'undefined') col.title = colOptions.title;
            }
            col.styles = colOptionsStyles;
            columns.push(col);

            var cell = new Cell();
            cell.raw = typeof value === 'object' ? value.title : value;
            cell.styles = headerRow.styles;
            cell.text = '' + col.parse(cell, {column: col, row: headerRow, settings: settings});
            cell.contentWidth = cell.styles.padding * 2 + getStringWidth(cell.text, cell.styles);
            headerRow.cells[key] = cell;
        });

        // Rows
        rawRows.forEach(function (rawRow, i) {
            var row = new Row(rawRow);
            applyStyles(settings.alternateRowStyles);
            var isAlternate = i % 2 === 0;
            row.styles = extend(table.styles, isAlternate ? themes[settings.theme].alternateRow : {}, isAlternate ? settings.alternateRowStyles : {});
            columns.forEach(function (column) {
                var cell = new Cell();
                cell.raw = rawRow[column.key];
                cell.styles = extend(row.styles, column.styles);
                cell.text = '' + column.parse(cell, {column: column, row: headerRow, settings: settings});
                cell.contentWidth = cell.styles.padding * 2 + getStringWidth(cell.text, cell.styles);
                row.cells[column.key] = cell;
                settings.createdCell(cell, {column: column, row: row, settings: settings});
            });
            rows.push(row);
        });

        // Column and table content width
        var tableContentWidth = 0;
        columns.forEach(function (column) {
            column.contentWidth = headerRow.cells[column.key].contentWidth;
            rows.forEach(function (row) {
                var cellWidth = row.cells[column.key].contentWidth;
                if (cellWidth > column.contentWidth) {
                    column.contentWidth = cellWidth;
                }
            });
            column.width = column.contentWidth;
            tableContentWidth += column.contentWidth;
        });

        // Actual width
        if (settings.tableWidth !== 'wrap') {

            var tableWidth = doc.internal.pageSize.width - settings.margins.left - settings.margins.right;
            if (settings.tableWidth !== 'auto') {
                // If not auto or wrap it should be a number
                tableWidth = settings.tableWidth;
            }

            // Figure out dynamic columns
            var fairPart = tableWidth / columns.length;
            var flexibleColumns = [];
            var flexibleWidth = tableWidth;
            columns.forEach(function (column) {
                if (column.widthSetting === 'auto' && column.contentWidth > fairPart) {
                    flexibleColumns.push(column);
                } else {
                    flexibleWidth -= column.contentWidth;
                }
            });

            // First increase or decrease the column by as much as needed
            var flexiblePart = flexibleWidth / flexibleColumns.length;
            flexibleColumns.forEach(function (column, i) {
                var newWidth = column.contentWidth - flexiblePart;
                if (newWidth < fairPart) {
                    flexibleColumns.slice(i, 1);
                    column.width = fairPart;
                    flexiblePart += fairPart - newWidth / flexibleColumns.length;
                } else {
                    column.width = newWidth;
                }
            });
        }

        // Row height, table height and text overflow
        table.height = 0;
        var all = rows.concat(headerRow);
        all.forEach(function (row, i) {
            var lineBreakCount = 0;
            columns.forEach(function (col) {
                var cell = row.cells[col.key];
                applyStyles(cell.styles);
                var textSpace = col.width - cell.styles.padding * 2;
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
                    console.error("Unrecognized overflow value: " + cell.styles.overflow);
                }
                cell.textWidth = getStringWidth(cell.text, cell.styles);
            });
            row.height = row.styles.rowHeight + lineBreakCount * row.styles.fontSize * FONT_ROW_RATIO;
            table.height += row.height;
        });
    }

    function printHeader() {
        columns.forEach(function (col, i) {
            drawCell(headerRow.cells[col.key], col, headerRow, -1);
        });

        cursor.y += headerRow.height;
        cursor.x = settings.margins.left;
    }

    function printRows() {
        rows.forEach(function (row, i) {
            columns.forEach(function (col) {
                drawCell(row.cells[col.key], col, row, i);
            });

            cursor.y += row.height;
            cursor.x = settings.margins.left;

            // Add a new page if cursor is at the end of page
            var newPage = rows[i + 1] && (cursor.y + rows[i + 1].height + settings.margins.bottom) >= doc.internal.pageSize.height;
            if (newPage) {
                settings.renderFooter(doc, cursor, pageCount, settings);
                doc.addPage();
                cursor = {x: settings.margins.left, y: settings.margins.top};
                pageCount++;
                settings.renderHeader(doc, pageCount, settings);
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

        cell.rect = {x: cursor.x, y: cursor.y, width: column.width, height: row.height};
        cell.textPos.y = cursor.y + row.styles.rowHeight / 2 + cell.styles.fontSize / 2;
        cell.textPos.y -= 2; // Looks more centered two pt down
        if (cell.styles.textAlign === 'right') {
            cell.textPos.x = cursor.x + cell.rect.width - cell.textWidth - cell.styles.padding;
        } else if(cell.styles.textAlign === 'center') {
            cell.textPos.x = cursor.x + cell.rect.width / 2 - cell.textWidth / 2;
        } else {
            cell.textPos.x = cursor.x + cell.styles.padding;
        }

        var data = {
            settings: settings,
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

        cursor.x += cell.rect.width;
    }

    /**
     * Ellipsize the text to fit in the width
     */
    function ellipsize(text, width, styles, ellipsizeStr) {
        ellipsizeStr = typeof  ellipsizeStr !== 'undefined' ? ellipsizeStr : '...';

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
        return doc.getStringUnitWidth(text) * styles.fontSize;
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
    this.rows = [];
    this.columns = [];
    this.headerRow = null;
    this.cursor = {x: 0, y: 0};
    this.pageCount = 1;
    this.settings = {};
    this.styles = {}
};

var Row = function (raw) {
    this.raw = raw;
    this.styles = {};
    this.cells = {};
    this.height = -1;
};

var Cell = function (raw) {
    this.raw = raw;
    this.styles = {};
    this.text = '';
    this.textWidth = -1;
    this.contentWidth = -1;
    this.rect = {};
    this.textPos = {};
};

var Column = function (id) {
    this.key = id;
    this.id = id;
    this.styles = {};
    this.contentWidth = -1;
    this.width = -1;
    this.parse = function (cell, data) {
        // Stringify 0 and false, but not undefined
        return typeof cell.raw !== 'undefined' ? '' + cell.raw : '';
    };
    this.widthSetting = 'auto';
};