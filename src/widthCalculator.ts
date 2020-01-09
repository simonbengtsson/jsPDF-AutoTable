import { FONT_ROW_RATIO, getTheme } from './config'
import { ellipsize, applyStyles } from './common'
import { Table, Cell } from './models'
import state from './state'

/**
 * Calculate the column widths
 */
export function calculateWidths(table: Table) {
  let columnMinWidth = 10 / state().scaleFactor()
  if (columnMinWidth * table.columns.length > table.width) {
    console.error('Columns could not fit on page')
  } else if (table.minWidth > table.width) {
    // Would be nice to improve the user experience of this
    console.error("Column widths too wide and can't fit page")
  }

  let copy = table.columns.slice(0)
  distributeWidth(copy, table.width, table.wrappedWidth)

  applyColSpans(table)
  fitContent(table)
  applyRowSpans(table)
}

function applyRowSpans(table) {
  let rowSpanCells = {}
  let colRowSpansLeft = 1
  let all = table.allRows()
  for (let rowIndex = 0; rowIndex < all.length; rowIndex++) {
    let row = all[rowIndex]
    for (let column of table.columns) {
      let data = rowSpanCells[column.index]
      if (colRowSpansLeft > 1) {
        colRowSpansLeft--
        delete row.cells[column.index]
      } else if (data) {
        data.cell.height += row.height
        if (data.cell.height > row.maxCellHeight) {
          data.row.maxCellHeight = data.cell.height
        }
        colRowSpansLeft = data.cell.colSpan
        delete row.cells[column.index]
        data.left--
        if (data.left <= 1) {
          delete rowSpanCells[column.index]
        }
      } else {
        var cell = row.cells[column.index]
        if (!cell) {
          continue
        }
        cell.height = row.height
        if (cell.rowSpan > 1) {
          let remaining = all.length - rowIndex
          let left = cell.rowSpan > remaining ? remaining : cell.rowSpan
          rowSpanCells[column.index] = { cell, left, row }
        }
      }
    }

    if (row.section === 'head') {
      table.headHeight += row.maxCellHeight
    }
    if (row.section === 'foot') {
      table.footHeight += row.maxCellHeight
    }

    table.height += row.height
  }
}

function applyColSpans(table) {
  let all = table.allRows()
  for (let rowIndex = 0; rowIndex < all.length; rowIndex++) {
    let row = all[rowIndex]

    let colSpanCell = null
    let combinedColSpanWidth = 0
    let colSpansLeft = 0
    for (
      var columnIndex = 0;
      columnIndex < table.columns.length;
      columnIndex++
    ) {
      let column = table.columns[columnIndex]
      let cell = null

      // Width and colspan
      colSpansLeft -= 1
      if (colSpansLeft > 1 && table.columns[columnIndex + 1]) {
        combinedColSpanWidth += column.width
        delete row.cells[column.index]
        continue
      } else if (colSpanCell) {
        cell = colSpanCell
        delete row.cells[column.index]
        colSpanCell = null
      } else {
        cell = row.cells[column.index]
        if (!cell) continue
        colSpansLeft = cell.colSpan
        combinedColSpanWidth = 0
        if (cell.colSpan > 1) {
          colSpanCell = cell
          combinedColSpanWidth += column.width
          continue
        }
      }
      cell.width = column.width + combinedColSpanWidth
    }
  }
}

function fitContent(table) {
  let rowSpanHeight = { count: 0, height: 0 }
  for (let row of table.allRows()) {
    for (let column of table.columns) {
      let cell: Cell = row.cells[column.index]
      if (!cell) continue

      applyStyles(cell.styles)
      let textSpace = cell.width - cell.padding('horizontal')
      if (cell.styles.overflow === 'linebreak') {
        // Add one pt to textSpace to fix rounding error
        cell.text = state().doc.splitTextToSize(
          cell.text,
          textSpace + 1 / (state().scaleFactor() || 1),
          { fontSize: cell.styles.fontSize }
        )
      } else if (cell.styles.overflow === 'ellipsize') {
        cell.text = ellipsize(cell.text, textSpace, cell.styles)
      } else if (cell.styles.overflow === 'hidden') {
        cell.text = ellipsize(cell.text, textSpace, cell.styles, '')
      } else if (typeof cell.styles.overflow === 'function') {
        cell.text = cell.styles.overflow(cell.text, textSpace)
      }

      cell.contentHeight = cell.getContentHeight()

      if (cell.styles.minCellHeight > cell.contentHeight) {
        cell.contentHeight = cell.styles.minCellHeight
      }

      let realContentHeight = cell.contentHeight / cell.rowSpan
      if (
        cell.rowSpan > 1 &&
        rowSpanHeight.count * rowSpanHeight.height <
          realContentHeight * cell.rowSpan
      ) {
        rowSpanHeight = { height: realContentHeight, count: cell.rowSpan }
      } else if (rowSpanHeight && rowSpanHeight.count > 0) {
        if (rowSpanHeight.height > realContentHeight) {
          realContentHeight = rowSpanHeight.height
        }
      }
      if (realContentHeight > row.height) {
        row.height = realContentHeight
        row.maxCellHeight = realContentHeight
      }
    }
    rowSpanHeight.count--
  }
}

function distributeWidth(autoColumns, availableSpace, wrappedAutoColumnsWidth) {
  let diffWidth = availableSpace - wrappedAutoColumnsWidth

  for (let i = 0; i < autoColumns.length; i++) {
    let column = autoColumns[i]
    let ratio = column.wrappedWidth / wrappedAutoColumnsWidth
    let suggestedChange = diffWidth * ratio
    let suggestedWidth = column.wrappedWidth + suggestedChange

    let hasCustomWidth = false
    for (const row of state().table.allRows()) {
      const cell: Cell = row.cells[column.index]
      if (cell && typeof cell.styles.cellWidth === 'number') {
        hasCustomWidth = true
        break
      }
    }

    if (suggestedWidth < column.minWidth || hasCustomWidth) {
      // Add 1 to minWidth as linebreaks calc otherwise sometimes made two rows
      column.width = column.minWidth + 1 / state().scaleFactor()
      wrappedAutoColumnsWidth -= column.wrappedWidth
      availableSpace -= column.width
      autoColumns.splice(i, 1)
      distributeWidth(autoColumns, availableSpace, wrappedAutoColumnsWidth)
      break
    }

    column.width = suggestedWidth
  }
}
