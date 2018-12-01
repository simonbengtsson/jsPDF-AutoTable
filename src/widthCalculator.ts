import {FONT_ROW_RATIO, getTheme} from './config';
import {ellipsize, applyStyles} from './common';
import {Table, Cell} from "./models";
import state from "./state";

/**
 * Calculate the column widths
 */
export function calculateWidths(table: Table) {
    // TODO Fix those cases
    let columnMinWidth = 10 / state().scaleFactor();
    if (columnMinWidth * table.columns.length > table.width) {
        console.error('Columns could not fit on page');
    } else if (table.minWidth > table.width) {
        console.error("Column widths to wide and can't fit page");
    }

    let copy = table.columns.slice(0);
    let diffWidth = table.width - table.wrappedWidth;
    distributeWidth(copy, diffWidth, table.wrappedWidth);

    applyColSpans(table);
    fitContent(table);
    applyRowSpans(table);
}

function applyRowSpans(table) {
    let rowSpanCells = {};
    let colRowSpansLeft = 1;
    let all = table.allRows();
    for (let rowIndex = 0; rowIndex < all.length; rowIndex++) {
        let row = all[rowIndex];
        for (let column of table.columns) {
            let data = rowSpanCells[column.dataKey];
            if (colRowSpansLeft > 1) {
                colRowSpansLeft--;
                delete row.cells[column.dataKey];
            } else if (data) {
                data.cell.height += row.height;
                if (data.cell.height > row.maxCellHeight) {
                    data.row.maxCellHeight = data.cell.height;
                    data.row.maxCellLineCount = Array.isArray(data.cell.text) ? data.cell.text.length : 1;
                }
                colRowSpansLeft = data.cell.colSpan;
                delete row.cells[column.dataKey];
                data.left--;
                if (data.left <= 1) {
                    delete rowSpanCells[column.dataKey];
                }
            } else {
                var cell = row.cells[column.dataKey];
                if (!cell) {
                    continue;
                }
                cell.height = row.height;
                if (cell.rowSpan > 1) {
                    let remaining = all.length - rowIndex;
                    let left = cell.rowSpan > remaining ? remaining : cell.rowSpan;
                    rowSpanCells[column.dataKey] = {cell, left, row};
                }
            }
        }

        if (row.section === 'head') {
            table.headHeight += row.maxCellHeight;
        }
        if (row.section === 'foot') {
            table.footHeight += row.maxCellHeight;
        }

        table.height += row.height;
    }
}

function applyColSpans(table) {
    let all = table.allRows();
    for (let rowIndex = 0; rowIndex < all.length; rowIndex++) {
        let row = all[rowIndex];

        let colSpanCell = null;
        let combinedColSpanWidth = 0;
        let colSpansLeft = 0;
        for (var columnIndex = 0; columnIndex < table.columns.length; columnIndex++) {
            let column = table.columns[columnIndex];
            let cell = null;

            // Width and colspan
            colSpansLeft -= 1;
            if (colSpansLeft > 1 && table.columns[columnIndex + 1]) {
                combinedColSpanWidth += column.width;
                delete row.cells[column.dataKey];
                continue;
            } else if (colSpanCell) {
                cell = colSpanCell;
                delete row.cells[column.dataKey];
                colSpanCell = null;
            } else {
                cell = row.cells[column.dataKey];
                if (!cell) continue;
                colSpansLeft = cell.colSpan;
                combinedColSpanWidth = 0;
                if (cell.colSpan > 1) {
                    colSpanCell = cell;
                    combinedColSpanWidth += column.width;
                    continue;
                }
            }
            cell.width = column.width + combinedColSpanWidth;
        }
    }
}

function fitContent(table) {
    for (let row of table.allRows()) {
        for (let column of table.columns) {
            let cell = row.cells[column.dataKey];
            if (!cell) continue;

            applyStyles(cell.styles);
            let textSpace = cell.width - cell.padding('horizontal');
            if (cell.styles.overflow === 'linebreak') {
                cell.text = Array.isArray(cell.text) ? cell.text.join(' ') : cell.text;
                // Add one pt to textSpace to fix rounding error
                cell.text = state().doc.splitTextToSize(cell.text, textSpace + 1 / (state().scaleFactor() || 1), {fontSize: cell.styles.fontSize});
            } else if (cell.styles.overflow === 'ellipsize') {
                cell.text = ellipsize(cell.text, textSpace, cell.styles);
            } else if (cell.styles.overflow === 'hidden') {
                cell.text = ellipsize(cell.text, textSpace, cell.styles, '');
            } else if (typeof cell.styles.overflow === 'function') {
                cell.text = cell.styles.overflow(cell.text, textSpace);
            }

            let lineCount = Array.isArray(cell.text) ? cell.text.length : 1;
            lineCount = cell.rowSpan <= 1 ? lineCount : 1;
            let fontHeight = cell.styles.fontSize / state().scaleFactor() * FONT_ROW_RATIO;
            cell.contentHeight = lineCount * fontHeight + cell.padding('vertical');

            if (cell.styles.minCellHeight > cell.contentHeight) {
                cell.contentHeight = cell.styles.minCellHeight;
            }

            if (cell.contentHeight > row.height) {
                row.height = cell.contentHeight;
                row.maxCellHeight = cell.contentHeight;
                row.maxCellLineCount = lineCount;
            }
        }
    }
}

function distributeWidth(autoColumns, diffWidth, wrappedAutoColumnsWidth) {
    for (let i = 0; i < autoColumns.length; i++) {
        let column = autoColumns[i];
        let ratio = column.wrappedWidth / wrappedAutoColumnsWidth;
        let suggestedChange = diffWidth * ratio;
        let suggestedWidth = column.wrappedWidth + suggestedChange;
        if (suggestedWidth >= column.minWidth) {
            column.width = suggestedWidth;
        } else {
            // We can't reduce the width of this column. Mark as none auto column and start over
            // Add 1 to minWidth as linebreaks calc otherwise sometimes made two rows
            column.width = column.minWidth + 1 / state().scaleFactor();
            wrappedAutoColumnsWidth -= column.wrappedWidth;
            autoColumns.splice(i, 1);
            distributeWidth(autoColumns, diffWidth, wrappedAutoColumnsWidth);
            break;
        }
    }
}