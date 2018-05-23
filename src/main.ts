'use strict';

import * as jsPDF from 'jspdf';
import {Config, FONT_ROW_RATIO, getDefaults} from './config';
import {addContentHooks, addPage, nextPage, addTableBorder} from './common';
import {printRow, printFullRow} from './painter';
import {calculateWidths} from './calculator';
import {createModels, validateInput} from './creator';

/**
 * Create a table from a set of rows and columns.
 *
 * @param {Object[]|String[]} headers Either as an array of objects or array of strings
 * @param {Object[][]|String[][]} data Either as an array of objects or array of strings
 * @param {Object} [tableOptions={}] Options that will override the default ones
 */
jsPDF.API.autoTable = function (headers, data, tableOptions = {}) {
    this.autoTableState = this.autoTableState || {};
    jsPDF.autoTableState = jsPDF.autoTableState || {};
    
    let allOptions = [jsPDF.autoTableState.defaults || {}, this.autoTableState.defaults || {}, tableOptions || {}];
    validateInput(headers, data, allOptions);
    
    let table = Config.createTable(this);
    Config.initSettings(table, allOptions);
    let settings = table.settings;
    
    // Create the table model with its columns, rows and cells
    createModels(headers, data);
    settings.margin = Config.marginOrPadding(settings.margin, getDefaults().margin);
    calculateWidths(this, Config.pageSize().width);

    table.cursor = {
        x: table.margin('left'),
        y: settings.startY === false ? table.margin('top') : settings.startY
    };

    let minTableBottomPos = settings.startY + table.margin('bottom') + table.headerRow.height;
    if (settings.pageBreak === 'avoid') {
        minTableBottomPos += table.height;
    }
    let pageHeight = Config.pageSize().height;
    if ((settings.pageBreak === 'always' && settings.startY !== false) ||
        (settings.startY !== false && minTableBottomPos > pageHeight)) {
        nextPage(table.doc);
        table.cursor.y = table.margin('top');
    }
    table.pageStartX = table.cursor.x;
    table.pageStartY = table.cursor.y;

    Config.applyUserStyles();
    if (settings.showHeader === true || settings.showHeader === 'firstPage' || settings.showHeader === 'everyPage') {
        printRow(table.headerRow, table.hooks.drawHeaderRow, table.hooks.drawHeaderCell);
    }
    Config.applyUserStyles();

    table.rows.forEach(function (row) {
        printFullRow(row, table.hooks.drawRow, table.hooks.drawCell);
    });

    addTableBorder();

    // Don't call global and document addPageContent more than once for each page
    let pageNumber = this.internal.getCurrentPageInfo().pageNumber;
    if (this.autoTableState.addPageHookPages && this.autoTableState.addPageHookPages[pageNumber]) {
        if (typeof tableOptions['addPageContent'] === 'function') {
            tableOptions['addPageContent'](Config.hooksData());
        }
    } else {
        if (!this.autoTableState.addPageHookPages) this.autoTableState.addPageHookPages = {};
        this.autoTableState.addPageHookPages[pageNumber] = true;
        addContentHooks();
    }
    
    table.finalY = table.cursor.y;
    this.autoTable.previous = table;

    Config.applyUserStyles();
    
    return this;
};

// Enables doc.autoTable.previous.finalY || 40;
jsPDF.API.autoTable.previous = false;

jsPDF.API.autoTableSetDefaults = function(defaults) {
    if (!this.autoTableState) this.autoTableState = {};
    
    if (defaults && typeof defaults === 'object') {
        this.autoTableState.defaults = defaults;
    } else {
        delete this.autoTableState.defaults;
    }
    
    return this;
};

jsPDF.autoTableSetDefaults = function(defaults) {
    if (!jsPDF.autoTableState) jsPDF.autoTableState = {};
    
    if (defaults && typeof defaults === 'object') {
        this.autoTableState.defaults = defaults;
    } else {
        delete this.autoTableState.defaults;
    }
    
    jsPDF.autoTableState.defaults = defaults;
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
            return this;
        }
        x -= this.getStringUnitWidth(text) * alignSize;
    }

    this.text(text, x, y);

    return this;
};

/**
 * @deprecated Use doc.autoTable.previous.finalY instead
 */
jsPDF.API.autoTableEndPosY = function () {
    let prev = this.autoTable.previous;
    if (prev.cursor && typeof prev.cursor.y === 'number') {
        return prev.cursor.y;
    } else {
        return 0;
    }
};

/**
 * @deprecated Use jsPDF.autoTableSetDefaults({addPageContent: function() {}}) instead
 */
jsPDF.API.autoTableAddPageContent = function (hook) {
    if (!jsPDF.API.autoTable.globalDefaults) {
        jsPDF.API.autoTable.globalDefaults = {};
    }
    jsPDF.API.autoTable.globalDefaults.addPageContent = hook;
    return this;
};

/**
 * @deprecated Use data.addPage in hooks instead
 */
jsPDF.API.autoTableAddPage = function() {
    addPage();
    return this;
};