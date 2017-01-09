/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
export let FONT_ROW_RATIO = 1.15;
import {Table} from './models';

let jspdfInstance = null;
let userStyles = null;
let table = null;
let globalAddPageContent = null; // Set with doc.autoTableAddPageContent

declare function require(path: string): any;
var assign = require('object-assign');

/**
 * Styles for the themes (overriding the default styles)
 */
export let getTheme = function(name) {
    let themes = {
        'striped': {
            table: {fillColor: 255, textColor: 80, fontStyle: 'normal'},
            header: {textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold'},
            body: {},
            alternateRow: {fillColor: 245}
        },
        'grid': {
            table: {fillColor: 255, textColor: 80, fontStyle: 'normal', lineWidth: 0.1},
            header: {textColor: 255, fillColor: [26, 188, 156], fontStyle: 'bold', lineWidth: 0},
            body: {},
            alternateRow: {}
        },
        'plain': {
            header: {fontStyle: 'bold'}
        }
    };
    return themes[name];
};

function getDefaults() {
    let scaleFactor = Config.scaleFactor();
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
        margin: 40 / scaleFactor,
        pageBreak: 'auto', // 'auto', 'avoid', 'always'
        tableWidth: 'auto', // 'auto'|'wrap'|number (takes precedence over columnWidth style if conflict)
        showHeader: 'everyPage', // 'everyPage', 'firstPage', 'never',
        tableLineWidth: 0,
        tableLineColor: 200,

        // Hooks
        createdHeaderCell: function (cell, data) {},
        createdCell: function (cell, data) {},
        drawHeaderRow: function (row, data) {},
        drawRow: function (row, data) {},
        drawHeaderCell: function (cell, data) {},
        drawCell: function (cell, data) {},
        addPageContent: function (data) {}
    }
}

// Base style for all themes
function defaultStyles() {
    let scaleFactor = Config.scaleFactor();
    return {
        font: "helvetica", // helvetica, times, courier
        fontStyle: 'normal', // normal, bold, italic, bolditalic
        overflow: 'ellipsize', // visible, hidden, ellipsize or linebreak
        fillColor: false, // Either false for transparent, rbg array e.g. [255, 255, 255] or gray level e.g 200
        textColor: 20,
        halign: 'left', // left, center, right
        valign: 'top', // top, middle, bottom
        fontSize: 10,
        cellPadding: 5 / scaleFactor, // number or {top,left,right,left,vertical,horizontal}
        lineColor: 200,
        lineWidth: 0 / scaleFactor,
        columnWidth: 'auto'
    }
}

export class Config {
    
    static pageSize() {
        return Config.getJspdfInstance().internal.pageSize;
    }
    
    static setJspdfInstance(instance) {
        jspdfInstance = instance;
        userStyles = {
            textColor: 30, // Setting text color to dark gray as it can't be obtained from jsPDF
            fontSize: jspdfInstance.internal.getFontSize(),
            fontStyle: jspdfInstance.internal.getFont().fontStyle
        };
    }
    
    static getJspdfInstance() {
        return jspdfInstance;
    }
    
    // Styles before autotable was called
    static getUserStyles() {
        return userStyles;
    }
    
    static createTable(settings) {
        table = new Table(settings);
    }
    
    static setPageContentHook(hook) {
        globalAddPageContent = hook;
    }
    
    static callPageContentHook(data) {
        if (typeof globalAddPageContent === 'function') {
            globalAddPageContent(data);
        }
    }
    
    static tableInstance(): Table {
        return table;
    }
    
    static scaleFactor() {
        return jspdfInstance.internal.scaleFactor;
    }

    static hooksData(additionalData = {}) {
        return assign({
            pageCount: table.pageCount,
            settings: table.settings,
            table: table,
            doc: jspdfInstance,
            cursor: table.cursor,
        }, additionalData || {});
    }

    static initSettings(userOptions) {
        let settings = assign({}, getDefaults(), userOptions);

        // Options
        if (typeof settings.extendWidth !== 'undefined') {
            settings.tableWidth = settings.extendWidth ? 'auto' : 'wrap';
            console.error("Use of deprecated option: extendWidth, use tableWidth instead.");
        }
        if (typeof settings.margins !== 'undefined') {
            if (typeof settings.margin === 'undefined') settings.margin = settings.margins;
            console.error("Use of deprecated option: margins, use margin instead.");
        }
        if (typeof settings.afterPageContent !== 'undefined' || typeof settings.beforePageContent !== 'undefined' || typeof settings.afterPageAdd !== 'undefined') {
            console.error("The afterPageContent, beforePageContent and afterPageAdd hooks are deprecated. Use addPageContent instead");
            if (typeof userOptions.addPageContent === 'undefined') {
                settings.addPageContent = function(data) {
                    Config.applyStyles(Config.getUserStyles());
                    if (settings.beforePageContent) settings.beforePageContent(data);
                    Config.applyStyles(Config.getUserStyles());
                    if (settings.afterPageContent) settings.afterPageContent(data);
                    Config.applyStyles(Config.getUserStyles());

                    if (settings.afterPageAdd && data.pageCount > 1) {
                        data.afterPageAdd(data);
                    }
                    Config.applyStyles(Config.getUserStyles());
                }
            }
        }

        [['padding', 'cellPadding'], ['lineHeight', 'rowHeight'], 'fontSize', 'overflow'].forEach(function (o) {
            let deprecatedOption = typeof o === 'string' ? o : o[0];
            let style = typeof o === 'string' ? o : o[1];
            if (typeof settings[deprecatedOption] !== 'undefined') {
                if (typeof settings.styles[style] === 'undefined') {
                    settings.styles[style] = settings[deprecatedOption];
                }
                console.error("Use of deprecated option: " + deprecatedOption + ", use the style " + style + " instead.");
            }
        });
        
        settings.margin = Config.marginOrPadding(settings.margin, 40);
        
        return settings;
    }
    
    static marginOrPadding(value, defaultVal) {
        let newValue = {};
        ['top', 'right', 'bottom', 'left'].forEach(function (side, i) {
            newValue[side] = defaultVal / Config.scaleFactor();
            if (typeof value === 'number') {
                newValue[side] = value;
            } else if (Array.isArray(value) && typeof value[i] === 'number') {
                newValue[side] = value[i];
            } else if (typeof value === 'object') {
                if (typeof value[side] === 'number') {
                    newValue[side] = value[side];
                } else if ((side === 'right' || side === 'left') && typeof value['horizontal'] === 'number') {
                    newValue[side] = value['horizontal'];
                } else if ((side === 'top' || side === 'bottom') && typeof value['vertical'] === 'number') {
                    newValue[side] = value['vertical'];
                }
            }
        });
        return newValue;
    }

    static styles(styles) {
        styles = Array.isArray(styles) ? styles : [styles];
        let defStyles = defaultStyles();
        let newStyles = assign({}, defStyles, ...styles);
        newStyles.cellPadding = Config.marginOrPadding(newStyles.cellPadding, defStyles.cellPadding);
        return newStyles;
    }

    static applyStyles(styles) {
        let doc = Config.getJspdfInstance();
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