import {Config, FONT_ROW_RATIO, getTheme} from './config';
import {ellipsize} from './common';
import {Table, Cell} from "./models";
import state from "./state";

/**
 * Calculate the column widths
 */
export function calculateWidths(table: Table) {
    // Column and table content width
    let fixedWidth = 0;
    let autoWidth = 0;
    let dynamicColumns = [];
    
    for (let column of table.columns) {
        column.contentWidth = 0;
        let autoColumn = false;
        let maxCellWidth = null;
        for (let row of table.allRows()) {
            let cell = row.cells[column.dataKey];
            if (!cell) continue;
            if (cell.colSpan <= 1 && cell.contentWidth > column.contentWidth) {
                column.contentWidth = cell.contentWidth;
            }

            let cellWidth = 0;
            if (typeof cell.styles.minCellWidth === 'number') {
                cellWidth = cell.styles.minCellWidth;
            } else if(cell.styles.minCellWidth === 'wrap') {
                cellWidth = cell.contentWidth;
            } else {
                cellWidth = cell.contentWidth;
            }
            if (cellWidth > maxCellWidth) {
                maxCellWidth = cellWidth;
                autoColumn = typeof cell.styles.minCellWidth !== 'number' && cell.styles.minCellWidth !== 'wrap';
            }
        }
        table.contentWidth += column.contentWidth;

        if (autoColumn) {
            autoWidth += maxCellWidth;
            dynamicColumns.push(column);
        } else {
            fixedWidth += maxCellWidth;
            column.width = maxCellWidth;
        }
        column.preferredWidth = maxCellWidth;
        table.preferredWidth += column.preferredWidth;
    }

    if (typeof table.settings.tableWidth === 'number') {
        table.width = table.settings.tableWidth;
    } else if (table.settings.tableWidth === 'wrap') {
        table.width = table.preferredWidth;
    } else {
        let pageWidth = Config.pageSize().width;
        table.width = pageWidth - table.margin('left') - table.margin('right');
    }

    distributeWidth(dynamicColumns, fixedWidth, autoWidth, 10);

    let rowSpanCells = {};
    
    // Row height, table height and text overflow
    let all = table.allRows();
    for (let rowIndex = 0; rowIndex < all.length; rowIndex++) {
        let row = all[rowIndex];
        
        let colSpanCell = null;
        let combinedColSpanWidth = 0;
        let colSpansLeft = 0;
        for (var columnIndex = 0; columnIndex < table.columns.length; columnIndex++) {
            let col = table.columns[columnIndex];
            let cell = null;
            
            // Width and colspan
            colSpansLeft -= 1;
            if (colSpansLeft > 1 && table.columns[columnIndex + 1]) {
                combinedColSpanWidth += col.width;
                delete row.cells[col.dataKey];
                continue;
            } else if (colSpanCell) {
                cell = colSpanCell;
                delete row.cells[col.dataKey];
                colSpanCell = null;
            } else {
                cell = row.cells[col.dataKey];
                if (!cell) continue;
                colSpansLeft = cell.colSpan;
                combinedColSpanWidth = 0;
                if (cell.colSpan > 1) {
                    colSpanCell = cell;
                    combinedColSpanWidth += col.width;
                    continue;
                } 
            }
            cell.width = col.width + combinedColSpanWidth;

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

function distributeWidth(dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth) {
    let table = state().table;
    let extraWidth = table.width - staticWidth - dynamicColumnsContentWidth;
    for (let i = 0; i < dynamicColumns.length; i++) {
        let col = dynamicColumns[i];
        let ratio = col.contentWidth / dynamicColumnsContentWidth;
        // A column turned out to be none dynamic, start over recursively
        let isNoneDynamic = col.contentWidth + extraWidth * ratio < fairWidth;
        if (extraWidth < 0 && isNoneDynamic) {
            dynamicColumns.splice(i, 1);
            dynamicColumnsContentWidth -= col.contentWidth;
            col.width = fairWidth;
            staticWidth += col.width;
            distributeWidth(dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth);
            break;
        } else {
            col.width = col.contentWidth + extraWidth * ratio;
        }
    }
}