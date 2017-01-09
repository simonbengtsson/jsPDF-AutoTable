import {Config} from './config';
import {printRow} from './painter';

export function getStringWidth(text, styles) {
    let k = Config.scaleFactor();
    let fontSize = styles.fontSize / k;
    Config.applyStyles(styles);
    text = Array.isArray(text) ? text : [text];
    let maxWidth = 0;
    text.forEach(function(line) {
        let width = Config.getJspdfInstance().getStringUnitWidth(line);
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

export function addTableLine() {
    let table = Config.tableInstance();
    let doc = Config.getJspdfInstance();
    let styles = {lineWidth: table.settings.tableLineWidth, lineColor: table.settings.tableLineColor};
    Config.applyStyles(styles);
    let fs = getFillStyle(styles);
    if (fs) {
        doc.rect(table.pageStartX, table.pageStartY, table.width, table.cursor.y - table.pageStartY, fs); 
    }
}

export function addPage() {
    let table = Config.tableInstance();
    let doc = Config.getJspdfInstance();
    
    // Add user content just before adding new page ensure it will 
    // be drawn above other things on the page
    addContentHooks();
    addTableLine();
    doc.addPage();
    table.pageCount++;
    table.cursor = {x: table.margin('left'), y: table.margin('top')};
    table.pageStartX = table.cursor.x;
    table.pageStartY = table.cursor.y;
    if (table.settings.showHeader === true || table.settings.showHeader === 'everyPage') {
        printRow(table.headerRow, table.settings.drawHeaderRow, table.settings.drawHeaderCell);
    }
}

export function addContentHooks() {
    Config.applyStyles(Config.getUserStyles());
    Config.tableInstance().settings.addPageContent(Config.hooksData());
    Config.applyStyles(Config.getUserStyles());
    Config.callPageContentHook(Config.hooksData());
    Config.applyStyles(Config.getUserStyles());
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