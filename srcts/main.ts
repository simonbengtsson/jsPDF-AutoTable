'use strict';

declare function require(path: string): any;
var jsPDF = require('jspdf');

import {FONT_ROW_RATIO} from './config';
import {putTable} from './painter';
import {calculateWidths} from './calculator';
import {createModel} from './inputParser';
import {parseHtml} from './htmlParser';

/**
 * Creates a table
 */
jsPDF.API.autotable = function (tableSettings) {
    let originalFontSize = this.internal.getFontSize();
    let originalFontStyle = this.internal.getFont().fontStyle;
    
    // 1. Create the table model with its columns, rows and cells
    let table = createModel(this, this.autotableGlobalSettings, this.autotableDocumentSettings, tableSettings);
    
    // 2. Calculate column and cell sizes
    calculateWidths(table);
    
    // 3. Draw table on page
    putTable(table);

    table.finalY = table.cursor.y;
    jsPDF.API['autotable'].previous = table;

    this.setFontStyle(originalFontStyle);
    this.setFontSize(originalFontSize);

    return this;
};

jsPDF.API['autotableSetDefaults'] = function(settings) {
    if (typeof settings !== 'object') {
        return console.error('An object as to be passed to autotable.setDefaults()');
    }
    
    if (this && this.internal) {
        this['autotableDocumentSettings'] = settings;
    } else {
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
    let k = this.internal.scaleFactor;
    let fontSize = this.internal.getFontSize() / k;

    let splitRegex = /\r\n|\r|\n/g;
    let splitText = [];
    let lineCount = 1;
    if (styles.valign === 'middle' || styles.valign === 'bottom' || styles.halign === 'center' || styles.halign === 'right') {
        splitText = Array.isArray(text) ? text : text.split(splitRegex);

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

jsPDF.API.autotable.previous = false;

// @deprecated Included for better compatibility with 2.x
jsPDF.API.autoTable = jsPDF.API.autotable;
jsPDF.API.autoTableText = jsPDF.API.autotableText;
jsPDF.API.autoTableSetDefaults = jsPDF.API.autotableSetDefaults;
jsPDF.API.autoTableHtmlToJson = function(tableElem, includeHiddenElements) {
    let res = parseHtml(tableElem, !includeHiddenElements);
    return {columns: res.head, data: res.body, rows: res.body};
};
jsPDF.API.autoTableEndPosY = function() {
    return this.autotable.previous.finalY || 0;
};