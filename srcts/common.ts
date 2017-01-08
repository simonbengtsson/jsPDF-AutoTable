import {Config} from './config';
import {printRow} from './painter';

export function getStringWidth(table, text, styles) {
    let k = Config.scaleFactor(table);
    let fontSize = styles.fontSize / k;
    Config.applyStyles(table, styles);
    text = Array.isArray(text) ? text : [text];
    let maxWidth = 0;
    text.forEach(function(line) {
        let width = table.doc.getStringUnitWidth(line);
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
export function ellipsize(table, text, width, styles, ellipsizeStr = '...') {
    if (Array.isArray(text)) {
        let value = [];
        text.forEach(function (str, i) {
            value[i] = ellipsize(table, str, width, styles, ellipsizeStr);
        });
        return value;
    }

    let precision = 10000 * Config.scaleFactor(table);
    width = Math.ceil(width * precision) / precision;

    if (width >= getStringWidth(table, text, styles)) {
        return text;
    }
    while (width < getStringWidth(table, text + ellipsizeStr, styles)) {
        if (text.length <= 1) {
            break;
        }
        text = text.substring(0, text.length - 1);
    }
    return text.trim() + ellipsizeStr;
}

/**
 * Adds page footers, calls page content hooks, adds a new page and table headers
 */
export function addPage(table) {
    addContentHooks(true);
    table.doc.addPage();
    table.cursor = {x: table.margin('left'), y: table.margin('top')};
    table.pageCount++;
    if (table.settings.showHeader === true || table.settings.showHeader === 'always') {
        printRow(table, table.headerRow, table.settings.drawHeaderRow, table.settings.drawHeaderCell);
    }
}

export function addContentHooks(table, pageHasTable = true) {
    let data = Config.hooksData(table, {pageHasTable: pageHasTable});
    
    table.settings.addPageContent(data);
    
    //Config.callPageContentHook(data);
}