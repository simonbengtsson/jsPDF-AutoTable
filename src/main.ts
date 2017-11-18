'use strict';

import {drawTable, addPage} from './tableDrawer';
import {calculateWidths} from './widthCalculator';
import {parseInput} from './inputParser';
import {setDefaults, setupState, resetState} from './state';
import './autoTableText';
import {applyUserStyles} from "./common";

const jsPDF = require('jspdf');

jsPDF.API.autoTable = function() {
    setupState(this);

    // 1. Parse and unify user input
    let table = parseInput(arguments);

    // 2. Calculate preliminary table, column, row and cell dimensions
    calculateWidths(table);

    // 3. Output table to pdf
    drawTable(table);

    table.finalY = table.cursor.y;
    this.previousAutoTable = table;
    this.autoTable.previous = table; // Deprecated

    applyUserStyles();
    resetState();
    return this;
};

// Assign false to enable `doc.previousAutoTable.finalY || 40` sugar;
jsPDF.API.previousAutoTable = false;

jsPDF.API.autoTableSetDefaults = function(defaults) {
    setDefaults(defaults, this);
    return this;
};

jsPDF.autoTableSetDefaults = function(defaults, doc) {
    setDefaults(defaults, doc);
    return this;
};

// @deprecated
jsPDF.API.autoTable.previous = false;

/**
 * @Deprecated. Use html option instead
 */
jsPDF.API.autoTableHtmlToJson = function(tableElem, includeHiddenElements) {
    console.error("Use of deprecated function: autoTableHtmlToJson. Use html option instead.");
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

    let values = Object.keys(columns).map(function(key) {
        return columns[key]
    });
    return {columns: values, rows: rows, data: rows};
};

/**
 * @deprecated
 */
jsPDF.API.autoTableEndPosY = function() {
    console.error("Use of deprecated function: autoTableEndPosY. Use doc.previousAutoTable.finalY instead.");
    let prev = this.previousAutoTable;
    if (prev.cursor && typeof prev.cursor.y === 'number') {
        return prev.cursor.y;
    } else {
        return 0;
    }
};

/**
 * @deprecated
 */
jsPDF.API.autoTableAddPageContent = function(hook) {
    console.error("Use of deprecated function: autoTableAddPageContent. Use jsPDF.autoTableSetDefaults({addPageContent: function() {}}) instead.");
    if (!jsPDF.API.autoTable.globalDefaults) {
        jsPDF.API.autoTable.globalDefaults = {};
    }
    jsPDF.API.autoTable.globalDefaults.addPageContent = hook;
    return this;
};

/**
 * @deprecated
 */
jsPDF.API.autoTableAddPage = function() {
    console.error("Use of deprecated function: autoTableAddPage. Use event.addPage() in eventHandler instead.");
    addPage();
    return this;
};