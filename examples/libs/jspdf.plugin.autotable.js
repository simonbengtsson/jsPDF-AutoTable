/*!
 * jsPDF AutoTable plugin v2.1.0
 * Copyright (c) 2014 Simon Bengtsson, https://github.com/simonbengtsson/jsPDF-AutoTable 
 * 
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 * 
 * */if (typeof window === 'object') window.jspdfAutoTableVersion = '2.1.0';/*
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("jspdf"));
	else if(typeof define === 'function' && define.amd)
		define(["jspdf"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("jspdf")) : factory(root["jsPDF"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function(__WEBPACK_EXTERNAL_MODULE_7__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

"use strict";

/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
exports.FONT_ROW_RATIO = 1.15;
/**
 * Styles for the themes (overriding the default styles)
 */
exports.getTheme = function (table, name) {
    var scaleFactor = Config.scaleFactor(table);
    var themes = {
        'striped': {
            table: { fillColor: 255, textColor: 80, fontStyle: 'normal' },
            header: { textColor: 255, fillColor: [41, 128, 185], rowHeight: 23 / scaleFactor, fontStyle: 'bold' },
            body: {},
            alternateRow: { fillColor: 245 }
        },
        'grid': {
            table: { fillColor: 255, textColor: 80, fontStyle: 'normal', lineWidth: 0.1 },
            header: { textColor: 255, fillColor: [26, 188, 156], rowHeight: 23 / scaleFactor, fontStyle: 'bold', lineWidth: 0 },
            body: {},
            alternateRow: {}
        },
        'plain': {
            header: { fontStyle: 'bold' }
        }
    };
    return themes[name];
};
function getDefaults(doc) {
    var scaleFactor = Config.scaleFactor(doc);
    return {
        // Content
        columns: null,
        head: null,
        body: null,
        foot: null,
        fromHtml: null,
        ignoreHiddenHtml: true,
        // Properties
        startY: null,
        margin: 40 / scaleFactor,
        tableWidth: 'auto',
        showHead: 'firstPage',
        showFoot: 'lastPage',
        tableId: 0,
        emptyMessage: 'No data available',
        // Styling
        theme: 'striped',
        useCssStyles: false,
        styles: {},
        headerStyles: {},
        bodyStyles: {},
        alternateRowStyles: {},
        columnStyles: {},
        // Event handlers
        inputParsed: function (data) { },
        onCellDraw: function (data) { },
        onRowDraw: function (data) { },
        cellAdded: function (data) { },
        rowAdded: function (data) { },
        pageAdded: function (data) { }
    };
}
exports.getDefaults = getDefaults;
// Base style for all themes
function defaultStyles(table) {
    var scaleFactor = Config.scaleFactor(table);
    return {
        font: "helvetica",
        lineColor: 200,
        fontStyle: 'normal',
        overflow: 'linebreak',
        fillColor: false,
        textColor: 20,
        halign: 'left',
        valign: 'top',
        fontSize: 10,
        cellPadding: 5 / scaleFactor,
        lineWidth: 0 / scaleFactor,
        rowHeight: 20 / scaleFactor,
        columnWidth: 'auto'
    };
}
var Config = (function () {
    function Config() {
    }
    Config.pageSize = function (table) {
        return table.doc.internal.pageSize;
    };
    Config.scaleFactor = function (doc) {
        return doc.internal.scaleFactor;
    };
    Config.hooksData = function (table, additionalData) {
        if (additionalData === void 0) { additionalData = {}; }
        return Object.assign({
            pageCount: table.pageCount,
            settings: table.settings,
            table: table,
            doc: table.doc,
            cursor: table.cursor
        }, additionalData || {});
    };
    Config.marginOrPadding = function (doc, value, defaultVal) {
        var newValue = {};
        ['top', 'right', 'bottom', 'left'].forEach(function (side, i) {
            newValue[side] = defaultVal / Config.scaleFactor(doc);
            if (typeof value === 'number') {
                newValue[side] = value;
            }
            else if (Array.isArray(value) && typeof value[i] === 'number') {
                newValue[side] = value[i];
            }
            else if (typeof value === 'object') {
                if (typeof value[side] === 'number') {
                    newValue[side] = value[side];
                }
                else if ((side === 'right' || side === 'left') && typeof value['horizontal'] === 'number') {
                    newValue[side] = value['horizontal'];
                }
                else if ((side === 'top' || side === 'bottom') && typeof value['vertical'] === 'number') {
                    newValue[side] = value['vertical'];
                }
            }
        });
        return newValue;
    };
    Config.styles = function (table, styles) {
        var defStyles = defaultStyles(table);
        var newStyles = (_a = Object).assign.apply(_a, [{}, defStyles].concat(styles));
        newStyles.cellPadding = Config.marginOrPadding(table, newStyles.cellPadding, defStyles.cellPadding);
        return newStyles;
        var _a;
    };
    Config.headerStyles = function (table) {
        var theme = exports.getTheme(table, table.settings.theme);
        return Config.styles(table, [theme.table, theme.header, table.settings.styles, table.settings.headerStyles]);
    };
    Config.bodyStyles = function (isAlternateRow, table) {
        var theme = exports.getTheme(table, table.settings.theme);
        var rowStyles = isAlternateRow ? Object.assign({}, theme.alternateRow, table.settings.alternateRowStyles) : {};
        return Config.styles(table, [theme.table, theme.body, table.settings.styles, table.settings.bodyStyles, rowStyles]);
    };
    Config.applyStyles = function (table, styles) {
        var doc = table.doc;
        var styleModifiers = {
            fillColor: doc.setFillColor,
            textColor: doc.setTextColor,
            fontStyle: doc.setFontStyle,
            lineColor: doc.setDrawColor,
            lineWidth: doc.setLineWidth,
            font: doc.setFont,
            fontSize: doc.setFontSize
        };
        Object.keys(styleModifiers).forEach(function (name) {
            var style = styles[name];
            var modifier = styleModifiers[name];
            if (typeof style !== 'undefined') {
                if (Array.isArray(style)) {
                    modifier.apply(this, style);
                }
                else {
                    modifier(style);
                }
            }
        });
    };
    return Config;
}());
exports.Config = Config;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

"use strict";

var config_1 = __webpack_require__(0);
var common_1 = __webpack_require__(2);
function putTable(table) {
    var y = table.settings.startY !== false ? table.settings.startY : table.margin('top');
    table.cursor = { x: table.margin('left'), y: y };
    var pageEndPos = table.cursor.y + table.margin('bottom') + table.headerRow.height;
    pageEndPos += table.settings.avoidPageSplit ? table.height : 0;
    var startOnFirstPage = pageEndPos < config_1.Config.pageSize(table).height;
    // Start drawing the table on the next page if only the headers fit on the current page
    if (!startOnFirstPage) {
        //addContentHooks(false);
        table.doc.addPage();
    }
    if (table.settings.showHeader === true || table.settings.showHeader === 'always') {
        printRow(table, table.headerRow, table.settings.drawHeaderRow, table.settings.drawHeaderCell);
    }
    table.rows.forEach(function (row) {
        printFullRow(table, row, table.settings.drawRow, table.settings.drawCell);
    });
    //addContentHooks();
}
exports.putTable = putTable;
function printFullRow(table, row, drawRowHook, drawCellHook) {
    var remainingRowHeight = 0;
    var remainingTexts = {};
    if (!canFitOnPage(table, row.height)) {
        // Simply move small rows to new page to avoid splitting
        // TODO Improve
        if (row.height < row.heightStyle * 3) {
            common_1.addPage(table);
        }
        else {
            // Modify the row to fit the current page and calculate text and height of partial row
            row.spansMultiplePages = true;
            var pageHeight = table.doc.internal.pageSize.height;
            var maxCellHeight = 0;
            for (var j = 0; j < table.columns.length; j++) {
                var col = table.columns[j];
                var cell = row.cells[col.dataKey];
                var k = config_1.Config.scaleFactor(table);
                var fontHeight = cell.styles.fontSize / k * config_1.FONT_ROW_RATIO;
                var vpadding = 0 / k; // TODO
                var remainingPageSpace = pageHeight - table.cursor.y - table.margin('bottom');
                var remainingLineCount = Math.floor((remainingPageSpace - vpadding) / fontHeight);
                if (Array.isArray(cell.text) && cell.text.length > remainingLineCount) {
                    var remainingLines = cell.text.splice(remainingLineCount, cell.text.length);
                    remainingTexts[col.dataKey] = remainingLines;
                    var rowHeight1 = cell.text.length * fontHeight + vpadding;
                    if (rowHeight1 > maxCellHeight) {
                        maxCellHeight = rowHeight1;
                    }
                    var rowHeight2 = remainingLines.length * fontHeight + vpadding;
                    if (rowHeight2 > remainingRowHeight) {
                        remainingRowHeight = rowHeight2;
                    }
                }
            }
            // Reset row height since text are now removed
            row.height = maxCellHeight;
        }
    }
    printRow(table, row, drawRowHook, drawCellHook);
    // Parts of the row is now printed. Time for adding a new page, prune 
    // the text and start over
    if (Object.keys(remainingTexts).length > 0) {
        for (var j = 0; j < table.columns.length; j++) {
            var col = table.columns[j];
            var cell = row.cells[col.dataKey];
            cell.text = remainingTexts[col.dataKey] || '';
        }
        common_1.addPage(table);
        row.pageCount++;
        row.height = remainingRowHeight;
        printFullRow(table, row, drawRowHook, drawCellHook);
    }
}
exports.printFullRow = printFullRow;
function printRow(table, row, drawRowHook, drawCellHook) {
    row.y = table.cursor.y;
    if (drawRowHook(row, config_1.Config.hooksData(table, { row: row, addPage: common_1.addPage })) === false) {
        return;
    }
    table.cursor.x = table.margin('left');
    for (var i = 0; i < table.columns.length; i++) {
        var column = table.columns[i];
        var cell = row.cells[column.dataKey];
        if (!cell) {
            continue;
        }
        config_1.Config.applyStyles(table, cell.styles);
        cell.x = table.cursor.x;
        cell.y = table.cursor.y;
        cell.height = row.height;
        cell.width = column.width;
        if (cell.styles.valign === 'top') {
            cell.textPos.y = table.cursor.y + cell.styles.cellPadding.top;
        }
        else if (cell.styles.valign === 'bottom') {
            cell.textPos.y = table.cursor.y + row.height - cell.styles.cellPadding.bottom;
        }
        else {
            cell.textPos.y = table.cursor.y + row.height / 2;
        }
        if (cell.styles.halign === 'right') {
            cell.textPos.x = cell.x + cell.width - cell.styles.cellPadding.right;
        }
        else if (cell.styles.halign === 'center') {
            cell.textPos.x = cell.x + cell.width / 2;
        }
        else {
            cell.textPos.x = cell.x + cell.styles.cellPadding.left;
        }
        var data = config_1.Config.hooksData(table, { column: column, row: row, addPage: common_1.addPage });
        if (drawCellHook(cell, data) !== false) {
            var fillStyle = getFillStyle(cell.styles);
            if (fillStyle) {
                table.doc.rect(cell.x, cell.y, cell.width, cell.height, fillStyle);
            }
            table.doc.autoTableText(cell.text, cell.textPos.x, cell.textPos.y, {
                halign: cell.styles.halign,
                valign: cell.styles.valign
            });
        }
        table.cursor.x += cell.width;
    }
    table.cursor.y += row.height;
}
exports.printRow = printRow;
function canFitOnPage(table, rowHeight) {
    var pos = rowHeight + table.cursor.y + table.margin('bottom');
    return pos < config_1.Config.pageSize(table).height;
}
function getFillStyle(styles) {
    var drawLine = styles.lineWidth > 0;
    var drawBackground = styles.fillColor !== false;
    if (drawLine && drawBackground) {
        return 'DF'; // Fill then stroke
    }
    else if (drawLine) {
        return 'S'; // Only stroke (transperant backgorund)
    }
    else if (drawBackground) {
        return 'F'; // Only fill, no stroke
    }
    else {
        return false;
    }
}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

"use strict";

var config_1 = __webpack_require__(0);
var painter_1 = __webpack_require__(1);
function getStringWidth(table, text, styles) {
    var k = config_1.Config.scaleFactor(table);
    var fontSize = styles.fontSize / k;
    config_1.Config.applyStyles(table, styles);
    text = Array.isArray(text) ? text : [text];
    var maxWidth = 0;
    text.forEach(function (line) {
        var width = table.doc.getStringUnitWidth(line);
        if (width > maxWidth) {
            maxWidth = width;
        }
    });
    var precision = 10000 * k;
    maxWidth = Math.floor(maxWidth * precision) / precision;
    return maxWidth * fontSize;
}
exports.getStringWidth = getStringWidth;
/**
 * Ellipsize the text to fit in the width
 */
function ellipsize(table, text, width, styles, ellipsizeStr) {
    if (ellipsizeStr === void 0) { ellipsizeStr = '...'; }
    if (Array.isArray(text)) {
        var value_1 = [];
        text.forEach(function (str, i) {
            value_1[i] = ellipsize(table, str, width, styles, ellipsizeStr);
        });
        return value_1;
    }
    var precision = 10000 * config_1.Config.scaleFactor(table);
    width = Math.ceil(width * precision) / precision;
    if (width >= getStringWidth(table, text, styles)) {
        return text;
    }
    while (width < getStringWidth(table, text + ellipsizeStr, styles)) {
        if (text.length <= 1) {
            break;
        }
        text = text.substring(0, text.length - 1);
    }
    return text.trim() + ellipsizeStr;
}
exports.ellipsize = ellipsize;
/**
 * Adds page footers, calls page content hooks, adds a new page and table headers
 */
function addPage(table) {
    addContentHooks(true);
    table.doc.addPage();
    table.cursor = { x: table.margin('left'), y: table.margin('top') };
    table.pageCount++;
    if (table.settings.showHeader === true || table.settings.showHeader === 'always') {
        painter_1.printRow(table, table.headerRow, table.settings.drawHeaderRow, table.settings.drawHeaderCell);
    }
}
exports.addPage = addPage;
function addContentHooks(table, pageHasTable) {
    if (pageHasTable === void 0) { pageHasTable = true; }
    var data = config_1.Config.hooksData(table, { pageHasTable: pageHasTable });
    table.settings.addPageContent(data);
    //Config.callPageContentHook(data);
}
exports.addContentHooks = addContentHooks;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

"use strict";

var config_1 = __webpack_require__(0);
var common_1 = __webpack_require__(2);
/**
 * Calculate the column widths
 */
function calculateWidths(table) {
    var pageWidth = config_1.Config.pageSize(table).width;
    // Column and table content width
    var fixedWidth = 0;
    var autoWidth = 0;
    var dynamicColumns = [];
    table.columns.forEach(function (column) {
        column.contentWidth = 0;
        table.rows.concat(table.headerRow).forEach(function (row) {
            var cell = row.cells[column.id];
            var cellContentWidth = cell.contentWidth();
            if (cellContentWidth > column.contentWidth) {
                column.contentWidth = cellContentWidth;
            }
        });
        table.contentWidth += column.contentWidth;
        if (typeof column.widthStyle === 'number') {
            column.preferredWidth = column.widthStyle;
            fixedWidth += column.preferredWidth;
            column.width = column.preferredWidth;
        }
        else if (column.widthStyle === 'wrap') {
            column.preferredWidth = column.contentWidth;
            fixedWidth += column.preferredWidth;
            column.width = column.preferredWidth;
        }
        else {
            column.preferredWidth = column.contentWidth;
            autoWidth += column.contentWidth;
            dynamicColumns.push(column);
        }
        table.preferredWidth += column.preferredWidth;
    });
    if (typeof table.settings.tableWidth === 'number') {
        table.width = table.settings.tableWidth;
    }
    else if (table.settings.tableWidth === 'wrap') {
        table.width = table.preferredWidth;
    }
    else {
        table.width = pageWidth - table.margin('left') - table.margin('right');
    }
    distributeWidth(table, dynamicColumns, fixedWidth, autoWidth, 0);
    // Row height, table height and text overflow
    var all = table.rows.concat(table.headerRow);
    all.forEach(function (row) {
        var maxCellHeight = 0;
        table.columns.forEach(function (col) {
            var cell = row.cells[col.dataKey];
            config_1.Config.applyStyles(table, cell.styles);
            var textSpace = col.width - cell.styles.cellPadding.left - cell.styles.cellPadding.right;
            if (cell.styles.overflow === 'linebreak') {
                // Add one pt to textSpace to fix rounding error
                try {
                    cell.text = table.doc.splitTextToSize(cell.text, textSpace + 1, { fontSize: cell.styles.fontSize });
                }
                catch (e) {
                    if (e instanceof TypeError && Array.isArray(cell.text)) {
                        cell.text = table.doc.splitTextToSize(cell.text.join(' '), textSpace + 1, { fontSize: cell.styles.fontSize });
                    }
                    else {
                        throw e;
                    }
                }
            }
            else if (cell.styles.overflow === 'ellipsize') {
                cell.text = common_1.ellipsize(table, cell.text, textSpace, cell.styles);
            }
            else if (cell.styles.overflow === 'visible') {
            }
            else if (cell.styles.overflow === 'hidden') {
                cell.text = common_1.ellipsize(cell.text, textSpace, cell.styles, '');
            }
            else if (typeof cell.styles.overflow === 'function') {
                cell.text = cell.styles.overflow(cell.text, textSpace);
            }
            else {
                console.error("Unrecognized overflow type: " + cell.styles.overflow);
            }
            var k = config_1.Config.scaleFactor(table);
            var lineCount = Array.isArray(cell.text) ? cell.text.length : 1;
            var fontHeight = cell.styles.fontSize / k * config_1.FONT_ROW_RATIO;
            var vpadding = cell.styles.cellPadding.top + cell.styles.cellPadding.bottom;
            var contentHeight = vpadding + fontHeight;
            var vextra = contentHeight > row.heightStyle ? vpadding : row.heightStyle - fontHeight;
            cell.contentHeight = lineCount * fontHeight + vextra;
            if (cell.contentHeight > maxCellHeight) {
                maxCellHeight = cell.contentHeight;
            }
        });
        row.height = maxCellHeight;
        table.height += row.height;
    });
}
exports.calculateWidths = calculateWidths;
function distributeWidth(table, dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth) {
    var extraWidth = table.width - staticWidth - dynamicColumnsContentWidth;
    for (var i = 0; i < dynamicColumns.length; i++) {
        var col = dynamicColumns[i];
        var ratio = col.contentWidth / dynamicColumnsContentWidth;
        // A column turned out to be none dynamic, start over recursively
        var isNoneDynamic = col.contentWidth + extraWidth * ratio < fairWidth;
        if (extraWidth < 0 && isNoneDynamic) {
            dynamicColumns.splice(i, 1);
            dynamicColumnsContentWidth -= col.contentWidth;
            col.width = fairWidth;
            staticWidth += col.width;
            distributeWidth(table, dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth);
            break;
        }
        else {
            col.width = col.contentWidth + extraWidth * ratio;
        }
    }
}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

"use strict";

var models_1 = __webpack_require__(8);
var config_1 = __webpack_require__(0);
/**
 * Create models from the user input
 */
function createModel(doc) {
    var allSettings = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        allSettings[_i - 1] = arguments[_i];
    }
    var settings = parseSettings(doc, allSettings);
    var table = new models_1.Table(doc, settings);
    parseContent(settings, table);
    table.columns.forEach(function (id, index) {
        var colStyles = settings.columnStyles[id] || {};
        var column = new models_1.Column(id, index, colStyles);
        table.columns.push(column);
    });
    section(table, settings, 'head');
    section(table, settings, 'body');
    section(table, settings, 'foot');
    settings.inputParsed(config_1.Config.hooksData(table));
    return table;
}
exports.createModel = createModel;
function section(table, settings, type) {
    settings[type].forEach(function (inputRow, i) {
        var row = new models_1.Row(inputRow, i, type);
        table.columns.forEach(function (column) {
            if (column.id in inputRow) {
                row.addCell(table, inputRow[column.id]);
            }
        });
        table[type].push(row);
    });
    delete settings[type];
}
function parseContent(settings, table) {
    var columnIds = settings.columns;
    var contentProperties = ['head', 'body', 'foot'];
    contentProperties.forEach(function (prop) {
        var section = !Array.isArray(table[prop]) ? table[prop] : [table[prop]];
        section.forEach(function (rawRow, i) {
            var styles = i % 2 === 0 ? settings.bodyStyles : settings.alternateRowStyles;
            var row = new models_1.Row(rawRow, i, styles);
            table.columns.forEach(function (column) {
                row.addCell(table, rawRow[column.id]);
            });
        });
    });
    if (settings.fromHtml && (!settings.head || !settings.foot || !settings.body)) {
    }
    if (!columnIds) {
        table.columns = [];
    }
}
function parseSettings(doc, allSettings) {
    var defaults = config_1.getDefaults(doc);
    // Clone styles one level deeper
    var styles = ['styles', 'headerStyles', 'bodyStyles', 'alternateRowStyles', 'columnStyles'];
    styles.forEach(function (prop) {
        allSettings.forEach(function (s) {
            if (s && s[prop]) {
                defaults[prop] = Object.assign(defaults[prop] || {}, s[prop]);
            }
        });
    });
    // Append event handlers instead of replacing them
    var events = ['inputParsed', 'onCellDraw', 'onRowDraw', 'cellAdded', 'rowAdded', 'pageAdded'];
    var eventHandlers = {};
    events.forEach(function (event) { eventHandlers[event] = []; });
    events.forEach(function (event) {
        allSettings.forEach(function (s) {
            if (s && s[event]) {
                eventHandlers[event].push(s[event]);
                delete s[event];
            }
        });
    });
    var settings = (_a = Object).assign.apply(_a, [defaults].concat(allSettings));
    settings.margin = config_1.Config.marginOrPadding(doc, settings.margin, 40);
    settings.eventHandlers = eventHandlers;
    return settings;
    var _a;
}
exports.parseSettings = parseSettings;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

"use strict";

function parseHtml(input, window, includeHiddenHtml, useCss) {
    if (includeHiddenHtml === void 0) { includeHiddenHtml = false; }
    if (useCss === void 0) { useCss = false; }
    var tableElement;
    if (typeof input === 'string') {
        tableElement = window.document.querySelector(input);
    }
    else {
        tableElement = input;
    }
    var head = parseTableSection(window, tableElement.tHead, includeHiddenHtml, useCss);
    var body = [];
    for (var i = 0; i < tableElement.tBodies.length; i++) {
        body = body.concat(parseTableSection(window, tableElement.tBodies[i], includeHiddenHtml, useCss));
    }
    var foot = parseTableSection(window, tableElement.tFoot, includeHiddenHtml, useCss);
    return { head: head, body: body, foot: foot };
}
exports.parseHtml = parseHtml;
function parseTableSection(window, sectionElement, includeHidden, useCss) {
    var results = [];
    if (!sectionElement) {
        return results;
    }
    for (var i = 0; i < sectionElement.rows.length; i++) {
        var row = sectionElement.rows[i];
        var resultRow = { styles: {}, cells: [] };
        for (var i_1 = 0; i_1 < row.cells.length; i_1++) {
            var cell = row.cells[i_1];
            var style_1 = window.getComputedStyle(cell);
            if (includeHidden || style_1.display !== 'none') {
                var styles = useCss ? parseCss(style_1, ['rowHeight']) : {};
                resultRow.cells.push({ content: cell, rowspan: cell.rowSpan, colspan: cell.colSpan, styles: styles });
            }
        }
        var style = window.getComputedStyle(row);
        if (resultRow.cells.length > 0 && (includeHidden || style.display !== 'none')) {
            resultRow.styles = useCss ? parseCss(style, ['cellPadding', 'lineWidth', 'lineColor']) : {};
            results.push(resultRow);
        }
    }
    return results;
}
function parseCss(style, ignored) {
    if (ignored === void 0) { ignored = []; }
    var result = {};
    function assign(name, value, accepted) {
        if (accepted === void 0) { accepted = []; }
        value = Array.isArray(value) ? value : [value];
        value.forEach(function (val) {
            if ((accepted.length === 0 || accepted.indexOf(val) !== -1) && ignored.indexOf(name) === -1) {
                result[name] = val;
            }
        });
    }
    assign('fillColor', parseColor(style.backgroundColor));
    assign('lineColor', parseColor(style.borderColor));
    assign('fontStyle', [style.fontStyle, style.fontWeight], ['italic', 'bold']);
    assign('textColor', parseColor(style.color));
    assign('halign', style.textAlign, ['left', 'right', 'center']);
    assign('valign', style.verticalAlign, ['middle', 'bottom', 'top']);
    assign('fontSize', parseInt(style.fontSize));
    assign('cellPadding', parsePadding(style.padding));
    assign('lineWidth', parseInt(style.borderWidth));
    assign('rowHeight', parseInt(style.height));
    assign('font', style.fontFamily.toLowerCase());
    return result;
}
function parseColor(cssColor) {
    var rgba = cssColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d*))?\)$/);
    var color = [parseInt(rgba[1]), parseInt(rgba[2]), parseInt(rgba[3])];
    var alpha = parseInt(rgba[4]);
    if (alpha === 0 || isNaN(color[0])) {
        return null;
    }
    return color;
}
function parsePadding(val) {
    var parts = val.split(' ').map(function (n) { return parseInt(n); });
    if (parts.length === 1 && parts[0] > 0) {
        return parts[0];
    }
    else if (parts.length === 2) {
        return [parts[0], parts[1], parts[0], parts[1]];
    }
    else if (parts.length === 3) {
        return [parts[0], parts[1], parts[2], parts[1]];
    }
    else if (parts.length === 4) {
        return parts;
    }
}


/***/ },
/* 6 */
/***/ function(module, exports) {

// Polyfills for array.forEach, array.map, Object.keys() and Array.isArray is included by jspdf
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
if (typeof Object.assign != 'function') {
    Object.assign = function (target, varArgs) {
        'use strict';
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource != null) {
                for (var nextKey in nextSource) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}
// https://github.com/duckinator/innerText-polyfill
if (typeof window === 'object' && (!('innerText' in window.document.createElement('a'))) && ('getSelection' in window)) {
    HTMLElement.prototype.__defineGetter__("innerText", function () {
        var selection = window.getSelection(), ranges = [], str;
        for (var i = 0; i < selection.rangeCount; i++) {
            ranges[i] = selection.getRangeAt(i);
        }
        selection.removeAllRanges();
        selection.selectAllChildren(this);
        str = selection.toString();
        selection.removeAllRanges();
        for (var i = 0; i < ranges.length; i++) {
            selection.addRange(ranges[i]);
        }
        return str;
    });
    HTMLElement.prototype.__defineSetter__("innerText", function (str) {
        this.innerHTML = str.replace(/\n/g, "<br />");
    });
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function (predicate) {
            'use strict';
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            for (var i = 0; i !== length; i++) {
                if (predicate.call(thisArg, this[i], i, list)) {
                    return this[i];
                }
            }
            return undefined;
        }
    });
}


/***/ },
/* 7 */
/***/ function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_7__;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

"use strict";

var Table = (function () {
    function Table(document, settings) {
        this.height = 0;
        this.width = 0;
        this.contentWidth = 0;
        this.preferredWidth = 0;
        this.rows = [];
        this.columns = [];
        this.headerRow = null;
        this.pageCount = 1;
        this.finalY = -1;
        this.settings = settings;
        this.doc = document;
    }
    Table.prototype.margin = function (side) {
        return this.settings.margin[side];
    };
    return Table;
}());
exports.Table = Table;
var Row = (function () {
    function Row(raw, index, styles) {
        this.styles = {};
        this.cells = [];
        this.spansMultiplePages = false;
        this.pageCount = 1;
        this.height = 0;
        this.y = 0;
        this.raw = raw;
        this.index = index;
        this.styles = styles;
    }
    Row.prototype.addCell = function (raw, styles) {
        var cell = new Cell(raw);
        this.cells.push(cell);
        return cell;
    };
    return Row;
}());
exports.Row = Row;
var Cell = (function () {
    function Cell(raw) {
        this.styles = {};
        this.textPos = {};
        this.height = 0;
        this.width = 0;
        this.x = 0;
        this.y = 0;
        this.text = "";
        this.raw = raw;
        if (raw instanceof HTMLElement) {
            this.text = raw.innerText.trim();
        }
        else if (typeof raw === 'object' && 'title' in raw) {
            this.text = raw.title + '';
        }
        else {
            this.text = raw + '';
        }
        // New lines should result in linebreak even if not the
        // linebreak overflow method is chosen
        this.text.split(/\r\n|\r|\n/g);
    }
    Cell.prototype.style = function (name) {
        return this.styles[name];
    };
    return Cell;
}());
exports.Cell = Cell;
var Column = (function () {
    function Column(id, index, styles) {
        this.styles = {};
        this.contentWidth = 0;
        this.preferredWidth = 0;
        this.width = 0;
        this.x = 0;
        this.id = id;
        this.index = index;
        this.styles = styles || {};
        this.widthStyle = styles.widthStyle;
    }
    return Column;
}());
exports.Column = Column;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

"use strict";

var jsPDF = __webpack_require__(7);
var config_1 = __webpack_require__(0);
var painter_1 = __webpack_require__(1);
var calculator_1 = __webpack_require__(3);
var creator_1 = __webpack_require__(4);
var htmlParser_1 = __webpack_require__(5);
__webpack_require__(6);
/**
 * Creates a table
 */
jsPDF.API.autotable = function (tableSettings) {
    var originalFontSize = this.internal.getFontSize();
    var originalFontStyle = this.internal.getFont().fontStyle;
    // 1. Create the table model with its columns, rows and cells
    var table = creator_1.createModel(this, this.autotableGlobalSettings, this.autotableDocumentSettings, tableSettings);
    // 2. Calculate column and cell sizes
    calculator_1.calculateWidths(table);
    // 3. Draw table on page
    painter_1.putTable(table);
    table.finalY = table.cursor.y;
    jsPDF.API['autotable'].previous = table;
    this.setFontStyle(originalFontStyle);
    this.setFontSize(originalFontSize);
    return this;
};
jsPDF.API['autotableSetDefaults'] = function (settings) {
    if (typeof settings !== 'object') {
        return console.error('An object as to be passed to autotable.setDefaults()');
    }
    if (this && this.internal) {
        this['autotableDocumentSettings'] = settings;
    }
    else {
        jsPDF.API['autotableGlobalSettings'] = settings;
    }
    return this;
};
/**
 * Improved text function with halign and valign support
 * Inspiration from: http://stackoverflow.com/questions/28327510/align-text-right-using-jspdf/28433113#28433113
 */
jsPDF.API.autotableText = function (text, x, y, styles) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        console.error('The x and y parameters are required for the autoText() function.');
        return;
    }
    var k = this.internal.scaleFactor;
    var fontSize = this.internal.getFontSize() / k;
    var splitRegex = /\r\n|\r|\n/g;
    var splitText = [];
    var lineCount = 1;
    if (styles.valign === 'middle' || styles.valign === 'bottom' || styles.halign === 'center' || styles.halign === 'right') {
        splitText = Array.isArray(text) ? text : text.split(splitRegex);
        lineCount = splitText.length || 1;
    }
    // Align the top
    y += fontSize * (2 - config_1.FONT_ROW_RATIO);
    if (styles.valign === 'middle')
        y -= (lineCount / 2) * fontSize * config_1.FONT_ROW_RATIO;
    else if (styles.valign === 'bottom')
        y -= lineCount * fontSize * config_1.FONT_ROW_RATIO;
    if (styles.halign === 'center' || styles.halign === 'right') {
        var alignSize = fontSize;
        if (styles.halign === 'center')
            alignSize *= 0.5;
        if (lineCount >= 1) {
            for (var iLine = 0; iLine < splitText.length; iLine++) {
                this.text(splitText[iLine], x - this.getStringUnitWidth(splitText[iLine]) * alignSize, y);
                y += fontSize;
            }
            return this;
        }
        x -= this.getStringUnitWidth(text) * alignSize;
    }
    this.text(text, x, y);
    return this;
};
jsPDF.API.autotable.previous = false;
// @deprecated Included for better compatibility with 2.x
jsPDF.API.autoTable = jsPDF.API.autotable;
jsPDF.API.autoTableText = jsPDF.API.autotableText;
jsPDF.API.autoTableSetDefaults = jsPDF.API.autotableSetDefaults;
jsPDF.API.autoTableHtmlToJson = function (tableElem, includeHiddenElements) {
    var res = htmlParser_1.parseHtml(tableElem, !includeHiddenElements);
    return { columns: res.head, data: res.body, rows: res.body };
};
jsPDF.API.autoTableEndPosY = function () {
    return this.autotable.previous.finalY || 0;
};


/***/ }
/******/ ]);
});