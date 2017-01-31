import {Config, FONT_ROW_RATIO, getTheme} from './config';
import {ellipsize} from './common';
import {Table, Cell} from "./models";
import state from "./state";

/**
 * Calculate the column widths
 */
export function calculateWidths(table: Table) {
    let tableMinWidth = 0;
    let columnMinWidth = 10 / state().scaleFactor;
    let tableWrappedWidth = 0;
    
    for (let column of table.columns) {
        for (let row of table.allRows()) {
            let cell = row.cells[column.dataKey];
            if (!cell || cell.colSpan > 1) continue;
            let cellWrappedWidth = 0;
            if (typeof cell.styles.cellWidth === 'number') {
                cell.minWidth = cell.styles.cellWidth;
                cellWrappedWidth = cell.minWidth;
            } else if (cell.styles.cellWidth === 'wrap') {
                cell.minWidth = cell.contentWidth;
                cellWrappedWidth = cell.minWidth;
            } else {
                cell.minWidth = columnMinWidth;
                cellWrappedWidth = cell.contentWidth;
            }
            
            if (cell.colSpan <= 1 && cellWrappedWidth > column.wrappedWidth) {
                column.wrappedWidth = cellWrappedWidth;
            }
            if (cell.minWidth > column.minWidth) {
                column.minWidth = cell.minWidth;
            }
        }
        tableMinWidth += column.minWidth;
        tableWrappedWidth += column.wrappedWidth;
    }

    if (typeof table.settings.tableWidth === 'number') {
        table.width = table.settings.tableWidth;
    } else if (table.settings.tableWidth === 'wrap') {
        table.width = tableWrappedWidth;
    } else {
        table.width = state().pageWidth() - table.margin('left') - table.margin('right');
    }
    
    // TODO Fix those cases
    if (tableMinWidth > table.width) {
        console.warn('We have a problem!');
    }
    if (columnMinWidth * table.columns.length > table.width) {
        console.warn('We have a serious problem!!');
    }

    let copy = table.columns.slice(0);
    distributeWidth(table.width, copy, 0, tableWrappedWidth);

    let rowSpanCells = {};
    
    // Row height, table height and text overflow
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

            // Overflow
            Config.applyStyles(cell.styles);
            let textSpace = cell.width - cell.padding('horizontal');
            if (cell.styles.overflow === 'linebreak') {
                cell.text = Array.isArray(cell.text) ? cell.text.join(' ') : cell.text;
                // Add one pt to textSpace to fix rounding error
                cell.text = table.doc.splitTextToSize(cell.text, textSpace + 1, {fontSize: cell.styles.fontSize});
            } else if (cell.styles.overflow === 'ellipsize') {
                cell.text = ellipsize(cell.text, textSpace, cell.styles);
            } else if (cell.styles.overflow === 'hidden') {
                cell.text = ellipsize(cell.text, textSpace, cell.styles, '');
            } else if (typeof cell.styles.overflow === 'function') {
                cell.text = cell.styles.overflow(cell.text, textSpace);
            }
            
            let lineCount = Array.isArray(cell.text) ? cell.text.length : 1;
            lineCount = cell.rowSpan <= 1 ? lineCount : 1;
            let fontHeight = cell.styles.fontSize / table.scaleFactor * FONT_ROW_RATIO;
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

        colSpansLeft = 1;
        for (let column of table.columns) {
            let data = rowSpanCells[column.dataKey];
            if (colSpansLeft > 1) {
                colSpansLeft--;
                delete row.cells[column.dataKey];
            } else if(data) {
                data.cell.height += row.height;
                if (data.cell.height > row.maxCellHeight) {
                    data.row.maxCellHeight = data.cell.height;
                    data.row.maxCellLineCount = Array.isArray(data.cell.text) ? data.cell.text.length : 1;
                }
                colSpansLeft = data.cell.colSpan;
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

function distributeWidth(tableWidth, autoColumns, fixedWidth, wrappedAutoColumnsWidth) {
    let diffWidth = tableWidth - fixedWidth - wrappedAutoColumnsWidth;
    
    for (let i = 0; i < autoColumns.length; i++) {
        let column = autoColumns[i];
        let ratio = column.wrappedWidth / wrappedAutoColumnsWidth;
        let suggestedWidth = column.wrappedWidth + diffWidth * ratio;
        if (suggestedWidth >= column.minWidth) {
            column.width = suggestedWidth;
        } else {
            // We can't reduce the width of this column. Mark as none auto column and start over
            column.width = column.minWidth;
            wrappedAutoColumnsWidth -= column.wrappedWidth;
            fixedWidth += column.width;
            autoColumns.splice(i, 1);
            distributeWidth(tableWidth, autoColumns, fixedWidth, wrappedAutoColumnsWidth);
            break;
        }
    }
}

function widthRatio(ratio) {
    return 1 / (1 - ratio) - 1;
}