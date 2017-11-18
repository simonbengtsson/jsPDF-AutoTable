import {applyUserStyles} from "./common";

export default function(allOptions) {
    for (let settings of allOptions) {
        if (settings && typeof settings !== 'object') {
            console.error("The options parameter should be of type object, is: " + typeof settings);
        }
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
            if (typeof settings.addPageContent === 'undefined') {
                settings.addPageContent = function(data) {
                    applyUserStyles();
                    if (settings.beforePageContent) settings.beforePageContent(data);
                    applyUserStyles();
                    if (settings.afterPageContent) settings.afterPageContent(data);
                    applyUserStyles();

                    if (settings.afterPageAdd && data.pageCount > 1) {
                        data.afterPageAdd(data);
                    }
                    applyUserStyles();
                }
            }
        }

        let oldHooks = ["createdHeaderCell", "drawHeaderRow", "drawRow", "drawHeaderCell"];
        for (let hookName of oldHooks) {
            if (settings[hookName]) {
                console.error(`The hook "${hookName}" has been removed/renamed in version 3.0 of jspdf-autotable. Make sure you update your project according to the migration guide.`);
            }
        }

        [['padding', 'cellPadding'], ['lineHeight', 'rowHeight'], 'fontSize', 'overflow'].forEach(function(o) {
            let deprecatedOption = typeof o === 'string' ? o : o[0];
            let style = typeof o === 'string' ? o : o[1];
            if (typeof settings[deprecatedOption] !== 'undefined') {
                if (typeof settings.styles[style] === 'undefined') {
                    settings.styles[style] = settings[deprecatedOption];
                }
                console.error("Use of deprecated option: " + deprecatedOption + ", use the style " + style + " instead.");
            }
        });

        for (let styleProp of ['styles', 'bodyStyles', 'headStyles', 'footStyles']) {
            checkStyles(settings[styleProp] || {});
        }

        let columnStyles = settings['columnStyles'] || {};
        for (let dataKey of Object.keys(columnStyles)) {
            checkStyles(columnStyles[dataKey] || {});
        }
    }
}

function checkStyles(styles) {
    if (styles.rowHeight) {
        console.error("Use of deprecated style rowHeight. It is renamed to minCellHeight.");
        if (!styles.minCellHeight) {
            styles.minCellHeight = styles.rowHeight;
        }
    } else if (styles.columnWidth) {
        console.error("Use of deprecated style columnWidth. It is renamed to cellWidth.");
        if (!styles.cellWidth) {
            styles.cellWidth = styles.columnWidth;
        }
    }
}