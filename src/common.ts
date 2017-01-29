import {Config} from './config';
import state from './state';

export function getStringWidth(text, styles) {
    let fontSize = styles.fontSize / state().scaleFactor;
    Config.applyStyles(styles);
    text = Array.isArray(text) ? text : [text];
    let maxWidth = 0;
    text.forEach(function(line) {
        let width = state().doc.getStringUnitWidth(line);
        if (width > maxWidth) {
            maxWidth = width;
        }
    });
    let precision = 10000 * state().scaleFactor;
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

    let precision = 10000 * state().scaleFactor;
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
    let table = state().table;
    let styles = {lineWidth: table.settings.tableLineWidth, lineColor: table.settings.tableLineColor};
    Config.applyStyles(styles);
    let fs = getFillStyle(styles);
    if (fs) {
        table.doc.rect(table.pageStartX, table.pageStartY, table.width, table.cursor.y - table.pageStartY, fs); 
    }
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