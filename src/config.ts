/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
export let FONT_ROW_RATIO = 1.15;
import state from './state';

export function defaultConfig() {
    return {
        // Html content
        html: null, // HTML table element or a CSS selector pointing towards one

        // Custom content
        head: null,
        body: null,
        foot: null,

        // Properties
        includeHiddenHtml: false,
        startY: null, // Defaults to margin top value if not set
        margin: 40 / state().scaleFactor(),
        pageBreak: 'auto',
        rowPageBreak: 'auto',
        tableWidth: 'auto', // 'auto'|'wrap'|number
        showHead: 'everyPage', // 'everyPage', 'firstPage', 'never',
        showFoot: 'everyPage', // 'everyPage', 'lastPage', 'never',
        tableLineWidth: 0,
        tableLineColor: 200,
        tableId: null,

        // Styling
        theme: 'striped', // 'striped', 'grid', 'plain', 'css'
        useCss: false,
        styles: {},
        headStyles: {},
        bodyStyles: {},
        footStyles: {},
        alternateRowStyles: {},
        columnStyles: {},

        // Hooks
        // Use to change the content of the cell before width calculations etc are performed
        didParseCell: function(data) {
        },
        willDrawCell: function(data) {
        },
        // Use to draw additional content such as images in table cells
        didDrawCell: function(data) {
        },
        // Use to draw additional content to each page such as headers and footers
        didDrawPage: function(data) {
        },
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
        halign: 'left', // left, center, right, justify
        valign: 'top', // top, middle, bottom
        fontSize: 10,
        cellPadding: 5 / state().scaleFactor(), // number or {top,left,right,left,vertical,horizontal}
        lineColor: 200,
        lineWidth: 0 / state().scaleFactor(),
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