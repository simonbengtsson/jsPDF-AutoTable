import {Config, FONT_ROW_RATIO} from './config';
import {addPage, getFillStyle} from './common';

export function printFullRow(row, drawRowHook, drawCellHook) {
    let remainingRowHeight = 0;
    let remainingTexts = {};

    let table = Config.tableInstance();

    if (!canFitOnPage(row.height)) {
        if (row.maxLineCount <= 1) {
            addPage();
        } else {
            // Modify the row to fit the current page and calculate text and height of partial row
            row.spansMultiplePages = true;

            let pageHeight = Config.getJspdfInstance().internal.pageSize.height;
            let maxCellHeight = 0;

            for (let j = 0; j < table.columns.length; j++) {
                let col = table.columns[j];
                let cell = row.cells[col.dataKey];

                let k = Config.scaleFactor();
                let fontHeight = cell.styles.fontSize / k * FONT_ROW_RATIO;
                let vPadding = cell.styles.cellPadding.top + cell.styles.cellPadding.bottom / k;
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
    row.y = table.cursor.y;

    if (drawRowHook(row, Config.hooksData({row: row, addPage: addPage})) === false) {
        return;
    }

    table.cursor.x = table.margin('left');
    for (let i = 0; i < table.columns.length; i++) {
        let column = table.columns[i];
        let cell = row.cells[column.dataKey];
        if(!cell) {
            continue;
        }
        Config.applyStyles(cell.styles);

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
        table.cursor.x += cell.width;
    }

    table.cursor.y += row.height;
}

function canFitOnPage(rowHeight) {
    let table = Config.tableInstance();
    let pos = rowHeight + table.cursor.y + table.margin('bottom');
    return pos < Config.pageSize().height;
}