import { ellipsize, applyStyles, entries } from './common'
import { Table, Cell, Column } from './models'
import state from './state'
import { resizeColumns, resizeSentencesColumns } from './columnResizer'

/**
 * Calculate the column widths
 */
export function calculateWidths(table: Table) {
  let columns: Column[] = table.columns.slice(0)
  for (const [i, column] of entries(columns)) {
    const width = column.getMaxCustomCellWidth()
    if (width) {
      column.width = width
      columns.splice(i, 1)
    }
  }
  let resizeWidth = table.width - table.wrappedWidth
  const shouldShrink = resizeWidth < 0
  if (shouldShrink) {
    resizeWidth = resizeSentencesColumns(columns.slice(0), resizeWidth)
  }
  resizeWidth = resizeColumns(columns, resizeWidth)

  if (Math.abs(resizeWidth) > 1e-10) {
    // We can't really do anything here. Up to user to for example
    // reduce font size, increase page size or remove custom cell widths
    // to allow more columns to be reduced in size
    console.error(
      `Of the table content ${Math.round(resizeWidth)} could not fit page`
    )
  }

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
