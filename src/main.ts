'use strict';

import * as jsPDF from 'jspdf';
import {Config} from './config';
import {drawTable, addPage} from './painter';
import {calculateWidths} from './calculator';
import {parseInput, validateInput} from './inputParser';
import autoText from './autoText';

/**
 * Create a table
 */
jsPDF.API.autoTable = function (tableOptions) {
    this.autoTableState = this.autoTableState || {};
    jsPDF.autoTableState = jsPDF.autoTableState || {};
    
    if (typeof arguments[0] === 'number') {
        tableOptions = arguments[1];
        tableOptions.startY = arguments[0];
    } else if (arguments.length >= 2 && Array.isArray(arguments[0])) {
        tableOptions = arguments[2] || {};
        if (!tableOptions.columns && !tableOptions.head && !tableOptions.body) {
            tableOptions.columns = [];

            let headers = arguments[0];
            if (!tableOptions.head) tableOptions.head = [[]];
            let dataKeys = [];
            headers.forEach(function (item, i) {
                if (item && item.dataKey != undefined) {
                    item = {dataKey: item.dataKey, content: item.title};
                } else {
                    item = {dataKey: i, content: item};
                }
                dataKeys.push(item.dataKey);
                tableOptions.head[0].push(item);
            });

            tableOptions.body = [];
            for (let rawRow of arguments[1]) {
                let row = {};
                for (let dataKey of dataKeys) {
                    row[dataKey] = rawRow[dataKey];
                }
                tableOptions.body.push(row);
            }
        }
    }
    
    let allOptions = [jsPDF.autoTableState.defaults || {}, this.autoTableState.defaults || {}, tableOptions || {}];
    validateInput(allOptions);
    
    // 1. Parse and unify user input
    let table = parseInput(this, allOptions);
    
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

let stat: any = jsPDF;
stat.autoTableSetDefaults = function(defaults) {
    let stat: any = jsPDF;
    if (!stat.autoTableState) stat.autoTableState = {};
    
    if (defaults && typeof defaults === 'object') {
        this.autoTableState.defaults = defaults;
    } else {
        delete this.autoTableState.defaults;
    }
    
    jsPDF.autoTableState.defaults = defaults;
    
    return this;
};

/**
 * @Deprecated. Use fromHtml option instead
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