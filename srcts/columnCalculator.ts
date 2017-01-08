import {Config, FONT_ROW_RATIO} from './config';
import {ellipsize} from './common';
import {Table} from "./models";

declare function require(path: string): any;
var entries = require('object.entries');

/**
 * Calculate the column widths
 */
export function calculateWidths(table: Table) {
    let tableContentWidth = 0;
    let preferredTableWidth = 0;
    let tableWidth = 0;
    let pageWidth = table.doc.internal.pageSize.width;
    
    // Column and table content width
    let fixedWidth = 0;
    let elasticWidth = 0;
    let elasticColumns = [];
    for (let column of table.columns) {
        column.contentWidth = 0;
        for (let row of table.rows()) {
            let cell = row.cells[column.id];
            let cellContentWidth = cell.contentWidth();
            if (cellContentWidth > column.contentWidth) {
                column.contentWidth = cellContentWidth;
            }
        }

        tableContentWidth += column.contentWidth;
        if (typeof column.widthStyle === 'number') {
            column.preferredWidth = <number>column.widthStyle;
            fixedWidth += column.preferredWidth;
            column.width = column.preferredWidth;
        } else if (column.widthStyle === 'wrap') {
            column.preferredWidth = column.contentWidth;
            fixedWidth += column.preferredWidth;
            column.width = column.preferredWidth;
        } else {
            column.preferredWidth = column.contentWidth;
            elasticWidth += column.contentWidth;
            elasticColumns.push(column);
        }
        preferredTableWidth += column.preferredWidth;
    }

    if (typeof table.tableWidth === 'number') {
        tableWidth = table.tableWidth;
    } else if (table.tableWidth === 'wrap') {
        tableWidth = preferredTableWidth;
    } else {
        tableWidth = pageWidth - table.margin.left - table.margin.right;
    }

    distributeWidth(table, elasticColumns, fixedWidth, elasticWidth, 0);

    // Row height, table height and text overflow
    table.rows().forEach(function (row) {
        let maxCellHeight = 0;
        table.columns.forEach(function (col) {
            let cell = row.cells[col.id];

            Config.applyStyles(table, cell.styles);
            let textSpace = col.width - cell.styles.cellPadding.left - cell.styles.cellPadding.right;
            if (cell.styles.overflow === 'linebreak') {
                // Add one pt to textSpace to fix rounding error
                try {
                    cell.text = table.doc.splitTextToSize(cell.text, textSpace + 1, {fontSize: cell.styles.fontSize});
                } catch(e) {
                    if (e instanceof TypeError && Array.isArray(cell.text)) {
                        cell.text = table.doc.splitTextToSize(cell.text.join(' '), textSpace + 1, {fontSize: cell.styles.fontSize});
                    } else {
                        throw e;
                    }
                }
            } else if (cell.styles.overflow === 'ellipsize') {
                cell.text = ellipsize(table, cell.text, textSpace, cell.styles);
            } else if (cell.styles.overflow === 'visible') {
                // Do nothing
            } else if (cell.styles.overflow === 'hidden') {
                cell.text = ellipsize(cell.text, textSpace, cell.styles, '');
            } else if (typeof cell.styles.overflow === 'function') {
                cell.text = cell.styles.overflow(cell.text, textSpace);
            } else {
                console.error("Unrecognized overflow type: " + cell.styles.overflow);
            }

            let k = Config.scaleFactor(table);
            let lineCount = Array.isArray(cell.text) ? cell.text.length : 1;
            let fontHeight = cell.styles.fontSize / k * FONT_ROW_RATIO;
            let vPadding = cell.styles.cellPadding.top + cell.styles.cellPadding.bottom;
            let contentHeight = vPadding + fontHeight;
            let vExtra = contentHeight > row.heightStyle ? vPadding : row.heightStyle - fontHeight;
            cell.contentHeight = lineCount * fontHeight + vExtra;
            if (cell.contentHeight > maxCellHeight) {
                maxCellHeight = cell.contentHeight;
            }
        });

        row.height = maxCellHeight;
    });
}

function distributeWidth(table, dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth) {
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
            distributeWidth(table, dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth);
            break;
        } else {
            col.width = col.contentWidth + extraWidth * ratio;
        }
    }
}