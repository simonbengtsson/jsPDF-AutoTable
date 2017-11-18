const jsPDF = require('jspdf');

/**
 * Improved text function with halign and valign support
 * Inspiration from: http://stackoverflow.com/questions/28327510/align-text-right-using-jspdf/28433113#28433113
 */
jsPDF.API.autoTableText = function(text, x, y, styles) {
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
                y += fontSize;
            }
            return this;
        }
        x -= this.getStringUnitWidth(text) * alignSize;
    }

    this.text(text, x, y);

    return this;
};