import {Config, FONT_ROW_RATIO} from './config';
import {addPage} from './common';
import {Table} from "./models";

export function putTable(table: Table) {
    let y = table.startY !== false ? table.settings.startY : table.margin('top');
    table.cursor = {x: table.margin.left, y: y};

    let pageEndPos = table.cursor.y + table.margin.bottom + table.headerRow.height;
    pageEndPos += table.settings.avoidPageSplit ? table.height : 0;
    let startOnFirstPage = pageEndPos < Config.pageSize(table).height;

    // Start drawing the table on the next page if only the headers fit on the current page
    if (!startOnFirstPage) {
        //addContentHooks(false);
        table.doc.addPage();
    }

    if (table.settings.showHeader === true || table.settings.showHeader === 'always') {
        printRow(table, table.headerRow, table.settings.drawHeaderRow, table.settings.drawHeaderCell);
    }

    table.rows.forEach(function (row) {
        printFullRow(table, row, table.settings.drawRow, table.settings.drawCell);
    });
    //addContentHooks();
}

export function printFullRow(table, row, drawRowHook, drawCellHook) {
    let remainingRowHeight = 0;
    let remainingTexts = {};
    
    if (!canFitOnPage(table, row.height)) {
        // Simply move small rows to new page to avoid splitting
        // TODO Improve
        if (row.height < row.heightStyle * 3) {
            addPage(table);
        } else {

            // Modify the row to fit the current page and calculate text and height of partial row

            row.spansMultiplePages = true;

            let pageHeight = table.doc.internal.pageSize.height;
            let maxCellHeight = 0;

            for (let j = 0; j < table.columns.length; j++) {
                let col = table.columns[j];
                let cell = row.cells[col.dataKey];

                let k = Config.scaleFactor(table);
                let fontHeight = cell.styles.fontSize / k * FONT_ROW_RATIO;
                let vPadding = 0 / k; // TODO
                let remainingPageSpace = pageHeight - table.cursor.y - table.margin('bottom');
                let remainingLineCount = Math.floor((remainingPageSpace - vPadding) / fontHeight);

                if (Array.isArray(cell.text) && cell.text.length > remainingLineCount) {
                    let remainingLines = cell.text.splice(remainingLineCount, cell.text.length);
                    remainingTexts[col.dataKey] = remainingLines;

                    let rowHeight1 = cell.text.length * fontHeight + vPadding;
                    if (rowHeight1 > maxCellHeight) {
                        maxCellHeight = rowHeight1;
                    }

                    let rowHeight2 = remainingLines.length * fontHeight + vPadding;
                    if (rowHeight2 > remainingRowHeight) {
                        remainingRowHeight = rowHeight2;
                    }
                }
            }

            // Reset row height since text are now removed
            row.height = maxCellHeight;
        }
    }

    printRow(table, row, drawRowHook, drawCellHook);

    // Parts of the row is now printed. Time for adding a new page, prune 
    // the text and start over

    if (Object.keys(remainingTexts).length > 0) {
        for (let j = 0; j < table.columns.length; j++) {
            let col = table.columns[j];
            let cell = row.cells[col.dataKey];
            cell.text = remainingTexts[col.dataKey] || '';
        }

        addPage(table);
        row.pageCount++;
        row.height = remainingRowHeight;
        printFullRow(table, row, drawRowHook, drawCellHook);
    }
}

export function printRow(table, row, drawRowHook, drawCellHook) {
    row.y = table.cursor.y;

    let rowData = Config.hooksData(table, {row: row, addPage: addPage});
    if (drawRowHook(row, rowData) === false) {
        return;
    }

    table.cursor.x = table.margin('left');
    for (let i = 0; i < table.columns.length; i++) {
        let column = table.columns[i];
        let cell = row.cells[column.dataKey];
        if(!cell) {
            continue;
        }
        Config.applyStyles(table, cell.styles);

        cell.x = table.cursor.x;
        cell.y = table.cursor.y;
        cell.height = row.height;
        cell.width = column.width;

        if (cell.styles.valign === 'top') {
            cell.textPos.y = table.cursor.y + cell.styles.cellPadding.top;
        } else if (cell.styles.valign === 'bottom') {
            cell.textPos.y = table.cursor.y + row.height - cell.styles.cellPadding.bottom;
        } else {
            cell.textPos.y = table.cursor.y + row.height / 2;
        }

        if (cell.styles.halign === 'right') {
            cell.textPos.x = cell.x + cell.width - cell.styles.cellPadding.right;
        } else if (cell.styles.halign === 'center') {
            cell.textPos.x = cell.x + cell.width / 2;
        } else {
            cell.textPos.x = cell.x + cell.styles.cellPadding.left;
        }

        let data = Config.hooksData(table, {column: column, row: row, addPage: addPage});
        if (drawCellHook(cell, data) !== false) {
            let fillStyle = getFillStyle(cell.styles);
            if (fillStyle) {
                table.doc.rect(cell.x, cell.y, cell.width, cell.height, fillStyle);
            }
            table.doc.autotableText(cell.text, cell.textPos.x, cell.textPos.y, {
                halign: cell.styles.halign,
                valign: cell.styles.valign
            });
        }
        table.cursor.x += cell.width;
    }

    table.cursor.y += row.height;
}

function canFitOnPage(table, rowHeight) {
    let pos = rowHeight + table.cursor.y + table.margin('bottom');
    return pos < Config.pageSize(table).height;
}

function getFillStyle(styles) {
    let drawLine = styles.lineWidth > 0;
    let drawBackground = styles.fillColor !== false;
    if (drawLine && drawBackground) {
        return 'DF'; // Fill then stroke
    } else if (drawLine) {
        return 'S'; // Only stroke (transparent background)
    } else if (drawBackground) {
        return 'F'; // Only fill, no stroke
    } else {
        return '';
    }
}