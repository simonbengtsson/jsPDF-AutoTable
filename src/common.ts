import {Config} from './config';
import {printRow} from './painter';

export function getStringWidth(text, styles) {
    let k = Config.scaleFactor();
    let fontSize = styles.fontSize / k;
    Config.applyStyles(styles);
    text = Array.isArray(text) ? text : [text];
    let maxWidth = 0;
    text.forEach(function(line) {
        let width = Config.tableInstance().doc.getStringUnitWidth(line);
        if (width > maxWidth) {
            maxWidth = width;
        }
    });
    let precision = 10000 * k;
    maxWidth = Math.floor(maxWidth * precision) / precision;
    return maxWidth * fontSize;
}

/**
 * Ellipsize the text to fit in the width
 */
export function ellipsize(text, width, styles, ellipsizeStr = '...') {

    if (Array.isArray(text)) {
        let value = [];
        text.forEach(function (str, i) {
            value[i] = ellipsize(str, width, styles, ellipsizeStr);
        });
        return value;
    }

    let precision = 10000 * Config.scaleFactor();
    width = Math.ceil(width * precision) / precision;

    if (width >= getStringWidth(text, styles)) {
        return text;
    }
    while (width < getStringWidth(text + ellipsizeStr, styles)) {
        if (text.length <= 1) {
            break;
        }
        text = text.substring(0, text.length - 1);
    }
    return text.trim() + ellipsizeStr;
}

export function addTableBorder() {
    let table = Config.tableInstance();
    let styles = {lineWidth: table.settings.tableLineWidth, lineColor: table.settings.tableLineColor};
    Config.applyStyles(styles);
    let fs = getFillStyle(styles);
    if (fs) {
        table.doc.rect(table.pageStartX, table.pageStartY, table.width, table.cursor.y - table.pageStartY, fs); 
    }
}

export function addPage() {
    let table = Config.tableInstance();
    table.finalY = table.cursor.y;
    
    // Add user content just before adding new page ensure it will 
    // be drawn above other things on the page
    addContentHooks();
    addTableBorder();
    nextPage(table.doc);
    table.pageCount++;
    table.cursor = {x: table.margin('left'), y: table.margin('top')};
    table.pageStartX = table.cursor.x;
    table.pageStartY = table.cursor.y;
    if (table.settings.showHeader === true || table.settings.showHeader === 'everyPage') {
        printRow(table.headerRow, table.hooks.drawHeaderRow, table.hooks.drawHeaderCell);
    }
}

export function addContentHooks() {
    for (let hook of Config.tableInstance().hooks.addPageContent) {
        Config.applyUserStyles();
        hook(Config.hooksData());
    }
    Config.applyUserStyles();
}

export function getFillStyle(styles) {
    let drawLine = styles.lineWidth > 0;
    let drawBackground = styles.fillColor || styles.fillColor === 0;
    if (drawLine && drawBackground) {
        return 'DF'; // Fill then stroke
    } else if (drawLine) {
        return 'S'; // Only stroke (transparent background)
    } else if (drawBackground) {
        return 'F'; // Only fill, no stroke
    } else {
        return false;
    }
}

export function nextPage(doc) {
    let current = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setPage(current + 1);
    let newCurrent = doc.internal.getCurrentPageInfo().pageNumber;

    if (newCurrent === current) {
        doc.addPage();
    }
}
