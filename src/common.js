import {Config} from './config.js';
import {printRow} from './painter.js';

export function getStringWidth(text, styles) {
    let k = Config.getJspdfInstance().internal.scaleFactor;
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
export function ellipsize(text, width, styles, ellipsizeStr) {
    ellipsizeStr = typeof  ellipsizeStr !== 'undefined' ? ellipsizeStr : '...';

    if (Array.isArray(text)) {
        let value = [];
        text.forEach(function (str, i) {
            value[i] = ellipsize(str, width, styles, ellipsizeStr);
        });
        return value;
    }

    let k = Config.getJspdfInstance().internal.scaleFactor;
    let precision = 10000 * k;
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

export function addPage() {
    // Add user content just before adding new page ensure it will 
    // be drawn above other things on the page
    let settings = Config.settings();
    addContentHooks();
    Config.getJspdfInstance().addPage();
    Config.tableInstance().pageCount++;
    Config.getJspdfInstance().autoTableCursor = {x: settings.margin.left, y: settings.margin.top};
    if (settings.showHeader === true || settings.showHeader === 'always') {
        printRow(Config.tableInstance().headerRow, settings.drawHeaderRow, settings.drawHeaderCell);
    }
}

export function addContentHooks() {
    Config.applyStyles(Config.getUserStyles());
    Config.settings().addPageContent(Config.hooksData());
    Config.applyStyles(Config.getUserStyles());
    Config.callPageContentHook(Config.hooksData());
    Config.applyStyles(Config.getUserStyles());
}