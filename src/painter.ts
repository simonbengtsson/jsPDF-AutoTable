import {Config, FONT_ROW_RATIO} from './config';
import {addPage, getFillStyle} from './common';

export function printFullRow(row, drawRowHooks, drawCellHooks) {
    let remainingRowHeight = 0;
    let remainingTexts = {};

    let table = Config.tableInstance();

    if (!canFitOnPage(row.height)) {
        if (row.maxLineCount <= 1) {
            addPage();
        } else {
            // Modify the row to fit the current page and calculate text and height of partial row
            row.spansMultiplePages = true;

            let pageHeight = Config.pageSize().height;
            let maxCellHeight = 0;

            for (let j = 0; j < table.columns.length; j++) {
                let col = table.columns[j];
                let cell = row.cells[col.dataKey];

                let fontHeight = cell.styles.fontSize / Config.scaleFactor() * FONT_ROW_RATIO;
                let vPadding = cell.padding('vertical');
                let remainingPageSpace = pageHeight - table.cursor.y - table.margin('bottom');
                let remainingLineCount = Math.floor((remainingPageSpace - vPadding) / fontHeight);

                // Splice with negative values results in unexpected results, therefore eliminate
                // scenarios where less than one line is remaining, but are shown
                if (remainingLineCount < 0) {
                    remainingLineCount = 0;
                }

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

export function printRow(row, drawRowHooks, drawCellHooks) {
    let table = Config.tableInstance();
    row.y = table.cursor.y;
    
    for (let hook of drawRowHooks) {
        if (hook(row, Config.hooksData({row: row, addPage: addPage})) === false) {
            return;
        }
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
            cell.textPos.y = table.cursor.y + cell.padding('top');
        } else if (cell.styles.valign === 'bottom') {
            cell.textPos.y = table.cursor.y + row.height - cell.padding('bottom');
        } else {
            cell.textPos.y = table.cursor.y + row.height / 2;
        }

        if (cell.styles.halign === 'right') {
            cell.textPos.x = cell.x + cell.width - cell.padding('right');
        } else if (cell.styles.halign === 'center') {
            cell.textPos.x = cell.x + cell.width / 2;
        } else {
            cell.textPos.x = cell.x + cell.padding('left');
        }

        
        let shouldDrawCell = true;
        let data = Config.hooksData({column: column, row: row, addPage: addPage});
        for (let hook of drawCellHooks) {
            if (hook(cell, data) === false) {
                shouldDrawCell = false;
            }
        }

        if (shouldDrawCell) {
            let fillStyle = getFillStyle(cell.styles);
            if (fillStyle) {
                table.doc.rect(cell.x, cell.y, cell.width, cell.height, fillStyle);
            }
            table.doc.autoTableText(cell.text, cell.textPos.x, cell.textPos.y, {
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