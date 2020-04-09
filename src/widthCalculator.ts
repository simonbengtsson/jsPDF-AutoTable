import { ellipsize, applyStyles } from './common'
import { Table, Cell, Column } from './models'
import state from './state'

/**
 * Calculate the column widths
 */
export function calculateWidths(table: Table) {
  let resizableColumns: Column[] = []
  let initialTableWidth = 0

  table.columns.forEach((column) => {
    const customWidth = column.getMaxCustomCellWidth()
    if (customWidth) {
      // final column width
      column.width = customWidth
    } else {
      // initial column width (will be resized)
      column.width = column.wrappedWidth
      resizableColumns.push(column)
    }
    initialTableWidth += column.width
  })

  // width difference that needs to be distributed
  let resizeWidth = table.width - initialTableWidth

  // first resize attempt: with respect to minReadableWidth and minWidth
  if (resizeWidth) {
    resizeWidth = resizeColumns(resizableColumns, resizeWidth, (column) =>
      Math.max(column.minReadableWidth, column.minWidth)
    )
  }

  // second resize attempt: ignore minReadableWidth but respect minWidth
  if (resizeWidth) {
    resizeWidth = resizeColumns(
      resizableColumns,
      resizeWidth,
      (column) => column.minWidth
    )
  }

  resizeWidth = Math.abs(resizeWidth)
  if (resizeWidth > 1e-10) {
    // Table can't get any smaller due to custom-width or minWidth restrictions
    // We can't really do anything here. Up to user to for example
    // reduce font size, increase page size or remove custom cell widths
    // to allow more columns to be reduced in size
    resizeWidth = resizeWidth < 1 ? resizeWidth : Math.round(resizeWidth)
    console.error(
      `Of the table content, ${resizeWidth} units width could not fit page`
    )
  }

  applyColSpans(table)
  fitContent(table)
  applyRowSpans(table)
}

/**
 * Distribute resizeWidth on passed resizable columns
 */
export function resizeColumns(
  columns: Column[],
  resizeWidth: number,
  getMinWidth: (column: Column) => number
) {
  const initialResizeWidth = resizeWidth
  const sumWrappedWidth = columns.reduce(
    (acc, column) => acc + column.wrappedWidth,
    0
  )

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i]

    const ratio = column.wrappedWidth / sumWrappedWidth
    const suggestedChange = initialResizeWidth * ratio
    const suggestedWidth = column.width + suggestedChange

    const minWidth = getMinWidth(column)
    const newWidth = suggestedWidth < minWidth ? minWidth : suggestedWidth

    resizeWidth -= newWidth - column.width
    column.width = newWidth
  }

  resizeWidth = Math.round(resizeWidth * 1e10) / 1e10

  // Run the resizer again if there's remaining width needs
  // to be distributed and there're columns that can be resized
  if (resizeWidth) {
    const resizableColumns = columns.filter((column) => {
      return resizeWidth < 0
        ? column.width > getMinWidth(column) // check if column can shrink
        : true // check if column can grow
    })

    if (resizableColumns.length) {
      resizeWidth = resizeColumns(resizableColumns, resizeWidth, getMinWidth)
    }
  }

  return resizeWidth
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

      // Width and colspan
      colSpansLeft -= 1
      if (colSpansLeft > 1 && table.columns[columnIndex + 1]) {
        combinedColSpanWidth += column.width
        delete row.cells[column.index]
      } else if (colSpanCell) {
        let cell: Cell = colSpanCell
        delete row.cells[column.index]
        colSpanCell = null
        cell.width = column.width + combinedColSpanWidth
      } else {
        let cell = row.cells[column.index]
        if (!cell) continue
        colSpansLeft = cell.colSpan
        combinedColSpanWidth = 0
        if (cell.colSpan > 1) {
          colSpanCell = cell
          combinedColSpanWidth += column.width
          continue
        }
        cell.width = column.width + combinedColSpanWidth
      }
    }
  }
}

function fitContent(table) {
  let rowSpanHeight = { count: 0, height: 0 }
  for (let row of table.allRows()) {
    for (let column of table.columns) {
      let cell: Cell = row.cells[column.index]
      if (!cell) continue

      applyStyles(cell.styles, true)
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
