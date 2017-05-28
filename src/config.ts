/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
export let FONT_ROW_RATIO = 1.15;
import state from './state';
import {assign} from './polyfills';

export function defaultConfig() {
    return {
        // Styling
        theme: 'auto', // 'striped', 'grid' or 'plain'
        styles: {},
        headStyles: {},
        bodyStyles: {},
        footStyles: {},
        alternateRowStyles: {},
        columnStyles: {},

        // Custom content
        head: null,
        body: null,
        foot: null,

        // Html content
        fromHtml: null,
        includeHiddenHtml: false,
        useCss: false,

        // Properties
        startY: false, // false indicates the margin top value
        margin: 40 / state().scaleFactor,
        avoidTableSplit: false,
        avoidRowSplit: false,
        tableWidth: 'auto', // 'auto'|'wrap'|number
        showHead: 'everyPage', // 'everyPage', 'firstPage', 'never',
        showFoot: 'everyPage', // 'everyPage', 'lastPage', 'never',
        tableLineWidth: 0,
        tableLineColor: 200,
        tableId: null,

        // Hooks
        willParseCell: function(data) {},
        didParseCell: function(data) {},
        willDrawCell: function(data) {},
        didDrawCell: function(data) {},
        didDrawPage: function(data) {},
        allSectionHooks: false, // By default the cell hooks are only called for body hooks
    }
}

// Base style for all themes
export function defaultStyles() {
    return {
        font: "helvetica", // helvetica, times, courier
        fontStyle: 'normal', // normal, bold, italic, bolditalic
        overflow: 'linebreak', // linebreak, ellipsize, visible or hidden
        fillColor: false, // Either false for transparent, rbg array e.g. [255, 255, 255] or gray level e.g 200
        textColor: 20,
        halign: 'left', // left, center, right
        valign: 'top', // top, middle, bottom
        fontSize: 10,
        cellPadding: 5 / state().scaleFactor, // number or {top,left,right,left,vertical,horizontal}
        lineColor: 200,
        lineWidth: 0 / state().scaleFactor,
        cellWidth: 'auto', // 'auto'|'wrap'|number
        minCellHeight: 0
    }
}

/**
 * Styles for the themes (overriding the default styles)
 */
export function getTheme(name) {
    let themes = {
        'striped': {
            table: {fillColor: 255, textColor: 80, fontStyle: 'normal'},
            head: {textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold'},
            body: {},
            foot: {textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold'},
            alternateRow: {fillColor: 245}
        },
        'grid': {
            table: {fillColor: 255, textColor: 80, fontStyle: 'normal', lineWidth: 0.1},
            head: {textColor: 255, fillColor: [26, 188, 156], fontStyle: 'bold', lineWidth: 0},
            body: {},
            foot: {textColor: 255, fillColor: [26, 188, 156], fontStyle: 'bold', lineWidth: 0},
            alternateRow: {}
        },
        'plain': {
            head: {fontStyle: 'bold'},
            foot: {fontStyle: 'bold'}
        }
    };
    return themes[name];
}