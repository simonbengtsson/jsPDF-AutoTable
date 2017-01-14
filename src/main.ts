'use strict';

import * as jsPDF from 'jspdf';
import {Config} from './config';
import {drawTable, addPage} from './painter';
import {calculateWidths} from './calculator';
import {createModels, validateInput} from './creator';
import autoText from './autoText';

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
    
    // 1. Parse and unify user input
    let table = Config.createTable(this);
    Config.initSettings(table, allOptions);
    createModels(headers, data);
    
    // 2. Calculate preliminary table, column, row and cell dimensions
    calculateWidths(table);
    
    // 3. Output table to pdf
    drawTable(table, tableOptions);
    
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
    
    return this;
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
        if (window.console) {
            console.error("A HTMLTableElement has to be sent to autoTableHtmlToJson");
        }
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
jsPDF.API.autoTableText = autoText;

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