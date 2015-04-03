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

    var doc, cellPos, pageCount = 1;

    var options = {
        padding: 5,
        fontSize: 10,
        lineHeight: 20,
        renderCell: function (x, y, w, h, txt, fillColor, options) {
            txt = '' + txt;
            doc.setFillColor.apply(this, fillColor);
            doc.rect(x, y, w, h, 'F');
            doc.text('' + txt, x + options.padding, y + options.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5);
        },
        margins: {horizontal: 40, top: 50, bottom: 40},
        startY: 50,
        extendWidth: true
    };

    /**
     * Create a table from a set of rows and columns.
     *
     * Default options:
     *
     * <pre>
     var options = {
        padding: 3,
        fontSize: 12,
        lineHeight: 20,
        renderCell: function (x, y, w, h, txt, fillColor, options) {
            doc.setFillColor.apply(this, fillColor);
            doc.rect(x, y, w, h, 'F');
            doc.text(txt, x + options.padding, y + doc.internal.getLineHeight());
        },
        margins: { horizontal: 40, top: 50, bottom: 40 },
        extendWidth: true
     };
     * </pre>
     *
     * @param {Object[]|String[]} columns Either as an array of objects or array of strings
     * @param {Object[][]|String[][]} data Either as an array of objects or array of strings
     * @param {Object} [options={}] Options that will override the default ones (above)
     *
     * @param {Object} [options.autoWidth=true] If table should span entire page width (otherwise resorts to min-width)
     */
    API.autoTable = function (columns, data, options) {
        doc = this;

        var userFontSize = doc.internal.getFontSize();

        initData({columns: columns, data: data});
        initOptions(options || {});

        var columnWidths = calculateColumnWidths(data, columns);
        printHeader(columns, columnWidths);
        printRows(columns, data, columnWidths);

        doc.setFontSize(userFontSize);

        return this;
    };

    API.autoTableEndPos = function() {
        return cellPos;
    };

    function initData(params) {
        // Transform from String[] to Object[]
        if (typeof params.columns[0] === 'string') {
            params.data.forEach(function (row, i) {
                var obj = {};
                for (var j = 0; j < row.length; j++) {
                    obj[j] = params.data[i][j];
                }
                params.data[i] = obj;
            });
            params.columns.forEach(function (title, i) {
                params.columns[i] = {title: title, key: i};
            });
        }
    }

    function initOptions(raw) {
        Object.keys(raw).forEach(function (key) {
            options[key] = raw[key];
        });
        doc.setFontSize(options.fontSize);
        cellPos = {x: options.margins.horizontal, y: options.startY};
    }

    function calculateColumnWidths(rows, columns) {
        var widths = {};

        // Optimal widths
        var totalWidth = 0;
        columns.forEach(function (header) {
            var widest = getStringWidth(header.title);
            rows.forEach(function (row) {
                var w = getStringWidth(row[header.key]);
                if (w > widest) {
                    widest = w;
                }
            });
            widths[header.key] = widest;
            totalWidth += widest;
        });

        var paddingAndMargin = options.padding * 2 * columns.length + options.margins.horizontal * 2;
        var spaceDiff = doc.internal.pageSize.width - totalWidth - paddingAndMargin;

        var keys = Object.keys(widths);
        if (spaceDiff < 0) {
            // Shrink columns
            var shrinkableColumns = [];
            var shrinkableColumnWidths = 0;
            keys.forEach(function (key) {
                if (widths[key] > MIN_COLUMN_WIDTH) {
                    shrinkableColumns.push(key);
                    shrinkableColumnWidths += widths[key];
                }
            });
            shrinkableColumns.forEach(function (key) {
                widths[key] += spaceDiff *  (widths[key] / shrinkableColumnWidths);
            });
        } else if (spaceDiff > 0 && options.extendWidth) {
            // Fill page horizontally
            keys.forEach(function (key) {
                widths[key] += spaceDiff / keys.length;
            });
        }

        return widths;
    }

    function printHeader(headers, columnWidths) {
        if (!headers) return; //
        doc.setFontStyle('bold');
        doc.setTextColor(255, 255, 255);
        headers.forEach(function (header) {
            var width = columnWidths[header.key] + options.padding * 2;
            var color = [52, 73, 94]; // asphalt
            var title = ellipsize(columnWidths[header.key], header.title);
            options.renderCell(cellPos.x, cellPos.y, width, options.lineHeight + 5, title, color, options);
            cellPos.x = cellPos.x + columnWidths[header.key] + options.padding * 2;
        });
        doc.setTextColor(70, 70, 70);
        doc.setFontStyle('normal');

        cellPos.y += options.lineHeight;
        cellPos.x = options.margins.horizontal;
    }

    function printRows(headers, rows, columnWidths) {
        var odd = false;
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            headers.forEach(function (header) {
                var color = (odd ? 245 : 255);
                var title = ellipsize(columnWidths[header.key], row[header.key]);
                var width = columnWidths[header.key] + options.padding * 2;
                options.renderCell(cellPos.x, cellPos.y, width, options.lineHeight, title, [color], options);
                cellPos.x = cellPos.x + columnWidths[header.key] + options.padding * 2;
            });
            odd = !odd;

            var newPage = (cellPos.y + options.margins.bottom + options.lineHeight * 2) >= doc.internal.pageSize.height;
            if (newPage) {
                doc.addPage();
                cellPos = {x: options.margins.horizontal, y: options.margins.top};
                pageCount++;
                printHeader(headers, columnWidths);
            } else {
                cellPos.y += options.lineHeight;
                cellPos.x = options.margins.horizontal;
            }
        }
    }

    /**
     * Ellipize the text to fit in the width
     * @param width
     * @param text
     */
    function ellipsize(width, text) {
        if(width >= getStringWidth(text)) {
            return text;
        }
        while (width < getStringWidth(text + "...")) {
            if(text.length < 2) {
                break;
            }
            text = text.substring(0, text.length - 1);
        }
        text += "...";
        return text;
    }

    function getStringWidth(txt) {
        return doc.getStringUnitWidth(txt) * doc.internal.getFontSize();
    }

})(jsPDF.API);