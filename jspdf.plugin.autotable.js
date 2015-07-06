/**
 * jsPDF AutoTable plugin
 * Copyright (c) 2014 Simon Bengtsson, https://github.com/someatoms/jsPDF-AutoTable
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function (API) {
    'use strict';

    var MIN_COLUMN_WIDTH = 25;
    var FONT_ROW_RATIO = 1.25;

    var doc, cursor, pageCount = 1, settings, headerRow, columns, rows;

    var defaultStyles = {
        padding: 5,
        fontSize: 10,
        lineColor: 200,
        lineWidth: 0.1,
        fontStyle: 'normal',
        rowHeight: 20,
        overflow: 'ellipsize', // 'visible', 'hidden', ellipsize or linebreak
        fillColor: 255,
        textColor: 20,
        fillStyle: 'F', // 'S', 'F' or 'DF' (stroke, fill or fill then stroke)
        headerStyles: {},
        alternateRowStyles: {}
    };

    var themes = {
        'simple': {
            fillColor: 255,
            textColor: 80,
            fontStyle: 'normal',
            fillStyle: 'F',
            headerStyles: {
                textColor: 255,
                fillColor: [41, 128, 185],
                rowHeight: 25,
                fontStyle: 'bold'
            },
            alternateRowStyles: {fillColor: 245}
        },
        'pro': {
            fillColor: 255,
            textColor: 80,
            fontStyle: 'normal',
            fillStyle: 'DF',
            headerStyles: {
                textColor: 255,
                fillColor: [26, 188, 156],
                rowHeight: 25,
                fillStyle: 'F',
                fontStyle: 'bold'
            },
            alternateRowStyles: {}
        },
        'plain': {headerStyles: {fontStyle: 'bold'}}
    };

    // See README.md or examples for documentation of the options
    // return a new instance every time to avoid references issues
    var defaultOptions = function () {
        return {
            theme: 'simple', // 'simple', 'pro' or 'none'
            styles: {},
            renderHeader: function (doc, pageNumber, settings) {
            },
            renderFooter: function (doc, lastCellPos, pageNumber, settings) {
            },
            margins: {right: 40, left: 40, top: 50, bottom: 40},
            startY: false,
            overflowColumns: false, // Specify which columns that gets subjected to the overflow method chosen. false indicates all
            avoidPageSplit: false,
            autoWidth: true,
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
        doc = this;

        var userStyles = {
            fontSize: doc.internal.getFontSize(),
            fontStyle: doc.internal.getFont().fontStyle
        };

        settings = initOptions(options || {});
        var styles = extend(defaultStyles, themes[settings.theme], settings.styles);

        pageCount = 1;
        headerRow = undefined;
        columns = [];
        rows = [];

        initData(rawColumns, rawRows);

        cursor = {
            x: settings.margins.left,
            y: settings.startY === false ? settings.margins.top : settings.startY
        };

        // Avoid page break
        var tableHeight = settings.margins.bottom + settings.margins.top + styles.rowHeight * (rows.length + 1) + 5 + settings.startY;
        if (settings.startY !== false && settings.avoidPageSplit && tableHeight > doc.internal.pageSize.height) {
            pageCount++;
            doc.addPage();
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
            throw new Error("No AutoTable has been drawn and therefore autoTableEndPosY can be called");
        }
        return cursor.y;
    };

    /**
     * @deprecated Use autoTableEndPosY()
     */
    API.autoTableEndPos = function () {
        return cursor;
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
            settings.autoWidth = settings.extendWidth;
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
        headerRow.styles = extend(defaultStyles, settings.styles, themes[settings.theme], themes[settings.theme].headerStyles, settings.styles.headerStyles);
        rawHeaders.forEach(function (value, key) {
            var raw = typeof value === 'object' ? value.title : value;
            if (typeof value === 'object') key = value.key;

            var cell = new Cell(raw);
            cell.styles = headerRow.styles;
            cell.textWidth = getStringWidth(cell.text, cell.styles);
            cell.contentWidth = cell.styles.padding * 2 + cell.textWidth;
            headerRow.cells[key] = cell;

            var col = new Column(key);
            columns.push(col);
        });

        // Rows
        rawRows.forEach(function (rawRow) {
            var row = new Row(rawRow);
            row.styles = extend(defaultStyles, themes[settings.theme], settings.styles);
            columns.forEach(function (column) {
                var cell = new Cell(rawRow[column.key]);
                cell.styles = row.styles;
                cell.textWidth = getStringWidth(cell.text, cell.styles);
                cell.contentWidth = cell.styles.padding * 2 + cell.textWidth;
                row.cells[column.key] = cell;
            });
            rows.push(row);
        });

        // Optimal width
        var dynamicColumns = [];
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
            if (settings.overflowColumns === false ||
                settings.overflowColumns.indexOf(column.key) !== -1) {
                dynamicColumns.push(column);
            }
        });

        // Actual width
        if (settings.autoWidth) {
            var spaceDiff = doc.internal.pageSize.width - tableContentWidth - settings.margins.left - settings.margins.right;
            var i = 0;
            var diffPart = 0;
            while (i < dynamicColumns.length) {
                var col = dynamicColumns[i];
                diffPart = spaceDiff / dynamicColumns.length;
                if (col.width + diffPart < MIN_COLUMN_WIDTH) {
                    dynamicColumns.splice(i, 1);
                    i = 0;
                } else {
                    i++;
                }
            }
            dynamicColumns.forEach(function (col) {
                col.width = col.width + diffPart;
            });
        }

        // Row height and text overflow
        var all = rows.concat(headerRow);
        all.forEach(function (row, i) {
            var lineBreakCount = 0;
            columns.forEach(function (col) {
                var cell = row.cells[col.key];
                applyStyles(cell.styles, i);
                var textWidth = col.width - cell.styles.padding * 2;
                if (cell.styles.overflow === 'linebreak') {
                    // Add one pt to textWidth to fix rounding error
                    cell.text = doc.splitTextToSize(cell.text, textWidth + 1, {fontSize: cell.styles.fontSize});
                    var count = cell.text.length - 1;
                    if (count > lineBreakCount) {
                        lineBreakCount = count;
                    }
                } else if (cell.styles.overflow === 'ellipsize') {
                    cell.text = ellipsize(cell.text, textWidth, cell.styles);
                } else if (cell.styles.overflow === 'visible') {
                    // Do nothing
                } else if (cell.styles.overflow === 'hidden') {
                    console.error('Overflow hidden not supported yet, pull request welcome!');
                } else if (typeof cell.styles.overflow === 'function') {
                    cell.text = cell.styles.overflow(cell.text, textWidth);
                } else {
                    console.error("Unrecognized overflow value: " + cell.styles.overflow);
                }
            });
            row.height = row.styles.rowHeight + lineBreakCount * row.styles.fontSize * FONT_ROW_RATIO;
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

    function applyStyles(styles, rowIndex) {
        var arr = [
            {func: doc.setFillColor, value: styles.fillColor},
            {func: doc.setTextColor, value: styles.textColor},
            {func: doc.setFontStyle, value: styles.fontStyle},
            {func: doc.setDrawColor, value: styles.lineColor},
            {func: doc.setLineWidth, value: styles.lineWidth},
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
        if (rowIndex !== -1 && rowIndex % 2 !== 0 && styles.alternateRowStyles) {
            applyStyles(styles.alternateRowStyles);
        }
    }

    function drawCell(cell, column, row, rowIndex) {
        applyStyles(cell.styles, rowIndex);

        cell.rect = {x: cursor.x, y: cursor.y, width: column.width, height: row.height};
        cell.textPos.y = cursor.y + row.styles.rowHeight / 2 + cell.styles.fontSize / 2;
        cell.textPos.y -= 2; // Looks more centered two pt down
        cell.textPos.x = cursor.x + cell.styles.padding;

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
    function ellipsize(text, width, styles) {
        if (width >= getStringWidth(text, styles)) {
            return text;
        }
        while (width < getStringWidth(text + '...', styles)) {
            if (text.length < 2) {
                break;
            }
            text = text.substring(0, text.length - 1);
        }
        return text.trim() + '...';
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
                    extended[prop] = options[prop];
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
};

var Row = function (raw) {
    this.raw = raw;
    this.styles = {};
    this.cells = {};
};

var Cell = function (raw, textWidth, contentWidth) {
    this.raw = raw;
    this.styles = {};
    this.text = typeof raw !== 'undefined' ? '' + raw : ''; // Stringify 0, false, undefined etc
    this.textWidth = textWidth;
    this.contentWidth = contentWidth;
    this.rect = {};
    this.textPos = {};
};

var Column = function (key) {
    this.key = key;
    this.styles = {};
    this.contentWidth = 0;
    this.width = 0;
};