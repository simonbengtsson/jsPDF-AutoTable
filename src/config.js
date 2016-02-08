/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
export var FONT_ROW_RATIO = 1.15;

/**
 * Styles for the themes (overriding the default styles)
 */
export var themes = {
    'striped': {
        table: {fillColor: 255, textColor: 80, fontStyle: 'normal', fillStyle: 'F'},
        header: {textColor: 255, fillColor: [41, 128, 185], rowHeight: 23, fontStyle: 'bold'},
        body: {},
        alternateRow: {fillColor: 245}
    },
    'grid': {
        table: {fillColor: 255, textColor: 80, fontStyle: 'normal', lineWidth: 0.1, fillStyle: 'DF'},
        header: {textColor: 255, fillColor: [26, 188, 156], rowHeight: 23, fillStyle: 'F', fontStyle: 'bold'},
        body: {},
        alternateRow: {}
    },
    'plain': {
        header: {fontStyle: 'bold'}
    }
};

function getDefaults() {
    return {
        // Styling
        theme: 'striped', // 'striped', 'grid' or 'plain'
        styles: {},
        headerStyles: {},
        bodyStyles: {},
        alternateRowStyles: {},
        columnStyles: {},

        // Properties
        startY: false, // false indicates the margin.top value
        margin: 40,
        pageBreak: 'auto', // 'auto', 'avoid', 'always'
        tableWidth: 'auto', // number, 'auto', 'wrap'

        // Hooks
        createdHeaderCell: function (cell, data) {},
        createdCell: function (cell, data) {},
        drawHeaderRow: function (row, data) {},
        drawRow: function (row, data) {},
        drawHeaderCell: function (cell, data) {},
        drawCell: function (cell, data) {},
        beforePageContent: function (data) {},
        afterPageContent: function (data) {}
    }
}

// Base style for all themes
function defaultStyles() {
    return {
        cellPadding: 5,
        fontSize: 10,
        font: "helvetica", // helvetica, times, courier
        lineColor: 200,
        lineWidth: 0.1,
        fontStyle: 'normal', // normal, bold, italic, bolditalic
        overflow: 'ellipsize', // visible, hidden, ellipsize or linebreak
        fillColor: 255,
        textColor: 20,
        halign: 'left', // left, center, right
        valign: 'top', // top, middle, bottom
        fillStyle: 'F', // 'S', 'F' or 'DF' (stroke, fill or fill then stroke)
        rowHeight: 20,
        columnWidth: 'auto'
    }
}

export class Config {

    static initSettings(userOptions) {
        var settings = Object.assign({}, getDefaults(), userOptions);

        // Options
        if (typeof settings.extendWidth !== 'undefined') {
            settings.tableWidth = settings.extendWidth ? 'auto' : 'wrap';
            console.error("Use of deprecated option: extendWidth, use tableWidth instead.");
        }
        if (typeof settings.margins !== 'undefined') {
            if (typeof settings.margin === 'undefined') settings.margin = settings.margins;
            console.error("Use of deprecated option: margins, use margin instead.");
        }

        [['padding', 'cellPadding'], ['lineHeight', 'rowHeight'], 'fontSize', 'overflow'].forEach(function (o) {
            var deprecatedOption = typeof o === 'string' ? o : o[0];
            var style = typeof o === 'string' ? o : o[1];
            if (typeof settings[deprecatedOption] !== 'undefined') {
                if (typeof settings.styles[style] === 'undefined') {
                    settings.styles[style] = settings[deprecatedOption];
                }
                console.error("Use of deprecated option: " + deprecatedOption + ", use the style " + style + " instead.");
            }
        });

        // Unifying
        var marginSetting = settings.margin;
        settings.margin = {};
        if (typeof marginSetting.horizontal === 'number') {
            marginSetting.right = marginSetting.horizontal;
            marginSetting.left = marginSetting.horizontal;
        }
        if (typeof marginSetting.vertical === 'number') {
            marginSetting.top = marginSetting.vertical;
            marginSetting.bottom = marginSetting.vertical;
        }
        ['top', 'right', 'bottom', 'left'].forEach(function (side, i) {
            if (typeof marginSetting === 'number') {
                settings.margin[side] = marginSetting;
            } else {
                var key = Array.isArray(marginSetting) ? i : side;
                settings.margin[side] = typeof marginSetting[key] === 'number' ? marginSetting[key] : 40;
            }
        });

        return settings;
    }

    static styles(styles) {
        styles.unshift(defaultStyles());
        styles.unshift({});
        return Object.assign.apply(this, styles);
    }
}