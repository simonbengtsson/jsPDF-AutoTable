import { getStringWidth } from './common'
import { Table, Cell, Column, Row } from './models'
import { DocHandler } from './documentHandler'
import { Styles } from './config'

/**
 * Calculate the column widths
 */
export function calculateWidths(doc: DocHandler, table: Table) {
  calculate(doc, table)

  const resizableColumns: Column[] = []
  let initialTableWidth = 0

  table.columns.forEach((column) => {
    const customWidth = column.getMaxCustomCellWidth(table)
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
  let resizeWidth = table.getWidth(doc.pageSize().width) - initialTableWidth

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
  if (resizeWidth > 0.1 / doc.scaleFactor()) {
    // Table can't get smaller due to custom-width or minWidth restrictions
    // We can't really do much here. Up to user to for example
    // reduce font size, increase page size or remove custom cell widths
    // to allow more columns to be reduced in size
    resizeWidth = resizeWidth < 1 ? resizeWidth : Math.round(resizeWidth)
    console.error(
      `Of the table content, ${resizeWidth} units width could not fit page`
    )
  }

  applyColSpans(table)
  fitContent(table, doc)
  applyRowSpans(table)
}

function calculate(doc: DocHandler, table: Table) {
  const sf = doc.scaleFactor()
  table.allRows().forEach((row) => {
    for (const column of table.columns) {
      const cell = row.cells[column.index]
      if (!cell) continue
      const hooks = table.hooks.didParseCell
      table.callCellHooks(doc, hooks, cell, row, column, null)

      const padding = cell.padding('horizontal')
      cell.contentWidth = getStringWidth(cell.text, cell.styles, doc) + padding

      const longestWordWidth = getStringWidth(
        cell.text.join(' ').split(/\s+/),
        cell.styles,
        doc
      )
      cell.minReadableWidth = longestWordWidth + cell.padding('horizontal')

      if (typeof cell.styles.cellWidth === 'number') {
        cell.minWidth = cell.styles.cellWidth
        cell.wrappedWidth = cell.styles.cellWidth
      } else if (cell.styles.cellWidth === 'wrap') {
        cell.minWidth = cell.contentWidth
        cell.wrappedWidth = cell.contentWidth
      } else {
        // auto
        const defaultMinWidth = 10 / sf
        cell.minWidth = cell.styles.minCellWidth || defaultMinWidth
        cell.wrappedWidth = cell.contentWidth
        if (cell.minWidth > cell.wrappedWidth) {
          cell.wrappedWidth = cell.minWidth
        }
      }
    }
  })

  table.allRows().forEach((row) => {
    for (const column of table.columns) {
      const cell = row.cells[column.index]

      // For now we ignore the minWidth and wrappedWidth of colspan cells when calculating colspan widths.
      // Could probably be improved upon however.
      if (cell && cell.colSpan === 1) {
        column.wrappedWidth = Math.max(column.wrappedWidth, cell.wrappedWidth)
        column.minWidth = Math.max(column.minWidth, cell.minWidth)
        column.minReadableWidth = Math.max(
          column.minReadableWidth,
          cell.minReadableWidth
        )
      } else {
        // Respect cellWidth set in columnStyles even if there is no cells for this column
        // or if the column only have colspan cells. Since the width of colspan cells
        // does not affect the width of columns, setting columnStyles cellWidth enables the
        // user to at least do it manually.

        // Note that this is not perfect for now since for example row and table styles are
        // not accounted for
        const columnStyles =
          table.styles.columnStyles[column.dataKey] ||
          table.styles.columnStyles[column.index] ||
          {}
        const cellWidth = columnStyles.cellWidth
        if (cellWidth && typeof cellWidth === 'number') {
          column.minWidth = cellWidth
          column.wrappedWidth = cellWidth
        }
      }

      if (cell) {
        // Make sure all columns get at least min width even though width calculations are not based on them
        if (cell.colSpan > 1 && !column.minWidth) {
          column.minWidth = cell.minWidth
        }
        if (cell.colSpan > 1 && !column.wrappedWidth) {
          column.wrappedWidth = cell.minWidth
        }
      }
    }
  })
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

function applyRowSpans(table: Table) {
  const rowSpanCells: {
    [key: string]: { cell: Cell; left: number; row: Row }
  } = {}
  let colRowSpansLeft = 1
  const all = table.allRows()
  for (let rowIndex = 0; rowIndex < all.length; rowIndex++) {
    const row = all[rowIndex]
    for (const column of table.columns) {
      const data = rowSpanCells[column.index]
      if (colRowSpansLeft > 1) {
        colRowSpansLeft--
        delete row.cells[column.index]
      } else if (data) {
        data.cell.height += row.height
        colRowSpansLeft = data.cell.colSpan
        delete row.cells[column.index]
        data.left--
        if (data.left <= 1) {
          delete rowSpanCells[column.index]
        }
      } else {
        const cell = row.cells[column.index]
        if (!cell) {
          continue
        }
        cell.height = row.height
        if (cell.rowSpan > 1) {
          const remaining = all.length - rowIndex
          const left = cell.rowSpan > remaining ? remaining : cell.rowSpan
          rowSpanCells[column.index] = { cell, left, row }
        }
      }
    }
  }
}

function applyColSpans(table: Table) {
  const all = table.allRows()
  for (let rowIndex = 0; rowIndex < all.length; rowIndex++) {
    const row = all[rowIndex]

    let colSpanCell = null
    let combinedColSpanWidth = 0
    let colSpansLeft = 0
    for (
      let columnIndex = 0;
      columnIndex < table.columns.length;
      columnIndex++
    ) {
      const column = table.columns[columnIndex]

      // Width and colspan
      colSpansLeft -= 1
      if (colSpansLeft > 1 && table.columns[columnIndex + 1]) {
        combinedColSpanWidth += column.width
        delete row.cells[column.index]
      } else if (colSpanCell) {
        const cell: Cell = colSpanCell
        delete row.cells[column.index]
        colSpanCell = null
        cell.width = column.width + combinedColSpanWidth
      } else {
        const cell = row.cells[column.index]
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

function fitContent(table: Table, doc: DocHandler) {
  let rowSpanHeight = { count: 0, height: 0 }
  for (const row of table.allRows()) {
    for (const column of table.columns) {
      const cell: Cell = row.cells[column.index]
      if (!cell) continue

      doc.applyStyles(cell.styles, true)
      const textSpace = cell.width - cell.padding('horizontal')
      if (cell.styles.overflow === 'linebreak') {
        // Add one pt to textSpace to fix rounding error
        cell.text = doc.splitTextToSize(
          cell.text,
          textSpace + 1 / doc.scaleFactor(),
          { fontSize: cell.styles.fontSize }
        )
      } else if (cell.styles.overflow === 'ellipsize') {
        cell.text = ellipsize(cell.text, textSpace, cell.styles, doc, '...')
      } else if (cell.styles.overflow === 'hidden') {
        cell.text = ellipsize(cell.text, textSpace, cell.styles, doc, '')
      } else if (typeof cell.styles.overflow === 'function') {
        cell.text = cell.styles.overflow(cell.text, textSpace)
      }

      cell.contentHeight = cell.getContentHeight(doc.scaleFactor())

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
      }
    }
    rowSpanHeight.count--
  }
}

export function ellipsize(
  text: string[],
  width: number,
  styles: Partial<Styles>,
  doc: DocHandler,
  overflow: string
): string[] {
  return text.map((str) => ellipsizeStr(str, width, styles, doc, overflow))
}

function ellipsizeStr(
  text: string,
  width: number,
  styles: Partial<Styles>,
  doc: DocHandler,
  overflow: string
): string {
  const precision = 10000 * doc.scaleFactor()
  width = Math.ceil(width * precision) / precision

  if (width >= getStringWidth(text, styles, doc)) {
    return text
  }
  while (width < getStringWidth(text + overflow, styles, doc)) {
    if (text.length <= 1) {
      break
    }
    text = text.substring(0, text.length - 1)
  }
  return text.trim() + overflow
}
