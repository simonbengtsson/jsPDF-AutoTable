import {Config, FONT_ROW_RATIO} from './config';
import {getFillStyle, addTableBorder, addContentHooks} from './common';
import {Row, Table, ATEvent} from "./models";
import autoText from './autoText';

export function drawTable(table: Table, tableOptions) {
    let settings = table.settings;
    table.cursor = {
        x: table.margin('left'),
        y: settings.startY === false ? table.margin('top') : settings.startY
    };

    let minTableBottomPos = settings.startY + table.margin('bottom') + table.headerRow.maxCellHeight;
    if (settings.pageBreak === 'avoid') {
        minTableBottomPos += table.height;
    }
    if (settings.startY !== false && minTableBottomPos > Config.pageSize().height) {
        table.doc.addPage();
        table.cursor.y = table.margin('top');
    }
    table.pageStartX = table.cursor.x;
    table.pageStartY = table.cursor.y;

    Config.applyUserStyles();
    if (settings.showHeader === true || settings.showHeader === 'firstPage' || settings.showHeader === 'everyPage') {
        printRow(table.headerRow, table.hooks.drawHeaderRow, table.hooks.drawHeaderCell);
    }
    Config.applyUserStyles();

    table.rows.forEach(function (row) {
        printFullRow(row, table.hooks.drawRow, table.hooks.drawCell);
    });

    addTableBorder();

    // Don't call global and document addPageContent more than once for each page
    let pageNumber = table.doc.internal.getCurrentPageInfo().pageNumber;
    if (table.doc.autoTableState.addPageHookPages && table.doc.autoTableState.addPageHookPages[pageNumber]) {
        if (typeof tableOptions['addPageContent'] === 'function') {
            tableOptions['addPageContent'](new ATEvent(table));
        }
    } else {
        if (!table.doc.autoTableState.addPageHookPages) table.doc.autoTableState.addPageHookPages = {};
        table.doc.autoTableState.addPageHookPages[pageNumber] = true;
        addContentHooks(table);
    }
}

function printFullRow(row: Row, drawRowHooks, drawCellHooks) {
    let remainingRowHeight = 0;
    let remainingTexts = {};

    let table = Config.tableInstance();

    if (!canFitOnPage(row.maxCellHeight)) {
        if (row.maxCellLineCount <= 1) {
            addPage();
        } else {
            // Modify the row to fit the current page and calculate text and height of partial row
            row.spansMultiplePages = true;

            let pageHeight = table.doc.internal.pageSize.height;
            let maxCellHeight = 0;
            let maxRowSpanCellHeight = 0;

            for (let j = 0; j < table.columns.length; j++) {
                let col = table.columns[j];
                let cell = row.cells[col.dataKey];
                if (!cell) {
                    continue;
                }

                let fontHeight = cell.styles.fontSize / table.scaleFactor * FONT_ROW_RATIO;
                let vPadding = cell.padding('vertical');
                let remainingPageSpace = pageHeight - table.cursor.y - table.margin('bottom');
                let remainingLineCount = Math.floor((remainingPageSpace - vPadding) / fontHeight);

                if (Array.isArray(cell.text) && cell.text.length > remainingLineCount) {
                    let remainingLines = cell.text.splice(remainingLineCount, cell.text.length);
                    remainingTexts[col.dataKey] = remainingLines;

                    let cellHeight = cell.text.length * fontHeight + vPadding;
                    if (cellHeight > maxCellHeight) {
                        maxCellHeight = cellHeight;
                    }

                    let rCellHeight = remainingLines.length * fontHeight + vPadding;
                    if (rCellHeight > remainingRowHeight) {
                        remainingRowHeight = rCellHeight;
                    }
                }
            }

            // Reset row height since text are now removed
            row.height = maxCellHeight;
            row.maxCellHeight = maxRowSpanCellHeight;
        }
    }

    printRow(row, drawRowHooks, drawCellHooks);

    // Parts of the row is now printed. Time for adding a new page, prune 
    // the text and start over

    if (Object.keys(remainingTexts).length > 0) {
        for (let j = 0; j < table.columns.length; j++) {
            let col = table.columns[j];
            let cell = row.cells[col.dataKey];
            cell.text = remainingTexts[col.dataKey] || '';
        }

        addPage();
        row.pageCount++;
        row.height = remainingRowHeight;
        printFullRow(row, drawRowHooks, drawCellHooks);
    }
}

function printRow(row, drawRowHooks, drawCellHooks) {
    let table = Config.tableInstance();
    
    for (let hook of drawRowHooks) {
        if (hook(row, new ATEvent(table, row)) === false) {
            return;
        }
    }

    table.cursor.x = table.margin('left');
    for (let column of table.columns) {
        let cell = row.cells[column.dataKey];
        if(!cell) {
            table.cursor.x += column.width;
            continue;
        }
        Config.applyStyles(cell.styles);

        let cellX = table.cursor.x;
        if (cell.styles.valign === 'top') {
            cell.textPos.y = table.cursor.y + cell.padding('top');
        } else if (cell.styles.valign === 'bottom') {
            cell.textPos.y = table.cursor.y + cell.height - cell.padding('bottom');
        } else {
            cell.textPos.y = table.cursor.y + cell.height / 2;
        }

        if (cell.styles.halign === 'right') {
            cell.textPos.x = cellX + cell.width - cell.padding('right');
        } else if (cell.styles.halign === 'center') {
            cell.textPos.x = cellX + cell.width / 2;
        } else {
            cell.textPos.x = cellX + cell.padding('left');
        }


        let shouldDrawCell = true;
        let event = new ATEvent(table, row, column, cell);
        for (let hook of drawCellHooks) {
            if (hook(cell, event) === false) {
                shouldDrawCell = false;
            }
        }

        if (shouldDrawCell) {
            let fillStyle = getFillStyle(cell.styles);
            if (fillStyle) {
                table.doc.rect(cellX, table.cursor.y, cell.width, cell.height, fillStyle);
            }
            autoText.apply(table.doc, [cell.text, cell.textPos.x, cell.textPos.y, {
                halign: cell.styles.halign,
                valign: cell.styles.valign
            }]);
        }

        table.cursor.x += column.width;
    }

    table.cursor.y += row.height;
}

function canFitOnPage(rowHeight) {
    let table = Config.tableInstance();
    let pos = rowHeight + table.cursor.y + table.margin('bottom');
    return pos < Config.pageSize().height;
}

export function addPage() {
    let table = Config.tableInstance();
    table.finalY = table.cursor.y;

    // Add user content just before adding new page ensure it will 
    // be drawn above other things on the page
    addContentHooks(table);
    addTableBorder();
    table.doc.addPage();
    table.pageCount++;
    table.cursor = {x: table.margin('left'), y: table.margin('top')};
    table.pageStartX = table.cursor.x;
    table.pageStartY = table.cursor.y;
    if (table.settings.showHeader === true || table.settings.showHeader === 'everyPage') {
        printRow(table.headerRow, table.hooks.drawHeaderRow, table.hooks.drawHeaderCell);
    }
}