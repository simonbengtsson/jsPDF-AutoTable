/*!
 * 
 *             jsPDF AutoTable plugin v3.5.3
 *             
 *             Copyright (c) 2020 Simon Bengtsson, https://github.com/simonbengtsson/jsPDF-AutoTable
 *             Licensed under the MIT License.
 *             http://opensource.org/licenses/mit-license
 *         
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory((function webpackLoadOptionalExternalModule() { try { return require("jspdf"); } catch(e) {} }()));
	else if(typeof define === 'function' && define.amd)
		define(["jspdf"], factory);
	else {
		var a = typeof exports === 'object' ? factory((function webpackLoadOptionalExternalModule() { try { return require("jspdf"); } catch(e) {} }())) : factory(root["jsPDF"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function(__WEBPACK_EXTERNAL_MODULE__15__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function getStringWidth(text, styles, doc) {
    doc.applyStyles(styles, true);
    var textArr = Array.isArray(text) ? text : [text];
    var widestLineWidth = textArr
        .map(function (text) { return doc.getTextWidth(text); })
        .reduce(function (a, b) { return Math.max(a, b); }, 0);
    return widestLineWidth;
}
exports.getStringWidth = getStringWidth;
function addTableBorder(table, doc) {
    var lineWidth = table.settings.tableLineWidth;
    var lineColor = table.settings.tableLineColor;
    doc.applyStyles({ lineWidth: lineWidth, lineColor: lineColor });
    var fillStyle = getFillStyle(lineWidth, false);
    if (fillStyle) {
        doc.rect(table.pageStartX, table.pageStartY, table.width, table.cursor.y - table.pageStartY, fillStyle);
    }
}
exports.addTableBorder = addTableBorder;
function getFillStyle(lineWidth, fillColor) {
    var drawLine = lineWidth > 0;
    var drawBackground = fillColor || fillColor === 0;
    if (drawLine && drawBackground) {
        return 'DF'; // Fill then stroke
    }
    else if (drawLine) {
        return 'S'; // Only stroke (transparent background)
    }
    else if (drawBackground) {
        return 'F'; // Only fill, no stroke
    }
    else {
        return null;
    }
}
exports.getFillStyle = getFillStyle;
function marginOrPadding(value, defaultValue) {
    var _a, _b, _c, _d;
    value = value || defaultValue;
    if (Array.isArray(value)) {
        if (value.length >= 4) {
            return {
                top: value[0],
                right: value[1],
                bottom: value[2],
                left: value[3],
            };
        }
        else if (value.length === 3) {
            return {
                top: value[0],
                right: value[1],
                bottom: value[2],
                left: value[1],
            };
        }
        else if (value.length === 2) {
            return {
                top: value[0],
                right: value[1],
                bottom: value[0],
                left: value[1],
            };
        }
        else if (value.length === 1) {
            value = value[0];
        }
        else {
            value = defaultValue;
        }
    }
    if (typeof value === 'object') {
        if (typeof value.vertical === 'number') {
            value.top = value.vertical;
            value.bottom = value.vertical;
        }
        if (typeof value.horizontal === 'number') {
            value.right = value.horizontal;
            value.left = value.horizontal;
        }
        return {
            left: (_a = value.left) !== null && _a !== void 0 ? _a : defaultValue,
            top: (_b = value.top) !== null && _b !== void 0 ? _b : defaultValue,
            right: (_c = value.right) !== null && _c !== void 0 ? _c : defaultValue,
            bottom: (_d = value.bottom) !== null && _d !== void 0 ? _d : defaultValue,
        };
    }
    if (typeof value !== 'number') {
        value = defaultValue;
    }
    return { top: value, right: value, bottom: value, left: value };
}
exports.marginOrPadding = marginOrPadding;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
exports.FONT_ROW_RATIO = 1.15;
var HtmlRowInput = /** @class */ (function (_super) {
    __extends(HtmlRowInput, _super);
    function HtmlRowInput(element) {
        var _this = _super.call(this) || this;
        _this._element = element;
        return _this;
    }
    return HtmlRowInput;
}(Array));
exports.HtmlRowInput = HtmlRowInput;
// Base style for all themes
function defaultStyles(scaleFactor) {
    return {
        font: 'helvetica',
        fontStyle: 'normal',
        overflow: 'linebreak',
        fillColor: false,
        textColor: 20,
        halign: 'left',
        valign: 'top',
        fontSize: 10,
        cellPadding: 5 / scaleFactor,
        lineColor: 200,
        lineWidth: 0,
        cellWidth: 'auto',
        minCellHeight: 0,
        minCellWidth: 0,
    };
}
exports.defaultStyles = defaultStyles;
function getTheme(name) {
    var themes = {
        striped: {
            table: { fillColor: 255, textColor: 80, fontStyle: 'normal' },
            head: { textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold' },
            body: {},
            foot: { textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold' },
            alternateRow: { fillColor: 245 },
        },
        grid: {
            table: {
                fillColor: 255,
                textColor: 80,
                fontStyle: 'normal',
                lineWidth: 0.1,
            },
            head: {
                textColor: 255,
                fillColor: [26, 188, 156],
                fontStyle: 'bold',
                lineWidth: 0,
            },
            body: {},
            foot: {
                textColor: 255,
                fillColor: [26, 188, 156],
                fontStyle: 'bold',
                lineWidth: 0,
            },
            alternateRow: {},
        },
        plain: {
            head: { fontStyle: 'bold' },
            foot: { fontStyle: 'bold' },
        },
    };
    return themes[name];
}
exports.getTheme = getTheme;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var globalDefaults = {};
var DocHandler = /** @class */ (function () {
    function DocHandler(jsPDFDocument) {
        this.jsPDFDocument = jsPDFDocument;
        this.userStyles = {
            // Black for versions of jspdf without getTextColor
            textColor: jsPDFDocument.getTextColor
                ? this.jsPDFDocument.getTextColor()
                : 0,
            fontSize: jsPDFDocument.internal.getFontSize(),
            fontStyle: jsPDFDocument.internal.getFont().fontStyle,
            font: jsPDFDocument.internal.getFont().fontName,
        };
    }
    DocHandler.setDefaults = function (defaults, doc) {
        if (doc === void 0) { doc = null; }
        if (doc) {
            doc.__autoTableDocumentDefaults = defaults;
        }
        else {
            globalDefaults = defaults;
        }
    };
    DocHandler.unifyColor = function (c) {
        if (Array.isArray(c)) {
            return c;
        }
        else if (typeof c === 'number') {
            return [c, c, c];
        }
        else if (typeof c === 'string') {
            return [c];
        }
        else {
            return null;
        }
    };
    DocHandler.prototype.applyStyles = function (styles, fontOnly) {
        var _a, _b, _c;
        if (fontOnly === void 0) { fontOnly = false; }
        // Font style needs to be applied before font
        // https://github.com/simonbengtsson/jsPDF-AutoTable/issues/632
        if (styles.fontStyle)
            this.jsPDFDocument.setFontStyle(styles.fontStyle);
        if (styles.font)
            this.jsPDFDocument.setFont(styles.font);
        if (styles.fontSize)
            this.jsPDFDocument.setFontSize(styles.fontSize);
        if (fontOnly) {
            return; // Performance improvement
        }
        var color = DocHandler.unifyColor(styles.fillColor);
        if (color)
            (_a = this.jsPDFDocument).setFillColor.apply(_a, color);
        color = DocHandler.unifyColor(styles.textColor);
        if (color)
            (_b = this.jsPDFDocument).setTextColor.apply(_b, color);
        color = DocHandler.unifyColor(styles.lineColor);
        if (color)
            (_c = this.jsPDFDocument).setDrawColor.apply(_c, color);
        if (typeof styles.lineWidth === 'number') {
            this.jsPDFDocument.setLineWidth(styles.lineWidth);
        }
    };
    DocHandler.prototype.splitTextToSize = function (text, size, opts) {
        return this.jsPDFDocument.splitTextToSize(text, size, opts);
    };
    DocHandler.prototype.rect = function (x, y, width, height, fillStyle) {
        return this.jsPDFDocument.rect(x, y, width, height, fillStyle);
    };
    DocHandler.prototype.getPreviousAutoTable = function () {
        return this.jsPDFDocument.previousAutoTable;
    };
    DocHandler.prototype.getTextWidth = function (text) {
        return this.jsPDFDocument.getTextWidth(text);
    };
    DocHandler.prototype.getDocument = function () {
        return this.jsPDFDocument;
    };
    DocHandler.prototype.setPage = function (page) {
        this.jsPDFDocument.setPage(page);
    };
    DocHandler.prototype.addPage = function () {
        return this.jsPDFDocument.addPage();
    };
    DocHandler.prototype.getFontList = function () {
        return this.jsPDFDocument.getFontList();
    };
    DocHandler.prototype.getGlobalOptions = function () {
        return globalDefaults || {};
    };
    DocHandler.prototype.getDocumentOptions = function () {
        return this.jsPDFDocument.__autoTableDocumentDefaults || {};
    };
    DocHandler.prototype.pageSize = function () {
        var pageSize = this.jsPDFDocument.internal.pageSize;
        // JSPDF 1.4 uses get functions instead of properties on pageSize
        if (pageSize.width == null) {
            pageSize = {
                width: pageSize.getWidth(),
                height: pageSize.getHeight(),
            };
        }
        return pageSize;
    };
    DocHandler.prototype.scaleFactor = function () {
        return this.jsPDFDocument.internal.scaleFactor;
    };
    DocHandler.prototype.pageNumber = function () {
        var pageInfo = this.jsPDFDocument.internal.getCurrentPageInfo();
        if (!pageInfo) {
            // Only recent versions of jspdf has pageInfo
            return this.jsPDFDocument.internal.getNumberOfPages();
        }
        return pageInfo.pageNumber;
    };
    return DocHandler;
}());
exports.DocHandler = DocHandler;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var cssParser_1 = __webpack_require__(11);
var config_1 = __webpack_require__(1);
function parseHtml(doc, input, window, includeHiddenHtml, useCss) {
    if (includeHiddenHtml === void 0) { includeHiddenHtml = false; }
    if (useCss === void 0) { useCss = false; }
    var _a, _b;
    var tableElement;
    if (typeof input === 'string') {
        tableElement = window.document.querySelector(input);
    }
    else {
        tableElement = input;
    }
    var supportedFonts = Object.keys(doc.getFontList());
    var scaleFactor = doc.scaleFactor();
    var head = [], body = [], foot = [];
    if (!tableElement) {
        console.error('Html table could not be found with input: ', input);
        return { head: head, body: body, foot: foot };
    }
    for (var i = 0; i < tableElement.rows.length; i++) {
        var element = tableElement.rows[i];
        var tagName = (_b = (_a = element === null || element === void 0 ? void 0 : element.parentElement) === null || _a === void 0 ? void 0 : _a.tagName) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        var row = parseRowContent(supportedFonts, scaleFactor, window, element, includeHiddenHtml, useCss);
        if (!row)
            continue;
        if (tagName === 'thead') {
            head.push(row);
        }
        else if (tagName === 'tfoot') {
            foot.push(row);
        }
        else {
            // Add to body both if parent is tbody or table
            body.push(row);
        }
    }
    return { head: head, body: body, foot: foot };
}
exports.parseHtml = parseHtml;
function parseRowContent(supportedFonts, scaleFactor, window, row, includeHidden, useCss) {
    var resultRow = new config_1.HtmlRowInput(row);
    for (var i = 0; i < row.cells.length; i++) {
        var cell = row.cells[i];
        var style_1 = window.getComputedStyle(cell);
        if (includeHidden || style_1.display !== 'none') {
            var cellStyles = void 0;
            if (useCss) {
                cellStyles = cssParser_1.parseCss(supportedFonts, cell, scaleFactor, style_1, window);
            }
            resultRow.push({
                rowSpan: cell.rowSpan,
                colSpan: cell.colSpan,
                styles: cellStyles,
                _element: cell,
                content: parseCellContent(cell),
            });
        }
    }
    var style = window.getComputedStyle(row);
    if (resultRow.length > 0 && (includeHidden || style.display !== 'none')) {
        return resultRow;
    }
}
function parseCellContent(orgCell) {
    // Work on cloned node to make sure no changes are applied to html table
    var cell = orgCell.cloneNode(true);
    // Remove extra space and line breaks in markup to make it more similar to
    // what would be shown in html
    cell.innerHTML = cell.innerHTML.replace(/\n/g, '').replace(/ +/g, ' ');
    // Preserve <br> tags as line breaks in the pdf
    cell.innerHTML = cell.innerHTML
        .split('<br>')
        .map(function (part) { return part.trim(); })
        .join('\n');
    // innerText for ie
    return cell.innerText || cell.textContent || '';
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Improved text function with halign and valign support
 * Inspiration from: http://stackoverflow.com/questions/28327510/align-text-right-using-jspdf/28433113#28433113
 */
function default_1(text, x, y, styles, doc) {
    styles = styles || {};
    var FONT_ROW_RATIO = 1.15;
    var k = doc.internal.scaleFactor;
    var fontSize = doc.internal.getFontSize() / k;
    var splitRegex = /\r\n|\r|\n/g;
    var splitText = '';
    var lineCount = 1;
    if (styles.valign === 'middle' ||
        styles.valign === 'bottom' ||
        styles.halign === 'center' ||
        styles.halign === 'right') {
        splitText = typeof text === 'string' ? text.split(splitRegex) : text;
        lineCount = splitText.length || 1;
    }
    // Align the top
    y += fontSize * (2 - FONT_ROW_RATIO);
    if (styles.valign === 'middle')
        y -= (lineCount / 2) * fontSize * FONT_ROW_RATIO;
    else if (styles.valign === 'bottom')
        y -= lineCount * fontSize * FONT_ROW_RATIO;
    if (styles.halign === 'center' || styles.halign === 'right') {
        var alignSize = fontSize;
        if (styles.halign === 'center')
            alignSize *= 0.5;
        if (splitText && lineCount >= 1) {
            for (var iLine = 0; iLine < splitText.length; iLine++) {
                doc.text(splitText[iLine], x - doc.getStringUnitWidth(splitText[iLine]) * alignSize, y);
                y += fontSize * FONT_ROW_RATIO;
            }
            return doc;
        }
        x -= doc.getStringUnitWidth(text) * alignSize;
    }
    if (styles.halign === 'justify') {
        doc.text(text, x, y, {
            maxWidth: styles.maxWidth || 100,
            align: 'justify',
        });
    }
    else {
        doc.text(text, x, y);
    }
    return doc;
}
exports.default = default_1;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = __webpack_require__(1);
var htmlParser_1 = __webpack_require__(3);
var polyfills_1 = __webpack_require__(6);
var common_1 = __webpack_require__(0);
var documentHandler_1 = __webpack_require__(2);
var inputValidator_1 = __webpack_require__(12);
var models_1 = __webpack_require__(7);
var widthCalculator_1 = __webpack_require__(14);
function createTable(jsPDFDoc, current) {
    var doc = new documentHandler_1.DocHandler(jsPDFDoc);
    var document = doc.getDocumentOptions();
    var global = doc.getGlobalOptions();
    inputValidator_1.default(global, document, current, doc);
    var options = polyfills_1.assign({}, global, document, current);
    var previous = doc.getPreviousAutoTable();
    var sf = doc.scaleFactor();
    var margin = common_1.marginOrPadding(options.margin, 40 / sf);
    var startY = getStartY(previous, sf, doc.pageNumber(), options, margin.top);
    var settings = parseSettings(options, sf, startY, margin);
    var styles = parseStyles(global, document, current);
    var win;
    if (typeof window !== 'undefined') {
        win = window;
    }
    var content = parseContent(doc, options, styles, settings.theme, sf, win);
    var table = new models_1.Table(current.tableId, settings, styles, parseHooks(global, document, current), content);
    calculate(table, sf, doc);
    table.minWidth = table.columns.reduce(function (total, col) { return total + col.minWidth; }, 0);
    table.wrappedWidth = table.columns.reduce(function (total, col) { return total + col.wrappedWidth; }, 0);
    if (typeof table.settings.tableWidth === 'number') {
        table.width = table.settings.tableWidth;
    }
    else if (table.settings.tableWidth === 'wrap') {
        table.width = table.wrappedWidth;
    }
    else {
        table.width = doc.pageSize().width - margin.left - margin.right;
    }
    widthCalculator_1.calculateWidths(doc, table);
    doc.applyStyles(doc.userStyles);
    return table;
}
exports.createTable = createTable;
function calculate(table, sf, doc) {
    table.allRows().forEach(function (row) {
        for (var _i = 0, _a = table.columns; _i < _a.length; _i++) {
            var column = _a[_i];
            var cell = row.cells[column.index];
            if (!cell)
                continue;
            table.callCellHooks(doc, table.hooks.didParseCell, cell, row, column);
            var padding = cell.padding('horizontal');
            cell.contentWidth = common_1.getStringWidth(cell.text, cell.styles, doc) + padding;
            var longestWordWidth = common_1.getStringWidth(cell.text.join(' ').split(/\s+/), cell.styles, doc);
            cell.minReadableWidth = longestWordWidth + cell.padding('horizontal');
            if (typeof cell.styles.cellWidth === 'number') {
                cell.minWidth = cell.styles.cellWidth;
                cell.wrappedWidth = cell.styles.cellWidth;
            }
            else if (cell.styles.cellWidth === 'wrap') {
                cell.minWidth = cell.contentWidth;
                cell.wrappedWidth = cell.contentWidth;
            }
            else {
                // auto
                var defaultMinWidth = 10 / sf;
                cell.minWidth = cell.styles.minCellWidth || defaultMinWidth;
                cell.wrappedWidth = cell.contentWidth;
                if (cell.minWidth > cell.wrappedWidth) {
                    cell.wrappedWidth = cell.minWidth;
                }
            }
        }
    });
    table.allRows().forEach(function (row) {
        for (var _i = 0, _a = table.columns; _i < _a.length; _i++) {
            var column = _a[_i];
            var cell = row.cells[column.index];
            // For now we ignore the minWidth and wrappedWidth of colspan cells when calculating colspan widths.
            // Could probably be improved upon however.
            if (cell && cell.colSpan === 1) {
                column.wrappedWidth = Math.max(column.wrappedWidth, cell.wrappedWidth);
                column.minWidth = Math.max(column.minWidth, cell.minWidth);
                column.minReadableWidth = Math.max(column.minReadableWidth, cell.minReadableWidth);
            }
            else {
                // Respect cellWidth set in columnStyles even if there is no cells for this column
                // or if the column only have colspan cells. Since the width of colspan cells
                // does not affect the width of columns, setting columnStyles cellWidth enables the
                // user to at least do it manually.
                // Note that this is not perfect for now since for example row and table styles are
                // not accounted for
                var columnStyles = table.styles.columnStyles[column.dataKey] ||
                    table.styles.columnStyles[column.index] ||
                    {};
                var cellWidth = columnStyles.cellWidth;
                if (cellWidth && typeof cellWidth === 'number') {
                    column.minWidth = cellWidth;
                    column.wrappedWidth = cellWidth;
                }
            }
            if (cell) {
                // Make sure all columns get at least min width even though width calculations are not based on them
                if (cell.colSpan > 1 && !column.minWidth) {
                    column.minWidth = cell.minWidth;
                }
                if (cell.colSpan > 1 && !column.wrappedWidth) {
                    column.wrappedWidth = cell.minWidth;
                }
            }
        }
    });
}
function parseStyles(gInput, dInput, cInput) {
    var styleOptions = {
        styles: {},
        headStyles: {},
        bodyStyles: {},
        footStyles: {},
        alternateRowStyles: {},
        columnStyles: {},
    };
    var _loop_1 = function (prop) {
        if (prop === 'columnStyles') {
            var global_1 = gInput[prop];
            var document_1 = dInput[prop];
            var current = cInput[prop];
            styleOptions.columnStyles = polyfills_1.assign({}, global_1, document_1, current);
        }
        else {
            var allOptions = [gInput, dInput, cInput];
            var styles = allOptions.map(function (opts) { return opts[prop] || {}; });
            styleOptions[prop] = polyfills_1.assign({}, styles[0], styles[1], styles[2]);
        }
    };
    for (var _i = 0, _a = Object.keys(styleOptions); _i < _a.length; _i++) {
        var prop = _a[_i];
        _loop_1(prop);
    }
    return styleOptions;
}
function parseHooks(global, document, current) {
    var allOptions = [global, document, current];
    var result = {
        didParseCell: [],
        willDrawCell: [],
        didDrawCell: [],
        didDrawPage: [],
    };
    for (var _i = 0, allOptions_1 = allOptions; _i < allOptions_1.length; _i++) {
        var options = allOptions_1[_i];
        if (options.didParseCell)
            result.didParseCell.push(options.didParseCell);
        if (options.willDrawCell)
            result.willDrawCell.push(options.willDrawCell);
        if (options.didDrawCell)
            result.didDrawCell.push(options.didDrawCell);
        if (options.didDrawPage)
            result.didDrawPage.push(options.didDrawPage);
    }
    return result;
}
function parseSettings(options, sf, startY, margin) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var showFoot;
    if (options.showFoot === true) {
        showFoot = 'everyPage';
    }
    else if (options.showFoot === false) {
        showFoot = 'never';
    }
    else {
        showFoot = (_a = options.showFoot) !== null && _a !== void 0 ? _a : 'everyPage';
    }
    var showHead;
    if (options.showHead === true) {
        showHead = 'everyPage';
    }
    else if (options.showHead === false) {
        showHead = 'never';
    }
    else
        showHead = (_b = options.showHead) !== null && _b !== void 0 ? _b : 'everyPage';
    var useCss = (_c = options.useCss) !== null && _c !== void 0 ? _c : false;
    var theme = options.theme || (useCss ? 'plain' : 'striped');
    var settings = {
        includeHiddenHtml: (_d = options.includeHiddenHtml) !== null && _d !== void 0 ? _d : false,
        useCss: useCss,
        theme: theme,
        startY: startY,
        margin: margin,
        pageBreak: (_e = options.pageBreak) !== null && _e !== void 0 ? _e : 'auto',
        rowPageBreak: (_f = options.rowPageBreak) !== null && _f !== void 0 ? _f : 'auto',
        tableWidth: (_g = options.tableWidth) !== null && _g !== void 0 ? _g : 'auto',
        showHead: showHead,
        showFoot: showFoot,
        tableLineWidth: (_h = options.tableLineWidth) !== null && _h !== void 0 ? _h : 0,
        tableLineColor: (_j = options.tableLineColor) !== null && _j !== void 0 ? _j : 200,
    };
    return settings;
}
function getStartY(previous, sf, currentPage, options, marginTop) {
    var isSamePageAsPreviousTable = false;
    if (previous) {
        var endingPage = previous.startPageNumber + previous.pageNumber - 1;
        isSamePageAsPreviousTable = endingPage === currentPage;
    }
    var startY = options.startY;
    if (startY == null || startY === false) {
        if (isSamePageAsPreviousTable) {
            // Some users had issues with overlapping tables when they used multiple
            // tables without setting startY so setting it here to a sensible default.
            startY = previous.finalY + 20 / sf;
        }
    }
    return startY || marginTop;
}
function parseContent(doc, options, styles, theme, sf, window) {
    var head = options.head || [];
    var body = options.body || [];
    var foot = options.foot || [];
    if (options.html) {
        var hidden = options.includeHiddenHtml;
        if (window) {
            var htmlContent = htmlParser_1.parseHtml(doc, options.html, window, hidden, options.useCss) || {};
            head = htmlContent.head || head;
            body = htmlContent.body || head;
            foot = htmlContent.foot || head;
        }
        else {
            console.error('Cannot parse html in non browser environment');
        }
    }
    var columnInputs = options.columns || getColumnDef(head, body, foot);
    var columns = createColumns(columnInputs);
    // If no head or foot is set, try generating it with content from columns
    if (head.length === 0 && options.columns) {
        var sectionRow = generateTitleRow(columns, 'head');
        if (sectionRow)
            head.push(sectionRow);
    }
    if (foot.length === 0 && options.columns) {
        var sectionRow = generateTitleRow(columns, 'foot');
        if (sectionRow)
            foot.push(sectionRow);
    }
    return {
        columns: columns,
        head: parseSection('head', head, options, columns, styles, theme, sf),
        body: parseSection('body', body, options, columns, styles, theme, sf),
        foot: parseSection('foot', foot, options, columns, styles, theme, sf),
    };
}
function parseSection(sectionName, sectionRows, settings, columns, styleProps, theme, scaleFactor) {
    var rowSpansLeftForColumn = {};
    return sectionRows.map(function (rawRow, rowIndex) {
        var skippedRowForRowSpans = 0;
        var row = new models_1.Row(rawRow, rowIndex, sectionName);
        var colSpansAdded = 0;
        var columnSpansLeft = 0;
        for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
            var column = columns_1[_i];
            if (rowSpansLeftForColumn[column.index] == null ||
                rowSpansLeftForColumn[column.index].left === 0) {
                if (columnSpansLeft === 0) {
                    var rawCell = void 0;
                    if (Array.isArray(rawRow)) {
                        rawCell =
                            rawRow[column.index - colSpansAdded - skippedRowForRowSpans];
                    }
                    else {
                        rawCell = rawRow[column.dataKey];
                    }
                    var cellInputStyles = {};
                    if (typeof rawCell === 'object' && !Array.isArray(rawCell)) {
                        cellInputStyles = (rawCell === null || rawCell === void 0 ? void 0 : rawCell.styles) || {};
                    }
                    var styles = cellStyles(sectionName, column, rowIndex, theme, styleProps, scaleFactor, cellInputStyles);
                    var cell = new models_1.Cell(rawCell, styles, sectionName);
                    // dataKey is not used internally no more but keep for
                    // backwards compat in hooks
                    row.cells[column.dataKey] = cell;
                    row.cells[column.index] = cell;
                    columnSpansLeft = cell.colSpan - 1;
                    rowSpansLeftForColumn[column.index] = {
                        left: cell.rowSpan - 1,
                        times: columnSpansLeft,
                    };
                }
                else {
                    columnSpansLeft--;
                    colSpansAdded++;
                }
            }
            else {
                rowSpansLeftForColumn[column.index].left--;
                columnSpansLeft = rowSpansLeftForColumn[column.index].times;
                skippedRowForRowSpans++;
            }
        }
        return row;
    });
}
function generateTitleRow(columns, section) {
    var sectionRow = {};
    columns.forEach(function (col) {
        if (col.raw != null) {
            var title = getSectionTitle(section, col.raw);
            if (title != null)
                sectionRow[col.dataKey] = title;
        }
    });
    return Object.keys(sectionRow).length > 0 ? sectionRow : null;
}
function getSectionTitle(section, column) {
    if (section === 'head') {
        if (typeof column === 'object') {
            return column.header || column.title || null;
        }
        else if (typeof column === 'string' || typeof column === 'number') {
            return column;
        }
    }
    else if (section === 'foot' && typeof column === 'object') {
        return column.footer;
    }
    return null;
}
function getColumnDef(head, body, foot) {
    var firstRow = head[0] || body[0] || foot[0] || [];
    var result = [];
    Object.keys(firstRow)
        .filter(function (key) { return key !== '_element'; })
        .forEach(function (key) {
        var colSpan = 1;
        var input;
        if (Array.isArray(firstRow)) {
            input = firstRow[parseInt(key)];
        }
        else {
            input = firstRow[key];
        }
        if (typeof input === 'object' && !Array.isArray(input)) {
            colSpan = (input === null || input === void 0 ? void 0 : input.colSpan) || 1;
        }
        for (var i = 0; i < colSpan; i++) {
            var id = void 0;
            if (Array.isArray(firstRow)) {
                id = result.length;
            }
            else {
                id = key + (i > 0 ? "_" + i : '');
            }
            result.push({ dataKey: id, header: input });
        }
    });
    return result;
}
exports.getColumnDef = getColumnDef;
function createColumns(columns) {
    return columns.map(function (input, index) {
        var _a, _b;
        var key;
        if (typeof input === 'object') {
            key = (_b = (_a = input.dataKey) !== null && _a !== void 0 ? _a : input.key) !== null && _b !== void 0 ? _b : index;
        }
        else {
            key = index;
        }
        return new models_1.Column(key, input, index);
    });
}
function cellStyles(sectionName, column, rowIndex, themeName, styles, scaleFactor, cellInputStyles) {
    var theme = config_1.getTheme(themeName);
    var sectionStyles;
    if (sectionName === 'head') {
        sectionStyles = styles.headStyles;
    }
    else if (sectionName === 'body') {
        sectionStyles = styles.bodyStyles;
    }
    else if (sectionName === 'foot') {
        sectionStyles = styles.footStyles;
    }
    var otherStyles = polyfills_1.assign({}, theme.table, theme[sectionName], styles.styles, sectionStyles);
    var columnStyles = styles.columnStyles[column.dataKey] ||
        styles.columnStyles[column.index] ||
        {};
    var colStyles = sectionName === 'body' ? columnStyles : {};
    var rowStyles = sectionName === 'body' && rowIndex % 2 === 0
        ? polyfills_1.assign({}, theme.alternateRow, styles.alternateRowStyles)
        : {};
    var defaultStyle = config_1.defaultStyles(scaleFactor);
    var themeStyles = polyfills_1.assign({}, defaultStyle, otherStyles, rowStyles, colStyles);
    return polyfills_1.assign(themeStyles, cellInputStyles);
}


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* eslint-disable @typescript-eslint/no-unused-vars */
Object.defineProperty(exports, "__esModule", { value: true });
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
function assign(target, s, s1, s2, s3) {
    if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        // eslint-disable-next-line prefer-rest-params
        var nextSource = arguments[index];
        if (nextSource != null) {
            // Skip over if undefined or null
            for (var nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }
    return to;
}
exports.assign = assign;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = __webpack_require__(1);
var HookData_1 = __webpack_require__(13);
var common_1 = __webpack_require__(0);
var Table = /** @class */ (function () {
    function Table(id, settings, styles, hooks, content) {
        this.cursor = { x: 0, y: 0 };
        this.columns = [];
        this.head = [];
        this.body = [];
        this.foot = [];
        this.wrappedWidth = 0;
        this.minWidth = 0;
        this.width = 0;
        this.height = 0;
        this.headHeight = 0;
        this.footHeight = 0;
        this.startPageNumber = 1;
        this.pageNumber = 1;
        // Deprecated, use pageNumber instead
        // Not using getter since:
        // https://github.com/simonbengtsson/jsPDF-AutoTable/issues/596
        this.pageCount = 1;
        this.pageStartX = 0;
        this.pageStartY = 0;
        this.finalY = 0;
        this.id = id;
        this.settings = settings;
        this.styles = styles;
        this.hooks = hooks;
        this.columns = content.columns;
        this.head = content.head;
        this.body = content.body;
        this.foot = content.foot;
    }
    Table.prototype.allRows = function () {
        return this.head.concat(this.body).concat(this.foot);
    };
    Table.prototype.callCellHooks = function (doc, handlers, cell, row, column) {
        for (var _i = 0, handlers_1 = handlers; _i < handlers_1.length; _i++) {
            var handler = handlers_1[_i];
            var data = new HookData_1.CellHookData(this, doc, cell, row, column);
            var result = handler(data) === false;
            // Make sure text is always string[] since user can assign string
            cell.text = Array.isArray(cell.text) ? cell.text : [cell.text];
            if (result) {
                return false;
            }
        }
        return true;
    };
    Table.prototype.callEndPageHooks = function (doc) {
        doc.applyStyles(doc.userStyles);
        for (var _i = 0, _a = this.hooks.didDrawPage; _i < _a.length; _i++) {
            var handler = _a[_i];
            handler(new HookData_1.HookData(this, doc));
        }
    };
    return Table;
}());
exports.Table = Table;
var Row = /** @class */ (function () {
    function Row(raw, index, section) {
        this.cells = {};
        this.height = 0;
        this.maxCellHeight = 0;
        this.x = 0;
        this.y = 0;
        this.spansMultiplePages = false;
        this.raw = raw;
        if (raw instanceof config_1.HtmlRowInput) {
            this.raw = raw._element;
            this.element = raw._element;
        }
        this.index = index;
        this.section = section;
    }
    Row.prototype.hasRowSpan = function (columns) {
        var _this = this;
        return (columns.filter(function (column) {
            var cell = _this.cells[column.index];
            if (!cell)
                return false;
            return cell.rowSpan > 1;
        }).length > 0);
    };
    Row.prototype.canEntireRowFit = function (height) {
        return this.maxCellHeight <= height;
    };
    Row.prototype.getMinimumRowHeight = function (columns, doc) {
        var _this = this;
        return columns.reduce(function (acc, column) {
            var cell = _this.cells[column.index];
            if (!cell)
                return 0;
            var fontHeight = (cell.styles.fontSize / doc.scaleFactor()) * config_1.FONT_ROW_RATIO;
            var vPadding = cell.padding('vertical');
            var oneRowHeight = vPadding + fontHeight;
            return oneRowHeight > acc ? oneRowHeight : acc;
        }, 0);
    };
    return Row;
}());
exports.Row = Row;
var Cell = /** @class */ (function () {
    function Cell(raw, styles, section) {
        var _a, _b;
        this.contentHeight = 0;
        this.contentWidth = 0;
        this.wrappedWidth = 0;
        this.minReadableWidth = 0;
        this.minWidth = 0;
        this.width = 0;
        this.height = 0;
        this.textPos = { y: 0, x: 0 };
        this.x = 0;
        this.y = 0;
        this.colSpan = 1;
        this.rowSpan = 1;
        this.styles = styles;
        this.section = section;
        this.raw = raw;
        var content = raw;
        if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
            this.rowSpan = raw.rowSpan || 1;
            this.colSpan = raw.colSpan || 1;
            content = (_b = (_a = raw.content) !== null && _a !== void 0 ? _a : raw.title) !== null && _b !== void 0 ? _b : raw;
            if (raw._element) {
                this.raw = raw._element;
            }
        }
        // Stringify 0 and false, but not undefined or null
        var text = content != null ? '' + content : '';
        var splitRegex = /\r\n|\r|\n/g;
        this.text = text.split(splitRegex);
    }
    Cell.prototype.getContentHeight = function (scaleFactor) {
        var lineCount = Array.isArray(this.text) ? this.text.length : 1;
        var fontHeight = (this.styles.fontSize / scaleFactor) * config_1.FONT_ROW_RATIO;
        return lineCount * fontHeight + this.padding('vertical');
    };
    Cell.prototype.padding = function (name) {
        var padding = common_1.marginOrPadding(this.styles.cellPadding, 0);
        if (name === 'vertical') {
            return padding.top + padding.bottom;
        }
        else if (name === 'horizontal') {
            return padding.left + padding.right;
        }
        else {
            return padding[name];
        }
    };
    return Cell;
}());
exports.Cell = Cell;
var Column = /** @class */ (function () {
    function Column(dataKey, raw, index) {
        this.wrappedWidth = 0;
        this.minReadableWidth = 0;
        this.minWidth = 0;
        this.width = 0;
        this.dataKey = dataKey;
        this.raw = raw;
        this.index = index;
    }
    Column.prototype.getMaxCustomCellWidth = function (table) {
        var max = 0;
        for (var _i = 0, _a = table.allRows(); _i < _a.length; _i++) {
            var row = _a[_i];
            var cell = row.cells[this.index];
            if (cell && typeof cell.styles.cellWidth === 'number') {
                max = Math.max(max, cell.styles.cellWidth);
            }
        }
        return max;
    };
    return Column;
}());
exports.Column = Column;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = __webpack_require__(1);
var common_1 = __webpack_require__(0);
var models_1 = __webpack_require__(7);
var documentHandler_1 = __webpack_require__(2);
var polyfills_1 = __webpack_require__(6);
var autoTableText_1 = __webpack_require__(4);
function drawTable(jsPDFDoc, table) {
    var settings = table.settings;
    var startY = settings.startY;
    var margin = settings.margin;
    table.cursor = {
        x: margin.left,
        y: startY,
    };
    var minTableBottomPos = startY + margin.bottom + table.headHeight + table.footHeight;
    if (settings.pageBreak === 'avoid') {
        minTableBottomPos += table.height;
    }
    var doc = new documentHandler_1.DocHandler(jsPDFDoc);
    if (settings.pageBreak === 'always' ||
        (settings.startY != null && minTableBottomPos > doc.pageSize().height)) {
        nextPage(doc);
        table.cursor.y = margin.top;
    }
    table.pageStartX = table.cursor.x;
    table.pageStartY = table.cursor.y;
    table.startPageNumber = doc.pageNumber();
    doc.applyStyles(doc.userStyles);
    if (settings.showHead === 'firstPage' || settings.showHead === 'everyPage') {
        table.head.forEach(function (row) { return printRow(table, row, doc); });
    }
    doc.applyStyles(doc.userStyles);
    table.body.forEach(function (row, index) {
        printFullRow(table, row, index === table.body.length - 1, doc);
    });
    doc.applyStyles(doc.userStyles);
    if (settings.showFoot === 'lastPage' || settings.showFoot === 'everyPage') {
        table.foot.forEach(function (row) { return printRow(table, row, doc); });
    }
    common_1.addTableBorder(table, doc);
    table.callEndPageHooks(doc);
    table.finalY = table.cursor.y;
    jsPDFDoc.previousAutoTable = table;
    jsPDFDoc.lastAutoTable = table; // Deprecated
    if (jsPDFDoc.autoTable)
        jsPDFDoc.autoTable.previous = table; // Deprecated
    doc.applyStyles(doc.userStyles);
}
exports.drawTable = drawTable;
function getRemainingLineCount(cell, remainingPageSpace, doc) {
    var fontHeight = (cell.styles.fontSize / doc.scaleFactor()) * config_1.FONT_ROW_RATIO;
    var vPadding = cell.padding('vertical');
    var remainingLines = Math.floor((remainingPageSpace - vPadding) / fontHeight);
    return Math.max(0, remainingLines);
}
function modifyRowToFit(row, remainingPageSpace, table, doc) {
    var remainderRow = new models_1.Row(row.raw, -1, row.section);
    remainderRow.spansMultiplePages = true;
    row.spansMultiplePages = true;
    row.height = 0;
    row.maxCellHeight = 0;
    for (var _i = 0, _a = table.columns; _i < _a.length; _i++) {
        var column = _a[_i];
        var cell = row.cells[column.index];
        if (!cell)
            continue;
        if (!Array.isArray(cell.text)) {
            cell.text = [cell.text];
        }
        var remainderCell = new models_1.Cell(cell.raw, cell.styles, cell.section);
        remainderCell = polyfills_1.assign(remainderCell, cell);
        remainderCell.textPos = polyfills_1.assign({}, cell.textPos);
        remainderCell.text = [];
        var remainingLineCount = getRemainingLineCount(cell, remainingPageSpace, doc);
        if (cell.text.length > remainingLineCount) {
            remainderCell.text = cell.text.splice(remainingLineCount, cell.text.length);
        }
        var scaleFactor = doc.scaleFactor();
        cell.contentHeight = cell.getContentHeight(scaleFactor);
        if (cell.contentHeight > row.height) {
            row.height = cell.contentHeight;
            row.maxCellHeight = cell.contentHeight;
        }
        remainderCell.contentHeight = remainderCell.getContentHeight(scaleFactor);
        if (remainderCell.contentHeight > remainderRow.height) {
            remainderRow.height = remainderCell.contentHeight;
            remainderRow.maxCellHeight = remainderCell.contentHeight;
        }
        remainderRow.cells[column.index] = remainderCell;
    }
    for (var _b = 0, _c = table.columns; _b < _c.length; _b++) {
        var column = _c[_b];
        var remainderCell = remainderRow.cells[column.index];
        if (remainderCell) {
            remainderCell.height = remainderRow.height;
        }
        var cell = row.cells[column.index];
        if (cell) {
            cell.height = row.height;
        }
    }
    return remainderRow;
}
function shouldPrintOnCurrentPage(doc, row, remainingPageSpace, table) {
    var pageHeight = doc.pageSize().height;
    var margin = table.settings.margin;
    var marginHeight = margin.top + margin.bottom;
    var maxRowHeight = pageHeight - marginHeight;
    if (row.section === 'body') {
        // Should also take into account that head and foot is not
        // on every page with some settings
        maxRowHeight -= table.headHeight + table.footHeight;
    }
    var minRowHeight = row.getMinimumRowHeight(table.columns, doc);
    var minRowFits = minRowHeight < remainingPageSpace;
    if (minRowHeight > maxRowHeight) {
        console.error("Will not be able to print row " + row.index + " correctly since it's minimum height is larger than page height");
        return true;
    }
    if (!minRowFits) {
        return false;
    }
    var rowHasRowSpanCell = row.hasRowSpan(table.columns);
    var rowHigherThanPage = row.maxCellHeight > maxRowHeight;
    if (rowHigherThanPage) {
        if (rowHasRowSpanCell) {
            console.error("The content of row " + row.index + " will not be drawn correctly since drawing rows with a height larger than the page height and has cells with rowspans is not supported.");
        }
        return true;
    }
    if (rowHasRowSpanCell) {
        // Currently a new page is required whenever a rowspan row don't fit a page.
        return false;
    }
    if (table.settings.rowPageBreak === 'avoid') {
        return false;
    }
    // In all other cases print the row on current page
    return true;
}
function printFullRow(table, row, isLastRow, doc) {
    var remainingPageSpace = getRemainingPageSpace(table, isLastRow, doc);
    if (row.canEntireRowFit(remainingPageSpace)) {
        printRow(table, row, doc);
    }
    else {
        if (shouldPrintOnCurrentPage(doc, row, remainingPageSpace, table)) {
            var remainderRow = modifyRowToFit(row, remainingPageSpace, table, doc);
            printRow(table, row, doc);
            addPage(table, doc);
            printFullRow(table, remainderRow, isLastRow, doc);
        }
        else {
            addPage(table, doc);
            printFullRow(table, row, isLastRow, doc);
        }
    }
}
function printRow(table, row, doc) {
    table.cursor.x = table.settings.margin.left;
    row.y = table.cursor.y;
    row.x = table.cursor.x;
    for (var _i = 0, _a = table.columns; _i < _a.length; _i++) {
        var column = _a[_i];
        var cell = row.cells[column.index];
        if (!cell) {
            table.cursor.x += column.width;
            continue;
        }
        doc.applyStyles(cell.styles);
        cell.x = table.cursor.x;
        cell.y = row.y;
        if (cell.styles.valign === 'top') {
            cell.textPos.y = table.cursor.y + cell.padding('top');
        }
        else if (cell.styles.valign === 'bottom') {
            cell.textPos.y = table.cursor.y + cell.height - cell.padding('bottom');
        }
        else {
            var netHeight = cell.height - cell.padding('vertical');
            cell.textPos.y = table.cursor.y + netHeight / 2 + cell.padding('top');
        }
        if (cell.styles.halign === 'right') {
            cell.textPos.x = cell.x + cell.width - cell.padding('right');
        }
        else if (cell.styles.halign === 'center') {
            var netWidth = cell.width - cell.padding('horizontal');
            cell.textPos.x = cell.x + netWidth / 2 + cell.padding('left');
        }
        else {
            cell.textPos.x = cell.x + cell.padding('left');
        }
        var result = table.callCellHooks(doc, table.hooks.willDrawCell, cell, row, column);
        if (result === false) {
            table.cursor.x += column.width;
            continue;
        }
        var cellStyles = cell.styles;
        var fillStyle = common_1.getFillStyle(cellStyles.lineWidth, cellStyles.fillColor);
        if (fillStyle) {
            doc.rect(cell.x, table.cursor.y, cell.width, cell.height, fillStyle);
        }
        autoTableText_1.default(cell.text, cell.textPos.x, cell.textPos.y, {
            halign: cell.styles.halign,
            valign: cell.styles.valign,
            maxWidth: Math.ceil(cell.width - cell.padding('left') - cell.padding('right')),
        }, doc.getDocument());
        table.callCellHooks(doc, table.hooks.didDrawCell, cell, row, column);
        table.cursor.x += column.width;
    }
    table.cursor.y += row.height;
}
function getRemainingPageSpace(table, isLastRow, doc) {
    var bottomContentHeight = table.settings.margin.bottom;
    var showFoot = table.settings.showFoot;
    if (showFoot === 'everyPage' || (showFoot === 'lastPage' && isLastRow)) {
        bottomContentHeight += table.footHeight;
    }
    return doc.pageSize().height - table.cursor.y - bottomContentHeight;
}
function addPage(table, doc) {
    doc.applyStyles(doc.userStyles);
    if (table.settings.showFoot === 'everyPage') {
        table.foot.forEach(function (row) { return printRow(table, row, doc); });
    }
    table.finalY = table.cursor.y;
    // Add user content just before adding new page ensure it will
    // be drawn above other things on the page
    table.callEndPageHooks(doc);
    var margin = table.settings.margin;
    common_1.addTableBorder(table, doc);
    nextPage(doc);
    table.pageNumber++;
    table.pageCount++;
    table.cursor = { x: margin.left, y: margin.top };
    table.pageStartX = table.cursor.x;
    table.pageStartY = table.cursor.y;
    if (table.settings.showHead === 'everyPage') {
        table.head.forEach(function (row) { return printRow(table, row, doc); });
    }
}
exports.addPage = addPage;
function nextPage(doc) {
    var current = doc.pageNumber();
    doc.setPage(current + 1);
    var newCurrent = doc.pageNumber();
    if (newCurrent === current) {
        doc.addPage();
    }
}


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var applyPlugin_1 = __webpack_require__(10);
var inputParser_1 = __webpack_require__(5);
var tableDrawer_1 = __webpack_require__(8);
// export { applyPlugin } didn't export applyPlugin
// to index.d.ts for some reason
function applyPlugin(jsPDF) {
    applyPlugin_1.default(jsPDF);
}
exports.applyPlugin = applyPlugin;
function autoTable(doc, options) {
    var table = inputParser_1.createTable(doc, options);
    tableDrawer_1.drawTable(doc, table);
}
exports.default = autoTable;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    var jsPDF = __webpack_require__(15);
    applyPlugin(jsPDF);
}
catch (error) {
    // Importing jspdf in nodejs environments does not work as of jspdf
    // 1.5.3 so we need to silence potential errors to support using for example
    // the nodejs jspdf dist files with the exported applyPlugin
}


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var htmlParser_1 = __webpack_require__(3);
var autoTableText_1 = __webpack_require__(4);
var documentHandler_1 = __webpack_require__(2);
var inputParser_1 = __webpack_require__(5);
var tableDrawer_1 = __webpack_require__(8);
function default_1(jsPDF) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jsPDF.API.autoTable = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var options;
        if (args.length === 1) {
            options = args[0];
        }
        else {
            console.error('Use of deprecated autoTable initiation');
            options = args[2] || {};
            options.columns = args[0];
            options.body = args[1];
        }
        var table = inputParser_1.createTable(this, options);
        tableDrawer_1.drawTable(this, table);
        return this;
    };
    // Assign false to enable `doc.lastAutoTable.finalY || 40` sugar
    jsPDF.API.lastAutoTable = false;
    jsPDF.API.previousAutoTable = false; // deprecated in v3
    jsPDF.API.autoTable.previous = false; // deprecated in v3
    jsPDF.API.autoTableText = function (text, x, y, styles) {
        autoTableText_1.default(text, x, y, styles, this);
    };
    jsPDF.API.autoTableSetDefaults = function (defaults) {
        documentHandler_1.DocHandler.setDefaults(defaults, this);
        return this;
    };
    jsPDF.autoTableSetDefaults = function (defaults, doc) {
        documentHandler_1.DocHandler.setDefaults(defaults, doc);
    };
    jsPDF.API.autoTableHtmlToJson = function (tableElem, includeHiddenElements) {
        if (includeHiddenElements === void 0) { includeHiddenElements = false; }
        if (typeof window === 'undefined') {
            console.error('Cannot run autoTableHtmlToJson in non browser environment');
            return null;
        }
        var doc = new documentHandler_1.DocHandler(this);
        var _a = htmlParser_1.parseHtml(doc, tableElem, window, includeHiddenElements, false), head = _a.head, body = _a.body, foot = _a.foot;
        var columns = inputParser_1.getColumnDef(head, body, foot);
        return { columns: columns, rows: body, data: body };
    };
    /**
     * @deprecated
     */
    jsPDF.API.autoTableEndPosY = function () {
        console.error('Use of deprecated function: autoTableEndPosY. Use doc.previousAutoTable.finalY instead.');
        var prev = this.previousAutoTable;
        if (prev.cursor && typeof prev.cursor.y === 'number') {
            return prev.cursor.y;
        }
        else {
            return 0;
        }
    };
    /**
     * @deprecated
     */
    jsPDF.API.autoTableAddPageContent = function (hook) {
        console.error('Use of deprecated function: autoTableAddPageContent. Use jsPDF.autoTableSetDefaults({didDrawPage: () => {}}) instead.');
        if (!jsPDF.API.autoTable.globalDefaults) {
            jsPDF.API.autoTable.globalDefaults = {};
        }
        jsPDF.API.autoTable.globalDefaults.addPageContent = hook;
        return this;
    };
    /**
     * @deprecated
     */
    jsPDF.API.autoTableAddPage = function () {
        console.error('Use of deprecated function: autoTableAddPage. Use doc.addPage()');
        this.addPage();
        return this;
    };
}
exports.default = default_1;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// Limitations
// - No support for border spacing
// - No support for transparency
var common_1 = __webpack_require__(0);
function parseCss(supportedFonts, element, scaleFactor, style, window) {
    var result = {};
    var pxScaleFactor = 96 / 72;
    var color = parseColor(element, function (elem) {
        return window.getComputedStyle(elem)['backgroundColor'];
    });
    if (color != null)
        result.fillColor = color;
    color = parseColor(element, function (elem) {
        return window.getComputedStyle(elem)['color'];
    });
    if (color != null)
        result.textColor = color;
    color = parseColor(element, function (elem) {
        return window.getComputedStyle(elem)['borderTopColor'];
    });
    if (color != null)
        result.lineColor = color;
    var padding = parsePadding(style, scaleFactor);
    if (padding)
        result.cellPadding = padding;
    // style.borderWidth only works in chrome (borderTopWidth etc works in firefox and ie as well)
    var bw = parseInt(style.borderTopWidth || '');
    bw = bw / pxScaleFactor / scaleFactor;
    if (bw)
        result.lineWidth = bw;
    var accepted = ['left', 'right', 'center', 'justify'];
    if (accepted.indexOf(style.textAlign) !== -1) {
        result.halign = style.textAlign;
    }
    accepted = ['middle', 'bottom', 'top'];
    if (accepted.indexOf(style.verticalAlign) !== -1) {
        result.valign = style.verticalAlign;
    }
    var res = parseInt(style.fontSize || '');
    if (!isNaN(res))
        result.fontSize = res / pxScaleFactor;
    var fontStyle = parseFontStyle(style);
    if (fontStyle)
        result.fontStyle = fontStyle;
    var font = (style.fontFamily || '').toLowerCase();
    if (supportedFonts.indexOf(font) !== -1) {
        result.font = font;
    }
    return result;
}
exports.parseCss = parseCss;
function parseFontStyle(style) {
    var res = '';
    if (style.fontWeight === 'bold' ||
        style.fontWeight === 'bolder' ||
        parseInt(style.fontWeight) >= 700) {
        res = 'bold';
    }
    if (style.fontStyle === 'italic' || style.fontStyle === 'oblique') {
        res += 'italic';
    }
    return res;
}
function parseColor(element, styleGetter) {
    var cssColor = realColor(element, styleGetter);
    if (!cssColor)
        return null;
    var rgba = cssColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d*))?\)$/);
    if (!rgba || !Array.isArray(rgba)) {
        return null;
    }
    var color = [
        parseInt(rgba[1]),
        parseInt(rgba[2]),
        parseInt(rgba[3]),
    ];
    var alpha = parseInt(rgba[4]);
    if (alpha === 0 || isNaN(color[0]) || isNaN(color[1]) || isNaN(color[2])) {
        return null;
    }
    return color;
}
function realColor(elem, styleGetter) {
    var bg = styleGetter(elem);
    if (bg === 'rgba(0, 0, 0, 0)' ||
        bg === 'transparent' ||
        bg === 'initial' ||
        bg === 'inherit') {
        if (elem.parentElement == null) {
            return null;
        }
        return realColor(elem.parentElement, styleGetter);
    }
    else {
        return bg;
    }
}
function parsePadding(style, scaleFactor) {
    var val = [
        style.paddingTop,
        style.paddingRight,
        style.paddingBottom,
        style.paddingLeft,
    ];
    var pxScaleFactor = 96 / (72 / scaleFactor);
    var linePadding = (parseInt(style.lineHeight) - parseInt(style.fontSize)) / scaleFactor / 2;
    var inputPadding = val.map(function (n) {
        return parseInt(n) / pxScaleFactor;
    });
    var padding = common_1.marginOrPadding(inputPadding, 0);
    if (linePadding > padding.top) {
        padding.top = linePadding;
    }
    if (linePadding > padding.bottom) {
        padding.bottom = linePadding;
    }
    return padding;
}


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function default_1(global, document, current, doc) {
    var _loop_1 = function (options) {
        if (options && typeof options !== 'object') {
            console.error('The options parameter should be of type object, is: ' + typeof options);
        }
        if (typeof options.extendWidth !== 'undefined') {
            options.tableWidth = options.extendWidth ? 'auto' : 'wrap';
            console.error('Use of deprecated option: extendWidth, use tableWidth instead.');
        }
        if (typeof options.margins !== 'undefined') {
            if (typeof options.margin === 'undefined')
                options.margin = options.margins;
            console.error('Use of deprecated option: margins, use margin instead.');
        }
        if (options.startY && typeof options.startY !== 'number') {
            console.error('Invalid value for startY option', options.startY);
            delete options.startY;
        }
        if (!options.didDrawPage &&
            (options.afterPageContent ||
                options.beforePageContent ||
                options.afterPageAdd)) {
            console.error('The afterPageContent, beforePageContent and afterPageAdd hooks are deprecated. Use didDrawPage instead');
            options.didDrawPage = function (data) {
                doc.applyStyles(doc.userStyles);
                if (options.beforePageContent)
                    options.beforePageContent(data);
                doc.applyStyles(doc.userStyles);
                if (options.afterPageContent)
                    options.afterPageContent(data);
                doc.applyStyles(doc.userStyles);
                if (options.afterPageAdd && data.pageNumber > 1) {
                    ;
                    data.afterPageAdd(data);
                }
                doc.applyStyles(doc.userStyles);
            };
        }
        ;
        [
            'createdHeaderCell',
            'drawHeaderRow',
            'drawRow',
            'drawHeaderCell',
        ].forEach(function (name) {
            if (options[name]) {
                console.error("The \"" + name + "\" hook has changed in version 3.0, check the changelog for how to migrate.");
            }
        });
        [
            ['showFoot', 'showFooter'],
            ['showHead', 'showHeader'],
            ['didDrawPage', 'addPageContent'],
            ['didParseCell', 'createdCell'],
            ['headStyles', 'headerStyles'],
        ].forEach(function (_a) {
            var current = _a[0], deprecated = _a[1];
            if (options[deprecated]) {
                console.error("Use of deprecated option " + deprecated + ". Use " + current + " instead");
                options[current] = options[deprecated];
            }
        });
        [
            ['padding', 'cellPadding'],
            ['lineHeight', 'rowHeight'],
            'fontSize',
            'overflow',
        ].forEach(function (o) {
            var deprecatedOption = typeof o === 'string' ? o : o[0];
            var style = typeof o === 'string' ? o : o[1];
            if (typeof options[deprecatedOption] !== 'undefined') {
                if (typeof options.styles[style] === 'undefined') {
                    options.styles[style] = options[deprecatedOption];
                }
                console.error('Use of deprecated option: ' +
                    deprecatedOption +
                    ', use the style ' +
                    style +
                    ' instead.');
            }
        });
        for (var _i = 0, _a = [
            'styles',
            'bodyStyles',
            'headStyles',
            'footStyles',
        ]; _i < _a.length; _i++) {
            var styleProp = _a[_i];
            checkStyles(options[styleProp] || {});
        }
        var columnStyles = options['columnStyles'] || {};
        for (var _b = 0, _c = Object.keys(columnStyles); _b < _c.length; _b++) {
            var key = _c[_b];
            checkStyles(columnStyles[key] || {});
        }
    };
    for (var _i = 0, _a = [global, document, current]; _i < _a.length; _i++) {
        var options = _a[_i];
        _loop_1(options);
    }
}
exports.default = default_1;
function checkStyles(styles) {
    if (styles.rowHeight) {
        console.error('Use of deprecated style rowHeight. It is renamed to minCellHeight.');
        if (!styles.minCellHeight) {
            styles.minCellHeight = styles.rowHeight;
        }
    }
    else if (styles.columnWidth) {
        console.error('Use of deprecated style columnWidth. It is renamed to cellWidth.');
        if (!styles.cellWidth) {
            styles.cellWidth = styles.columnWidth;
        }
    }
}


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var HookData = /** @class */ (function () {
    function HookData(table, doc) {
        this.table = table;
        this.pageNumber = table.pageNumber;
        this.pageCount = this.pageNumber;
        this.settings = table.settings;
        this.cursor = table.cursor;
        this.doc = doc.getDocument();
    }
    return HookData;
}());
exports.HookData = HookData;
var CellHookData = /** @class */ (function (_super) {
    __extends(CellHookData, _super);
    function CellHookData(table, doc, cell, row, column) {
        var _this = _super.call(this, table, doc) || this;
        _this.cell = cell;
        _this.row = row;
        _this.column = column;
        _this.section = row.section;
        return _this;
    }
    return CellHookData;
}(HookData));
exports.CellHookData = CellHookData;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = __webpack_require__(0);
/**
 * Calculate the column widths
 */
function calculateWidths(doc, table) {
    var resizableColumns = [];
    var initialTableWidth = 0;
    table.columns.forEach(function (column) {
        var customWidth = column.getMaxCustomCellWidth(table);
        if (customWidth) {
            // final column width
            column.width = customWidth;
        }
        else {
            // initial column width (will be resized)
            column.width = column.wrappedWidth;
            resizableColumns.push(column);
        }
        initialTableWidth += column.width;
    });
    // width difference that needs to be distributed
    var resizeWidth = table.width - initialTableWidth;
    // first resize attempt: with respect to minReadableWidth and minWidth
    if (resizeWidth) {
        resizeWidth = resizeColumns(resizableColumns, resizeWidth, function (column) {
            return Math.max(column.minReadableWidth, column.minWidth);
        });
    }
    // second resize attempt: ignore minReadableWidth but respect minWidth
    if (resizeWidth) {
        resizeWidth = resizeColumns(resizableColumns, resizeWidth, function (column) { return column.minWidth; });
    }
    resizeWidth = Math.abs(resizeWidth);
    if (resizeWidth > 1e-10) {
        // Table can't get smaller due to custom-width or minWidth restrictions
        // We can't really do much here. Up to user to for example
        // reduce font size, increase page size or remove custom cell widths
        // to allow more columns to be reduced in size
        resizeWidth = resizeWidth < 1 ? resizeWidth : Math.round(resizeWidth);
        console.error("Of the table content, " + resizeWidth + " units width could not fit page");
    }
    applyColSpans(table);
    fitContent(table, doc);
    applyRowSpans(table);
}
exports.calculateWidths = calculateWidths;
/**
 * Distribute resizeWidth on passed resizable columns
 */
function resizeColumns(columns, resizeWidth, getMinWidth) {
    var initialResizeWidth = resizeWidth;
    var sumWrappedWidth = columns.reduce(function (acc, column) { return acc + column.wrappedWidth; }, 0);
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        var ratio = column.wrappedWidth / sumWrappedWidth;
        var suggestedChange = initialResizeWidth * ratio;
        var suggestedWidth = column.width + suggestedChange;
        var minWidth = getMinWidth(column);
        var newWidth = suggestedWidth < minWidth ? minWidth : suggestedWidth;
        resizeWidth -= newWidth - column.width;
        column.width = newWidth;
    }
    resizeWidth = Math.round(resizeWidth * 1e10) / 1e10;
    // Run the resizer again if there's remaining width needs
    // to be distributed and there're columns that can be resized
    if (resizeWidth) {
        var resizableColumns = columns.filter(function (column) {
            return resizeWidth < 0
                ? column.width > getMinWidth(column) // check if column can shrink
                : true; // check if column can grow
        });
        if (resizableColumns.length) {
            resizeWidth = resizeColumns(resizableColumns, resizeWidth, getMinWidth);
        }
    }
    return resizeWidth;
}
exports.resizeColumns = resizeColumns;
function applyRowSpans(table) {
    var rowSpanCells = {};
    var colRowSpansLeft = 1;
    var all = table.allRows();
    for (var rowIndex = 0; rowIndex < all.length; rowIndex++) {
        var row = all[rowIndex];
        for (var _i = 0, _a = table.columns; _i < _a.length; _i++) {
            var column = _a[_i];
            var data = rowSpanCells[column.index];
            if (colRowSpansLeft > 1) {
                colRowSpansLeft--;
                delete row.cells[column.index];
            }
            else if (data) {
                data.cell.height += row.height;
                if (data.cell.height > row.maxCellHeight) {
                    data.row.maxCellHeight = data.cell.height;
                }
                colRowSpansLeft = data.cell.colSpan;
                delete row.cells[column.index];
                data.left--;
                if (data.left <= 1) {
                    delete rowSpanCells[column.index];
                }
            }
            else {
                var cell = row.cells[column.index];
                if (!cell) {
                    continue;
                }
                cell.height = row.height;
                if (cell.rowSpan > 1) {
                    var remaining = all.length - rowIndex;
                    var left = cell.rowSpan > remaining ? remaining : cell.rowSpan;
                    rowSpanCells[column.index] = { cell: cell, left: left, row: row };
                }
            }
        }
        if (row.section === 'head') {
            table.headHeight += row.maxCellHeight;
        }
        if (row.section === 'foot') {
            table.footHeight += row.maxCellHeight;
        }
        table.height += row.height;
    }
}
function applyColSpans(table) {
    var all = table.allRows();
    for (var rowIndex = 0; rowIndex < all.length; rowIndex++) {
        var row = all[rowIndex];
        var colSpanCell = null;
        var combinedColSpanWidth = 0;
        var colSpansLeft = 0;
        for (var columnIndex = 0; columnIndex < table.columns.length; columnIndex++) {
            var column = table.columns[columnIndex];
            // Width and colspan
            colSpansLeft -= 1;
            if (colSpansLeft > 1 && table.columns[columnIndex + 1]) {
                combinedColSpanWidth += column.width;
                delete row.cells[column.index];
            }
            else if (colSpanCell) {
                var cell = colSpanCell;
                delete row.cells[column.index];
                colSpanCell = null;
                cell.width = column.width + combinedColSpanWidth;
            }
            else {
                var cell = row.cells[column.index];
                if (!cell)
                    continue;
                colSpansLeft = cell.colSpan;
                combinedColSpanWidth = 0;
                if (cell.colSpan > 1) {
                    colSpanCell = cell;
                    combinedColSpanWidth += column.width;
                    continue;
                }
                cell.width = column.width + combinedColSpanWidth;
            }
        }
    }
}
function fitContent(table, doc) {
    var rowSpanHeight = { count: 0, height: 0 };
    for (var _i = 0, _a = table.allRows(); _i < _a.length; _i++) {
        var row = _a[_i];
        for (var _b = 0, _c = table.columns; _b < _c.length; _b++) {
            var column = _c[_b];
            var cell = row.cells[column.index];
            if (!cell)
                continue;
            doc.applyStyles(cell.styles, true);
            var textSpace = cell.width - cell.padding('horizontal');
            if (cell.styles.overflow === 'linebreak') {
                // Add one pt to textSpace to fix rounding error
                cell.text = doc.splitTextToSize(cell.text, textSpace + 1 / doc.scaleFactor(), { fontSize: cell.styles.fontSize });
            }
            else if (cell.styles.overflow === 'ellipsize') {
                cell.text = ellipsize(cell.text, textSpace, cell.styles, doc, '...');
            }
            else if (cell.styles.overflow === 'hidden') {
                cell.text = ellipsize(cell.text, textSpace, cell.styles, doc, '');
            }
            else if (typeof cell.styles.overflow === 'function') {
                cell.text = cell.styles.overflow(cell.text, textSpace);
            }
            cell.contentHeight = cell.getContentHeight(doc.scaleFactor());
            if (cell.styles.minCellHeight > cell.contentHeight) {
                cell.contentHeight = cell.styles.minCellHeight;
            }
            var realContentHeight = cell.contentHeight / cell.rowSpan;
            if (cell.rowSpan > 1 &&
                rowSpanHeight.count * rowSpanHeight.height <
                    realContentHeight * cell.rowSpan) {
                rowSpanHeight = { height: realContentHeight, count: cell.rowSpan };
            }
            else if (rowSpanHeight && rowSpanHeight.count > 0) {
                if (rowSpanHeight.height > realContentHeight) {
                    realContentHeight = rowSpanHeight.height;
                }
            }
            if (realContentHeight > row.height) {
                row.height = realContentHeight;
                row.maxCellHeight = realContentHeight;
            }
        }
        rowSpanHeight.count--;
    }
}
function ellipsize(text, width, styles, doc, overflow) {
    return text.map(function (str) { return ellipsizeStr(str, width, styles, doc, overflow); });
}
exports.ellipsize = ellipsize;
function ellipsizeStr(text, width, styles, doc, overflow) {
    var precision = 10000 * doc.scaleFactor();
    width = Math.ceil(width * precision) / precision;
    if (width >= common_1.getStringWidth(text, styles, doc)) {
        return text;
    }
    while (width < common_1.getStringWidth(text + overflow, styles, doc)) {
        if (text.length <= 1) {
            break;
        }
        text = text.substring(0, text.length - 1);
    }
    return text.trim() + overflow;
}


/***/ }),
/* 15 */
/***/ (function(module, exports) {

if(typeof __WEBPACK_EXTERNAL_MODULE__15__ === 'undefined') {var e = new Error("Cannot find module 'undefined'"); e.code = 'MODULE_NOT_FOUND'; throw e;}
module.exports = __WEBPACK_EXTERNAL_MODULE__15__;

/***/ })
/******/ ]);
});