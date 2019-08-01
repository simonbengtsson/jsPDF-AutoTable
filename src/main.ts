'use strict';

import {drawTable, addPage} from './tableDrawer';
import {calculateWidths} from './widthCalculator';
import {parseInput} from './inputParser';
import {setDefaults, setupState, resetState} from './state';
import {applyUserStyles} from "./common";
import {UserOptions} from "./interfaces";

export type autoTable = (options: UserOptions) => void

export default function applyAutoTable(jsPDF: any) {

    function autoTable(options: UserOptions)
    function autoTable(...args) {
        setupState(this);

        // 1. Parse and unify user input
        let table = parseInput(args);

        // 2. Calculate preliminary table, column, row and cell dimensions
        calculateWidths(table);

        // 3. Output table to pdf
        drawTable(table);

        table.finalY = table.cursor.y;
        this.previousAutoTable = table;
        this.lastAutoTable = table;
        this.autoTable.previous = table; // Deprecated

        applyUserStyles();
        resetState();
        return this;
    }

    jsPDF.API.autoTable = autoTable;

// Assign false to enable `doc.lastAutoTable.finalY || 40` sugar;
    jsPDF.API.lastAutoTable = false;
    jsPDF.API.previousAutoTable = false; // deprecated in v3
    jsPDF.API.autoTable.previous = false; // deprecated in v3

    jsPDF.API.autoTableSetDefaults = function (defaults) {
        setDefaults(defaults, this);
        return this;
    };

    jsPDF.autoTableSetDefaults = function (defaults, doc) {
        setDefaults(defaults, doc);
        return this;
    };

    /**
     * @Deprecated. Use html option instead doc.autoTable(html: '#table')
     */
    jsPDF.API.autoTableHtmlToJson = function (tableElem, includeHiddenElements) {
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
                Object.keys(columns).forEach(function (key) {
                    let cell = tableRow.cells[key];
                    rowData.push(cell);
                });
                rows.push(rowData);
            }
        }

        let values = Object.keys(columns).map(function (key) {
            return columns[key]
        });
        return {columns: values, rows: rows, data: rows};
    };

    /**
     * @deprecated
     */
    jsPDF.API.autoTableEndPosY = function () {
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
    jsPDF.API.autoTableAddPageContent = function (hook) {
        console.error("Use of deprecated function: autoTableAddPageContent. Use jsPDF.autoTableSetDefaults({didDrawPage: () => {}}) instead.");
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
        console.error("Use of deprecated function: autoTableAddPage. Use doc.addPage()");
        this.addPage();
        return this;
    };

    /**
     * Improved text function with halign and valign support
     * Inspiration from: http://stackoverflow.com/questions/28327510/align-text-right-using-jspdf/28433113#28433113
     */
    jsPDF.API.autoTableText = function (text, x, y, styles) {
        styles = styles || {};
        let FONT_ROW_RATIO = 1.15;

        if (typeof x !== 'number' || typeof y !== 'number') {
            console.error('The x and y parameters are required. Missing for text: ', text);
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
                    y += fontSize * FONT_ROW_RATIO;
                }
                return this;
            }
            x -= this.getStringUnitWidth(text) * alignSize;
        }

        if (styles.halign === 'justify') {
            this.text(text, x, y, {maxWidth: styles.maxWidth || 100, align: 'justify'});
        } else {
            this.text(text, x, y);
        }


        return this;
    };

}
