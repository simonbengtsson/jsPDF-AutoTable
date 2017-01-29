'use strict';

import * as jsPDF from 'jspdf';
import {Config} from './config';
import {drawTable, addPage} from './painter';
import {calculateWidths} from './calculator';
import {parseInput, parseArguments} from './inputParser';
import state, {setDefaults, setupState, resetState, globalSettings, documentSettings} from './state';
import './autoTableText';

/**
 * Create a table
 */
jsPDF.API.autoTable = function () {
    setupState(this);
    let tableSettings = parseArguments(arguments) || {};
    
    // 1. Parse and unify user input
    let table = parseInput(this, [globalSettings(), documentSettings(), tableSettings]);
    state().table = table;
    
    // 2. Calculate preliminary table, column, row and cell dimensions
    calculateWidths(table);
    
    // 3. Output table to pdf
    drawTable(table);
    
    table.finalY = table.cursor.y;
    this.previousAutoTable = table;
    this.autoTable.previous = table; // Deprecated
    
    Config.applyUserStyles();
    resetState();
    return this;
};

// Enables doc.previousAutoTable.finalY || 40;
jsPDF.API.previousAutoTable = false;
jsPDF.API.autoTable.previous = false; // Deprecated

jsPDF.API.autoTableSetDefaults = function(defaults) {
    setDefaults(defaults, this);
    return this;
};

jsPDF.autoTableSetDefaults = function(defaults, doc) {
    setDefaults(defaults, doc);
    return this;
};

/**
 * @Deprecated. Use fromHtml option instead
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
 * @deprecated Use doc.autoTable.previous.finalY instead
 */
jsPDF.API.autoTableEndPosY = function () {
    let prev = this.previousAutoTable;
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