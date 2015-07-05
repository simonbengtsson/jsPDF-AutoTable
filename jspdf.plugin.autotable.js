/**
 * jsPDF AutoTable plugin
 * Copyright (c) 2014 Simon Bengtsson, https://github.com/someatoms/jsPDF-AutoTable
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function (API) {
    'use strict';

    // On every new jsPDF object, clear variables
    API.events.push(['initialized', function () {
        doc = undefined;
        cellPos = undefined;
        pageCount = 1;
        settings = undefined;
        headerRow = undefined;
        columns = [];
        rows = [];
    }], false);

    var MIN_COLUMN_WIDTH = 25;
    var FONT_ROW_RATIO = 1.25;

    var doc, cellPos, pageCount = 1, settings, headerRow, columns, rows;

    // See README.md or examples for documentation of the options
    // return a new instance every time to avoid references issues
    var defaultOptions = {
        padding: 5,
        fontSize: 10,
        lineHeight: 20,
        renderHeader: function (doc, pageNumber, settings) {
        },
        renderFooter: function (doc, lastCellPos, pageNumber, settings) {
        },
        renderHeaderCell: function (x, y, width, height, key, value, settings) {
            doc.setFillColor(52, 73, 94); // Asphalt
            doc.setTextColor(255, 255, 255);
            doc.setFontStyle('bold');
            doc.rect(x, y, width, height, 'F');
            y += settings.lineHeight / 2 + API.autoTableTextHeight() / 2;
            doc.text(value, x + settings.padding, y);
        },
        renderCell: function (x, y, width, height, key, value, row, settings) {
            doc.setFillColor(row % 2 === 0 ? 245 : 255);
            doc.setTextColor(50);
            doc.rect(x, y, width, height, 'F');
            y += settings.lineHeight / 2 + API.autoTableTextHeight() / 2 - 2.5;
            doc.text(value, x + settings.padding, y);
        },
        margins: {right: 40, left: 40, top: 50, bottom: 40},
        startY: false,
        overflow: 'ellipsize', // false, ellipsize or linebreak (false passes the raw text to renderCell)
        overflowColumns: false, // Specify which colums that gets subjected to the overflow method chosen. false indicates all
        avoidPageSplit: false,
        extendWidth: true
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
        settings = initOptions(options || {});

        initData(rawColumns, rawRows);

        cellPos = {
            x: settings.margins.left,
            y: settings.startY === false ? settings.margins.top : settings.startY
        };

        // Avoid page break
        var tableHeight = settings.margins.bottom + settings.margins.top + settings.lineHeight * (rows.length + 1) + 5 + settings.startY;
        if (settings.startY !== false && settings.avoidPageSplit && tableHeight > doc.internal.pageSize.height) {
            pageCount++;
            doc.addPage();
            cellPos.y = settings.margins.top;
        }

        var userFontSize = doc.internal.getFontSize();

        settings.renderHeader(doc, pageCount, settings);
        printHeader();
        printRows();
        settings.renderFooter(doc, cellPos, pageCount, settings);

        doc.setFontSize(userFontSize);

        return this;
    };

    /**
     * Returns the Y position of the last drawn cell
     * @returns int
     */
    API.autoTableEndPosY = function () {
        if (typeof cellPos === 'undefined' || typeof cellPos.y === 'undefined') {
            throw new Error("No AutoTable has been drawn and therefore autoTableEndPosY can be called");
        }
        return cellPos.y;
    };

    /**
     * @deprecated Use autoTableEndPosY()
     */
    API.autoTableEndPos = function () {
        return cellPos;
    };

    /**
     * Parses an html table
     *
     * @param table Html table element
     * @param indexBased Boolean flag if result should be returned as seperate cols and data
     * @returns []|{} Array of objects with object keys as headers or based on indexes if indexBased is set to true
     */
    API.autoTableHtmlToJson = function (table, indexBased) {
        var data = [], headers = {}, header = table.rows[0], i, tableRow, rowData, j;
        if (indexBased) {
            headers = [];
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
            return {columns: headers, data: data};
        } else {
            for (i = 0; i < header.cells.length; i++) {
                headers[i] = header.cells[i] ? header.cells[i].textContent : '';
            }

            for (i = 1; i < table.rows.length; i++) {
                tableRow = table.rows[i];
                rowData = {};
                for (j = 0; j < header.cells.length; j++) {
                    rowData[headers[j]] = tableRow.cells[j] ? tableRow.cells[j].textContent : '';
                }
                data.push(rowData);
            }

            return data;
        }
    };

    /**
     * Basically the same as getLineHeight() in 1.0+ versions of jsPDF, however
     * added here for backwards compatibility with version 0.9
     *
     * Export it to make it available in drawCell and drawHeaderCell
     */
    API.autoTableTextHeight = function () {
        // The value 1.15 comes from from the jsPDF source code and looks about right
        return doc.internal.getFontSize() * 1.15;
    };

    function initOptions(raw) {
        var settings = extend(defaultOptions, raw);
        doc.setFontSize(settings.fontSize);

        // Backwards compatibility
        if (settings.margins.horizontal !== undefined) {
            settings.margins.left = settings.margins.horizontal;
            settings.margins.right = settings.margins.horizontal;
        } else {
            settings.margins.horizontal = settings.margins.left;
        }
        return settings;
    }

    /**
     * Create models from input data
     */
    function initData(rawHeaders, rawRows) {
        // Header row and columns
        headerRow = new Row(rawHeaders);
        rawHeaders.forEach(function (value, key) {
            var raw = typeof value === 'object' ? value.title : value;
            if (typeof value === 'object') key = value.key;

            var cell = new Cell(raw);
            cell.textWidth = doc.getStringUnitWidth(cell.text) * settings.fontSize;
            cell.contentWidth = settings.padding * 2 + cell.textWidth;
            headerRow.cells[key] = cell;

            var col = new Column(rawHeaders[key], key);
            columns.push(col);
        });

        // Rows
        rawRows.forEach(function (rawRow) {
            var row = new Row(rawRow);
            columns.forEach(function (column) {
                var cell = new Cell(rawRow[column.key]);
                cell.textWidth = doc.getStringUnitWidth(cell.text) * settings.fontSize;
                cell.contentWidth = settings.padding * 2 + cell.textWidth;
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
            tableContentWidth += column.contentWidth;
            if (settings.overflowColumns === false ||
                settings.overflowColumns.indexOf(column.key) !== -1) {
                dynamicColumns.push(column);
            }
        });

        // Actual width
        if (settings.extendWidth) {
            var spaceDiff = doc.internal.pageSize.width - tableContentWidth - settings.margins.left - settings.margins.right;
            var diffPart = spaceDiff / dynamicColumns.length;
            dynamicColumns.forEach(function (col) {
                col.width = col.contentWidth + diffPart;
            });
        }

        // Row height and text overflow
        var all = rows.concat(headerRow);
        all.forEach(function (row) {
            var lineBreakCount = 0;
            columns.forEach(function (col) {
                var cell = row.cells[col.key];
                var textWidth = col.width - settings.padding * 2;
                if (settings.overflow === 'linebreak') {
                    cell.text = doc.splitTextToSize(cell.text, textWidth);
                    if (cell.text.length > lineBreakCount) {
                        lineBreakCount = cell.text.length;
                    }
                } else if (settings.overflow === 'ellipsize') {
                    cell.text = ellipsize(cell.text, textWidth);
                } else if (typeof settings.overflow === 'function') {
                    cell.text = settings.overflow(cell.text, textWidth);
                } else {
                    console.error("Unrecognized overflow value: " + settings.overflow);
                }
            });
            row.height = settings.lineHeight + lineBreakCount + API.autoTableTextHeight();
        });
    }

    function printHeader() {
        columns.forEach(function (col, i) {
            var cell = headerRow.cells[col.key];
            cell.styles = {fillColor: 220, textColor: [0, 0, 255], fontSize: 12, fontStyle: 'normal'};
            drawCell(cell, col, headerRow, i);
        });

        cellPos.y += 20;
        cellPos.x = settings.margins.left;
    }

    function applyStyles(styles, rowIndex) {
        var arr = [
            {func: doc.setFillColor, value: styles.fillColor},
            {func: doc.setTextColor, value: styles.textColor},
            {func: doc.setFontStyle, value: styles.fontStyle},
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
        if (typeof rowIndex !== 'undefined' && rowIndex % 2 === 0 && styles.alternateRow) {
            applyStyles(styles.alternateRow || {});
        }
    }

    function drawCell(cell, column, row, rowIndex) {
        applyStyles(cell.styles, rowIndex);
        console.log(cellPos, cell.contentWidth, row.height);
        doc.rect(cellPos.x, cellPos.y, cell.contentWidth, row.height, 'F');
        var y = cellPos.y + settings.lineHeight / 2 + API.autoTableTextHeight() / 2;
        y -= 2; // Offset
        doc.text(cell.text, cellPos.x + settings.padding, y);
        cellPos.x += cell.contentWidth;
    }

    function printRows() {
        rows.forEach(function (row, i) {
            // Render the cell
            columns.forEach(function (col) {
                var cell = row.cells[col.key];
                cell.styles = {fillColor: '9', textColor: 9, fontSize: 12, fontStyle: 'normal'};
                drawCell(cell, col, row, i);
            });

            // Add a new page if cellPos is at the end of page
            var newPage = (cellPos.y + settings.margins.bottom) >= doc.internal.pageSize.height;
            if (newPage) {
                settings.renderFooter(doc, cellPos, pageCount, settings);
                doc.addPage();
                cellPos = {x: settings.margins.left, y: settings.margins.top};
                pageCount++;
                settings.renderHeader(doc, pageCount, settings);
                printHeader();
            } else {
                cellPos.y += row.height;
                cellPos.x = settings.margins.left;
            }
        });
    }

    /**
     * Ellipsize the text to fit in the width
     * @param width
     * @param text
     */
    function ellipsize(text, width) {
        if (width >= getStringWidth(text)) {
            return text;
        }
        while (width < getStringWidth(text + "...")) {
            if (text.length < 2) {
                break;
            }
            text = text.substring(0, text.length - 1);
        }
        text += "...";
        return text;
    }

    function getStringWidth(txt, isBold) {
        if (isBold) {
            doc.setFontStyle('bold');
        }
        var strWidth = doc.getStringUnitWidth(txt) * doc.internal.getFontSize();
        if (isBold) {
            doc.setFontStyle('normal');
        }
        return strWidth;
    }

    function extend(defaults, options) {
        var extended = {};
        var prop;
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = defaults[prop];
            }
        }
        for (prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, prop)) {
                extended[prop] = options[prop];
            }
        }
        return extended;
    }

})(jsPDF.API);

var Table = function () {
    this.height = 0;
    this.width = 0;
};

var Row = function (raw) {
    this.raw = raw;
    this.cells = {};
};

var Cell = function (raw, textWidth, contentWidth) {
    this.raw = raw;
    // 0, false, undefined etc gets wrong format unless converted to strings
    this.text = typeof raw !== 'undefined' ? '' + raw : '';
    this.textWidth = textWidth;
    this.contentWidth = contentWidth;
};

var Column = function (raw, key) {
    this.raw = raw;
    this.key = key;
    this.contentWidth = 0;
    this.width = 0;
};