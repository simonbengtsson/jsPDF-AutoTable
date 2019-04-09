import {FONT_ROW_RATIO} from './config';
import {getFillStyle, addTableBorder, applyStyles, applyUserStyles} from './common';
import {Row, Table} from "./models";
import state from "./state";

export function drawTable(table: Table) {
    let settings = table.settings;
    table.cursor = {
        x: table.margin('left'),
        y: settings.startY == null ? table.margin('top') : settings.startY
    };

    let minTableBottomPos = settings.startY + table.margin('bottom') + table.headHeight + table.footHeight;
    if (settings.pageBreak === 'avoid') {
        minTableBottomPos += table.height;
    }
    if (settings.pageBreak === 'always' || settings.startY != null && settings.startY !== false && minTableBottomPos > state().pageHeight()) {
        nextPage(state().doc);
        table.cursor.y = table.margin('top');
    }
    table.pageStartX = table.cursor.x;
    table.pageStartY = table.cursor.y;
    
    table.startPageNumber = state().pageNumber();

    applyUserStyles();
    if (settings.showHead === true || settings.showHead === 'firstPage' || settings.showHead === 'everyPage') {
        table.head.forEach((row) => printRow(row))
    }
    applyUserStyles();
    table.body.forEach(function(row, index) {
        printFullRow(row, index === table.body.length - 1);
    });
    applyUserStyles();
    if (settings.showFoot === true || settings.showFoot === 'lastPage' || settings.showFoot === 'everyPage') {
        table.foot.forEach((row) => printRow(row))
    }

    addTableBorder();

    table.callEndPageHooks();
}

function printFullRow(row: Row, isLastRow) {
    let remainingRowHeight = 0;
    let remainingTexts = {};

    let table = state().table;

    let remainingPageSpace = getRemainingPageSpace(isLastRow);
    if (remainingPageSpace < row.maxCellHeight) {
        if (remainingPageSpace < getOneRowHeight(row) || (table.settings.rowPageBreak === 'avoid' && !rowHeightGreaterThanMaxTableHeight(row))) {
            addPage();
        } else {
            // Modify the row to fit the current page and calculate text and height of partial row
            row.spansMultiplePages = true;

            for (let j = 0; j < table.columns.length; j++) {
                let column = table.columns[j];
                let cell = row.cells[column.dataKey];
                if (!cell) {
                    continue;
                }

                let fontHeight = cell.styles.fontSize / state().scaleFactor() * FONT_ROW_RATIO;
                let vPadding = cell.padding('vertical');
                let remainingLineCount = Math.floor((remainingPageSpace - vPadding) / fontHeight);

                // Note that this will cut cells with specified custom min height at page break
                if (Array.isArray(cell.text) && cell.text.length > remainingLineCount) {
                    remainingTexts[column.dataKey] = cell.text.splice(remainingLineCount, cell.text.length);
                    let rCellHeight = cell.height - Math.floor(cell.text.length * fontHeight);
                    if (rCellHeight > remainingRowHeight) {
                        remainingRowHeight = rCellHeight;
                    }
                }

                cell.height = Math.min(remainingPageSpace, cell.height);
            }
        }
    }

    printRow(row);

    // Parts of the row is now printed. Time for adding a new page, prune 
    // the text and start over

    if (Object.keys(remainingTexts).length > 0) {
        let maxCellHeight = 0;
        for (let j = 0; j < table.columns.length; j++) {
            let col = table.columns[j];
            let cell = row.cells[col.dataKey];
            if (!cell) continue;

            cell.height = remainingRowHeight;
            if (cell.height > maxCellHeight) {
                maxCellHeight = cell.height
            }
            if (cell) {
                cell.text = remainingTexts[col.dataKey] || '';
            }
        }

        addPage();
        row.pageNumber++;
        row.height = remainingRowHeight;
        row.maxCellHeight = maxCellHeight;
        printFullRow(row, isLastRow);
    }
}

function getOneRowHeight(row) {
    return state().table.columns.reduce((acc, column) => {
        let cell = row.cells[column.dataKey];
        if (!cell) return 0;
        let fontHeight = cell.styles.fontSize / state().scaleFactor() * FONT_ROW_RATIO;
        let vPadding = cell.padding('vertical');
        let oneRowHeight = vPadding + fontHeight;
        return oneRowHeight > acc ? oneRowHeight : acc
    }, 0)
}

function rowHeightGreaterThanMaxTableHeight(row) {
    let table = state().table;
    let pageHeight = state().pageHeight();
    let maxTableHeight = pageHeight - table.margin('top') - table.margin('bottom');
    return row.maxCellHeight > maxTableHeight
}

function printRow(row) {
    let table: Table = state().table;

    table.cursor.x = table.margin('left');
    row.y = table.cursor.y;
    row.x = table.cursor.x;

    // For backwards compatibility reset those after addingRow event
    table.cursor.x = table.margin('left');
    row.y = table.cursor.y;
    row.x = table.cursor.x;

    for (let column of table.columns) {
        let cell = row.cells[column.dataKey];
        if (!cell) {
            table.cursor.x += column.width;
            continue;
        }
        applyStyles(cell.styles);

        cell.x = table.cursor.x;
        cell.y = row.y;
        if (cell.styles.valign === 'top') {
            cell.textPos.y = table.cursor.y + cell.padding('top');
        } else if (cell.styles.valign === 'bottom') {
            cell.textPos.y = table.cursor.y + cell.height - cell.padding('bottom');
        } else {
            cell.textPos.y = table.cursor.y + cell.height / 2;
        }

        if (cell.styles.halign === 'right') {
            cell.textPos.x = cell.x + cell.width - cell.padding('right');
        } else if (cell.styles.halign === 'center') {
            cell.textPos.x = cell.x + cell.width / 2;
        } else {
            cell.textPos.x = cell.x + cell.padding('left');
        }

        if (table.callCellHooks(table.cellHooks.willDrawCell, cell, row, column) === false) {
            table.cursor.x += column.width;
            continue;
        }

        let fillStyle = getFillStyle(cell.styles);
        if (fillStyle) {
            state().doc.rect(cell.x, table.cursor.y, cell.width, cell.height, fillStyle);
        }
        state().doc.autoTableText(cell.text, cell.textPos.x, cell.textPos.y, {
            halign: cell.styles.halign,
            valign: cell.styles.valign,
            maxWidth: cell.width - cell.padding('left') - cell.padding('right')
        });

        table.callCellHooks(table.cellHooks.didDrawCell, cell, row, column);

        table.cursor.x += column.width;
    }
    
    table.cursor.y += row.height;
}

function getRemainingPageSpace(isLastRow) {
    let table = state().table;
    let bottomContentHeight = table.margin('bottom');
    let showFoot = table.settings.showFoot;
    if (showFoot === true || showFoot === 'everyPage' || (showFoot === 'lastPage' && isLastRow)) {
        bottomContentHeight += table.footHeight;
    }
    return state().pageHeight() - table.cursor.y - bottomContentHeight;
}

export function addPage() {
    let table: Table = state().table;

    applyUserStyles();
    if (table.settings.showFoot === true || table.settings.showFoot === 'everyPage') {
        table.foot.forEach((row) => printRow(row))
    }

    table.finalY = table.cursor.y;

    // Add user content just before adding new page ensure it will 
    // be drawn above other things on the page
    table.callEndPageHooks();
    addTableBorder();
    nextPage(state().doc);
    table.pageNumber++;
    table.cursor = {x: table.margin('left'), y: table.margin('top')};
    table.pageStartX = table.cursor.x;
    table.pageStartY = table.cursor.y;
    if (table.settings.showHead === true || table.settings.showHead === 'everyPage') {
        table.head.forEach((row) => printRow(row));
    }
}

function nextPage(doc) {
    let current = state().pageNumber();
    doc.setPage(current + 1);
    let newCurrent = state().pageNumber();

    if (newCurrent === current) {
        doc.addPage();
    }
}