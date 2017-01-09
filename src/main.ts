'use strict';

import * as jsPDF from 'jspdf';
import {Config, FONT_ROW_RATIO} from './config';
import {addContentHooks, addPage, addTableLine} from './common';
import {printRow, printFullRow} from './painter';
import {calculateWidths} from './calculator';
import {createModels, validateInput} from './creator';

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

    Config.createTable(Config.initSettings(userOptions));
    let table = Config.tableInstance();
    let settings = table.settings;

    
    // Create the table model with its columns, rows and cells
    createModels(headers, data);
    calculateWidths(this, Config.pageSize().width);

    let minTableBottomPos = settings.startY + settings.margin.bottom + table.headerRow.height;
    if (settings.pageBreak === 'avoid') {
        minTableBottomPos += table.height;
    }
    let pageHeight = Config.pageSize().height;
    if ((settings.pageBreak === 'always' && settings.startY !== false) ||
        (settings.startY !== false && minTableBottomPos > pageHeight)) {
        Config.getJspdfInstance().addPage();
        table.cursor.y = settings.margin.top;
    }
    table.pageStartX = table.cursor.x;
    table.pageStartY = table.cursor.y;

    Config.applyStyles(Config.getUserStyles());
    if (settings.showHeader === true || settings.showHeader === 'firstPage' || settings.showHeader === 'everyPage') {
        printRow(table.headerRow, settings.drawHeaderRow, settings.drawHeaderCell);
    }
    Config.applyStyles(Config.getUserStyles());

    table.rows.forEach(function (row) {
        printFullRow(row, settings.drawRow, settings.drawCell);
    });

    addTableLine();
    addContentHooks();
    
    doc.autoTablePreviousCursor = table.cursor;

    return this;
};

/**
 * Returns the Y position of the last drawn cell
 * @returns int
 */
jsPDF.API.autoTableEndPosY = function () {
    let cursor = Config.getJspdfInstance().autoTablePreviousCursor;
    if (cursor && typeof cursor.y === 'number') {
        return cursor.y;
    } else {
        return 0;
    }
};

jsPDF.API.autoTableAddPageContent = function (hook) {
    if (typeof hook !== "function") {
        console.error("A function has to be provided to autoTableAddPageContent, got: " + typeof hook);
        return;
    }
    Config.setPageContentHook(hook);
};

/**
 * @deprecated Use data.addPage in hooks instead
 */
jsPDF.API.autoTableAddPage = function() {
    addPage();
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
            Object.keys(columns).forEach(function(key) {
                let cell = tableRow.cells[key];
                rowData.push(cell);
            });
            rows.push(rowData);
        }
    }

    let values = Object.keys(columns).map(function(key) { return columns[key] });
    return {columns: values, rows: rows, data: rows};
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
    let splitText = null;
    let lineCount = 1;
    if (styles.valign === 'middle' || styles.valign === 'bottom' || styles.halign === 'center' || styles.halign === 'right') {
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
        let alignSize = fontSize;
        if (styles.halign === 'center')
            alignSize *= 0.5;

        if (lineCount >= 1) {
            for (let iLine = 0; iLine < splitText.length; iLine++) {
                this.text(splitText[iLine], x - this.getStringUnitWidth(splitText[iLine]) * alignSize, y);
                y += fontSize;
            }
            return Config.getJspdfInstance();
        }
        x -= this.getStringUnitWidth(text) * alignSize;
    }

    this.text(text, x, y);

    return Config.getJspdfInstance();
};