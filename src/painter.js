import {Config, FONT_ROW_RATIO} from './config.js';
import {addPage} from './common.js';

export function printFullRow(row, drawRowHook, drawCellHook) {
    let remainingRowHeight = 0;
    let remainingTexts = {};

    let table = Config.tableInstance();

    if (!canFitOnPage(row.height)) {
        // Simply move small rows to new page to avoid splitting
        // TODO Improve
        if (row.height < row.heightStyle * 3) {
            addPage();
        } else {

            // Modify the row to fit the current page and calculate text and height of partial row

            row.spansMultiplePages = true;

            let pageHeight = Config.getJspdfInstance().internal.pageSize.height;
            let maxCellHeight = 0;

            for (let j = 0; j < table.columns.length; j++) {
                let col = table.columns[j];
                let cell = row.cells[col.dataKey];

                let k = Config.getJspdfInstance().internal.scaleFactor;
                let fontHeight = cell.styles.fontSize / k * FONT_ROW_RATIO;
                let vpadding = 0 / k; // TODO
                let remainingPageSpace = pageHeight - Config.getJspdfInstance().autoTableCursor.y - Config.settings().margin.bottom;
                let remainingLineCount = Math.floor((remainingPageSpace - vpadding) / fontHeight);

                if (Array.isArray(cell.text) && cell.text.length > remainingLineCount) {
                    let remainingLines = cell.text.splice(remainingLineCount, cell.text.length);
                    remainingTexts[col.dataKey] = remainingLines;

                    let rowHeight1 = cell.text.length * fontHeight + vpadding;
                    if (rowHeight1 > maxCellHeight) {
                        maxCellHeight = rowHeight1;
                    }

                    let rowHeight2 = remainingLines.length * fontHeight + vpadding;
                    if (rowHeight2 > remainingRowHeight) {
                        remainingRowHeight = rowHeight2;
                    }
                }
            }

            // Reset row height since text are now removed
            row.height = maxCellHeight;
        }
    }

    printRow(row, drawRowHook, drawCellHook);

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
        printFullRow(row, drawRowHook, drawCellHook);
    }
}

export function printRow(row, drawRowHook, drawCellHook) {
    let table = Config.tableInstance();
    let cursor = Config.getJspdfInstance().autoTableCursor;
    row.y = cursor.y;

    if (drawRowHook(row, Config.hooksData({row: row})) === false) {
        return;
    }

    cursor.x = Config.settings().margin.left;
    for (let i = 0; i < table.columns.length; i++) {
        let column = table.columns[i];
        let cell = row.cells[column.dataKey];
        if(!cell) {
            continue;
        }
        Config.applyStyles(cell.styles);

        cell.x = cursor.x;
        cell.y = cursor.y;
        cell.height = row.height;
        cell.width = column.width;

        if (cell.styles.valign === 'top') {
            cell.textPos.y = cursor.y + cell.styles.cellPadding.top;
        } else if (cell.styles.valign === 'bottom') {
            cell.textPos.y = cursor.y + row.height - cell.styles.cellPadding.bottom;
        } else {
            cell.textPos.y = cursor.y + row.height / 2;
        }

        if (cell.styles.halign === 'right') {
            cell.textPos.x = cell.x + cell.width - cell.styles.cellPadding.right;
        } else if (cell.styles.halign === 'center') {
            cell.textPos.x = cell.x + cell.width / 2;
        } else {
            cell.textPos.x = cell.x + cell.styles.cellPadding.left;
        }

        let data = Config.hooksData({column: column, row: row, addPage: addPage});
        if (drawCellHook(cell, data) !== false) {
            let fillStyle = getFillStyle(cell.styles);
            if (fillStyle) {
                Config.getJspdfInstance().rect(cell.x, cell.y, cell.width, cell.height, fillStyle);
            }
            Config.getJspdfInstance().autoTableText(cell.text, cell.textPos.x, cell.textPos.y, {
                halign: cell.styles.halign,
                valign: cell.styles.valign
            });
        }
        cursor.x += cell.width;
    }

    cursor.y += row.height;
}

function canFitOnPage(rowHeight) {
    let pageHeight = Config.getJspdfInstance().internal.pageSize.height;
    let cursor = Config.getJspdfInstance().autoTableCursor;
    let pos = cursor.y + rowHeight + Config.settings().margin.bottom;
    return pos < pageHeight;
}

function getFillStyle(styles) {
    let drawLine = styles.lineWidth > 0;
    let drawBackground = styles.fillColor !== false;
    if (drawLine && drawBackground) {
        return 'DF'; // Fill then stroke
    } else if (drawLine) {
        return 'S'; // Only stroke (transperant backgorund)
    } else if (drawBackground) {
        return 'F'; // Only fill, no stroke
    } else {
        return false;
    }
}