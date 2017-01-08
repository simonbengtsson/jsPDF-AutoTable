/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
export let FONT_ROW_RATIO = 1.15;
declare function require(path: string): any;
var assign = require('object-assign');

/**
 * Styles for the themes (overriding the default styles)
 */
export let getTheme = function(table, name) {
    let scaleFactor = Config.scaleFactor(table);
    let themes = {
        'striped': {
            table: {fillColor: 255, textColor: 80, fontStyle: 'normal'},
            header: {textColor: 255, fillColor: [41, 128, 185], rowHeight: 23 / scaleFactor, fontStyle: 'bold'},
            body: {},
            alternateRow: {fillColor: 245}
        },
        'grid': {
            table: {fillColor: 255, textColor: 80, fontStyle: 'normal', lineWidth: 0.1},
            header: {textColor: 255, fillColor: [26, 188, 156], rowHeight: 23 / scaleFactor, fontStyle: 'bold', lineWidth: 0},
            body: {},
            alternateRow: {}
        },
        'plain': {
            header: {fontStyle: 'bold'}
        }
    };
    return themes[name];
};

export function getDefaults(doc) {
    let scaleFactor = Config.scaleFactor(doc);
    return {
        // Content
        columns: null, // optional array with column ids
        head: null, // [content, ...], [[content, ...]], {columnId: content, ...}, [{columnId: content}, ...]
        body: null, // [[content, ...]], [{columnId: content, ...}]
        foot: null, // [content, ...], [[content, ...]], {columnId: content, ...}, [{columnId: content}, ...]
        fromHtml: null, // css selector or HTMLTableElement
        ignoreHiddenHtml: true,
        useCssStyles: false,

        // Properties
        startY: null, // null indicates the margin value
        margin: 40 / scaleFactor,
        tableWidth: 'auto', // 'auto'|'wrap'|number (takes precedence over columnWidth style if conflict)
        showHead: 'firstPage', // 'firstPage', 'everyPage', 'never'
        showFoot: 'lastPage', // 'lastPage', 'everyPage', 'never'
        tableId: 0, // Auto-incrementing if not set
        
        // Styling
        theme: 'striped', // 'striped', 'grid' or 'plain'
        styles: {},
        headerStyles: {},
        bodyStyles: {},
        alternateRowStyles: {},
        columnStyles: {},
    }
}

// Base style for all themes
function defaultStyles(table) {
    let scaleFactor = Config.scaleFactor(table);
    return {
        font: "helvetica", // helvetica, times, courier
        lineColor: 200,
        fontStyle: 'normal', // normal, bold, italic, bolditalic
        overflow: 'linebreak', // visible, hidden, ellipsize or linebreak
        fillColor: false, // Either false for transparent, rbg array e.g. [255, 255, 255] or gray level e.g 200
        textColor: 20,
        halign: 'left', // left, center, right
        valign: 'top', // top, middle, bottom
        fontSize: 10,
        cellPadding: 5 / scaleFactor,
        lineWidth: 0 / scaleFactor,
        rowHeight: 20 / scaleFactor,
        columnWidth: 'auto'
    }
}

export class Config {
    
    static pageSize(table) {
        return table.doc.internal.pageSize;
    }

    static scaleFactor(doc) {
        return doc.internal.scaleFactor;
    }

    static hooksData(table, additionalData = {}) {
        return assign({
            pageCount: table.pageCount,
            settings: table.settings,
            table: table,
            doc: table.doc,
            cursor: table.cursor,
        }, additionalData || {});
    }

    static styles(table, styles) {
        let defStyles = defaultStyles(table);
        let newStyles = assign({}, defStyles, ...styles);
        return newStyles;
    }
    
    static headerStyles(table) {
        let theme = getTheme(table, table.settings.theme);
        return Config.styles(table, [theme.table, theme.header, table.settings.styles, table.settings.headerStyles]);
    }

    static bodyStyles(isAlternateRow, table) {
        let theme = getTheme(table, table.settings.theme);
        let rowStyles = isAlternateRow ? assign({}, theme.alternateRow, table.settings.alternateRowStyles) : {};
        return Config.styles(table, [theme.table, theme.body, table.settings.styles, table.settings.bodyStyles, rowStyles]);
    }
    
    static applyStyles(table, styles) {
        let doc = table.doc;
        let styleModifiers = {
            fillColor: doc.setFillColor,
            textColor: doc.setTextColor,
            fontStyle: doc.setFontStyle,
            lineColor: doc.setDrawColor,
            lineWidth: doc.setLineWidth,
            font: doc.setFont,
            fontSize: doc.setFontSize
        };
        Object.keys(styleModifiers).forEach(function (name) {
            let style = styles[name];
            let modifier = styleModifiers[name];
            if (typeof style !== 'undefined') {
                if (Array.isArray(style)) {
                    modifier.apply(this, style);
                } else {
                    modifier(style);
                }
            }
        });
    } 
}