import { getStringWidth, getPageNetWidth } from './common'
import { Table, Column, Row, Cell } from './models'
import { DocHandler } from './documentHandler'
import { TableWidthType, CellWidthType, Styles } from './config'

/**
 * Calculate the column widths
 */
export function calculateWidths(doc: DocHandler, table: Table) {
  // Stage-1: Calculate and distribute the initial column widths
  let excessWidth = distributeInitialWidth(doc, table)
  const resizableColumns = table.columns.filter((column) => !column.isFixed)

  // Stage-2: Distribute excess width on resizable columns with respect to minContentWidth and minWidth
  if (excessWidth) {
    excessWidth = distributeExcessWidth(resizableColumns, excessWidth)
  }

  // Stage-3: Distribute any remaining negative excess width by ignoring minContentWidth
  //          but respecting minWidth while trying to minimize word-breaking in columns
  if (excessWidth < 0) {
    excessWidth = shrinkColumnsBeyondMinContent(resizableColumns, excessWidth)
  }

  // Report any remaining excess width (only when negative)
  if (excessWidth < -1 / doc.scaleFactor() /* 1pt */) {
    // Table can't get smaller due to custom-width or minWidth restrictions
    // We can't really do much here. Up to user to for example
    // reduce font size, increase page size or remove custom cell widths
    // to allow more columns to be reduced in size
    excessWidth = Math.abs(excessWidth)
    excessWidth = excessWidth < 1 ? excessWidth : Math.round(excessWidth)
    console.warn(
      `[AutoTable] The table exceeds the allowed width by ${excessWidth} units, columns cannot get any smaller due to set restrictions.`,
    )
  }

  // Calculate the final table width
  const totalWidth = table.columns.reduce(
    (total, column) => total + column.width,
    0,
  )

  // Round floating-point summing inaccuracies to better reflect the defined tableWidth
  table.width = Math.round(totalWidth * 1e10) / 1e10

  applyColSpans(table)
  fitContent(table, doc)
  applyRowSpans(table)
}

function distributeInitialWidth(doc: DocHandler, table: Table): number {
  const pageNetWidth = getPageNetWidth(doc, table)
  let sumInitialWidth = 0

  // Start by processing cells Width styles, which are inherited from the columns if not set
  for (const row of table.allRows()) {
    for (const column of table.columns) {
      const cell = row.cells[column.index]
      if (!cell) continue

      table.callCellHook(doc, table.hooks.didParseCell, cell, row, column, null)

      const padding = cell.padding('horizontal')
      cell.contentWidth = getStringWidth(cell.text, cell.styles, doc) + padding

      // Calculate the minimum width required to fit the content in a readable manner
      // (in which there's no word-breaking)
      const longestWordWidth = getStringWidth(
        cell.text.join(' ').split(/\s+/),
        cell.styles,
        doc,
      )
      cell.minContentWidth = longestWordWidth + padding

      const minCellWidth = resolveWidthStyle(
        cell.styles.minCellWidth,
        cell.minContentWidth,
        cell.contentWidth,
      )
      const maxCellWidth = resolveWidthStyle(
        cell.styles.maxCellWidth,
        cell.minContentWidth,
        cell.contentWidth,
      )

      const cellWidth = resolveWidthStyle(
        cell.styles.cellWidth,
        cell.minContentWidth,
        cell.contentWidth,
      )

      // TODO: colSpan
      // For now we only aggregate widths of non colSpan cells
      // This will change when colSpan width algorithm is implemented.
      if (cell.colSpan === 1) {
        column.minWidth = Math.max(column.minWidth, minCellWidth ?? 0)
        column.maxWidth = Math.min(column.maxWidth, maxCellWidth ?? Infinity)

        column.minContentWidth = Math.max(
          column.minContentWidth,
          cell.minContentWidth,
        )
        column.maxContentWidth = Math.max(
          column.maxContentWidth,
          cell.contentWidth,
        )

        // Aggregate the width and mark the column as fixed if any of the non-colSpan cells has a defined width
        if (cellWidth !== undefined) {
          column.width = Math.max(column.width, cellWidth)
          column.isFixed = true
        }
      }
    }
  }

  // Process columns styles last to take into account aggregated cells content widths
  for (const column of table.columns) {
    // TODO: Process colSpan cells here? <<

    const columnStyles = column.getStyles(table.styles)

    const minWidth = resolveWidthStyle(
      columnStyles.minCellWidth,
      column.minContentWidth,
      column.maxContentWidth,
    )
    column.minWidth = Math.max(column.minWidth, minWidth ?? 0)

    const maxWidth = resolveWidthStyle(
      columnStyles.maxCellWidth,
      column.minContentWidth,
      column.maxContentWidth,
    )

    // Column maxCellWidth (if set) overrides any maxCellWidth set on the cells
    if (maxWidth !== undefined) {
      column.maxWidth = maxWidth
    }

    let width = resolveWidthStyle(
      columnStyles.cellWidth,
      column.minContentWidth,
      column.maxContentWidth,
    )

    // Fixed column (column width is set)
    if (width !== undefined) {
      column.isFixed = true
    }

    // If column is still not fixed, inherit tableWidth if it's content-based
    // this includes 'fit-content' which is similar to 'max-content' but limited to page width
    if (!column.isFixed && typeof table.settings.tableWidth !== 'number') {
      width = resolveWidthStyle(
        table.settings.tableWidth,
        column.minContentWidth,
        column.maxContentWidth,
      )
    }

    // In horizontalPageBreak mode, assign maxContentWidth (clamped to page width) to auto columns with no width
    if (
      table.settings.horizontalPageBreak &&
      !column.isFixed &&
      width === undefined
    ) {
      width = Math.min(column.maxContentWidth, pageNetWidth)
    }

    // Final clamped column width before excess width distribution
    if (column.isFixed || width !== undefined) {
      column.width = clampMinMax(
        Math.max(column.width, width ?? 0),
        column.minWidth,
        column.maxWidth,
      )
    }

    // Set default minCellWidth if not set (only for auto columns)
    // this is to prevent shrinking auto columns to zero width later
    if (
      !(
        column.isFixed ||
        column.minWidth ||
        typeof columnStyles.minCellWidth === 'number' ||
        typeof table.styles.styles.minCellWidth === 'number'
      )
    ) {
      column.minWidth = 10 / doc.scaleFactor() // 10pt
    }

    sumInitialWidth += column.width
  }

  // At this point we have :
  // - Fixed columns that have received their final clamped width, as defined on the column or any of its cells.
  // - Auto columns that have either:
  //   - Inherited the tableWidth if it's content-based and received the appropriate clamped width.
  //   - Received their clamped maxContentWidth when in horizontalPageBreak mode.
  //   - If none of the above, they have not yet been assigned a width, which will happen in the next stage.

  // Next we calculate the target table width and the excess width that will be distributed on auto columns
  let targetWidth = 0

  if (typeof table.settings.tableWidth === 'number') {
    // Fixed table width
    targetWidth = table.settings.tableWidth
  } else if (table.settings.tableWidth === 'auto') {
    if (table.settings.horizontalPageBreak) {
      // In horizontalPageBreak mode, width should already be distributed
      // just make sure it's not shorter than the page in 'auto' tableWidth mode
      targetWidth = Math.max(sumInitialWidth, pageNetWidth)
    } else {
      // Table is stretched (or shrunk) to fit the page
      targetWidth = pageNetWidth
    }
  } else if (table.settings.tableWidth === 'fit-content') {
    if (table.settings.horizontalPageBreak) {
      // In horizontalPageBreak mode, content width should already be distributed
      targetWidth = sumInitialWidth
    } else {
      // Table width is the minimum of maxContentWidth and page width
      targetWidth = Math.min(sumInitialWidth, pageNetWidth)
    }
  } else {
    // Content-based table width should already be distributed on auto columns
    // when they inherited tableWidth (min-content, max-content)
    targetWidth = sumInitialWidth
  }

  // Excess width available for distribution, which could be:
  // (+) positive (columns need to grow)
  // (-) negative (columns need to shrink)
  // (0) zero (table already has the desired width)
  return targetWidth - sumInitialWidth
}

/**
 * Resolve width style to a value
 */
function resolveWidthStyle(
  WidthStyle: CellWidthType | TableWidthType | undefined,
  minContentWidth: number,
  maxContentWidth: number,
) {
  if (typeof WidthStyle === 'number') {
    return WidthStyle
  } else if (WidthStyle === 'min-content') {
    return minContentWidth
  } else if (WidthStyle === 'max-content' || WidthStyle === 'fit-content') {
    return maxContentWidth
  } else {
    // auto
    return undefined
  }
}

/**
 * Clamp a value by a minimum and a maximum limits
 * (min overrides max)
 */
function clampMinMax(value: number, min = 0, max = Infinity): number {
  // Process max first to ensure min overrides max (To be consistent with CSS)
  return Math.max(Math.min(value, max), min)
}

/**
 * Distribute excessWidth on given resizable columns based on maxContentWidth ratio
 * with respect to minContentWidth and minWidth of each of the columns
 */
function distributeExcessWidth(columns: Column[], excessWidth: number): number {
  const initialExcessWidth = excessWidth
  const sumMaxContentWidth = columns.reduce(
    (total, column) => total + column.maxContentWidth,
    0,
  )

  // Cannot distribute any width if there's no maxContentWidth to calculate the base ratio
  if (sumMaxContentWidth === 0) return excessWidth

  for (const column of columns) {
    const ratio = column.maxContentWidth / sumMaxContentWidth
    const suggestedChange = initialExcessWidth * ratio
    const suggestedWidth = column.width + suggestedChange

    const newWidth = clampMinMax(
      Math.max(suggestedWidth, column.minContentWidth),
      column.minWidth,
      column.maxWidth,
    )

    excessWidth -= newWidth - column.width
    column.width = newWidth
  }

  // Continue running recursively until all the excess width has been distributed
  // or there are no more columns that can be resized any further
  if (Math.abs(excessWidth) > 1e-10) {
    const resizableColumns = columns.filter((column) => {
      return excessWidth < 0
        ? column.width > Math.max(column.minWidth, column.minContentWidth) // check if column can shrink
        : column.width < column.maxWidth // check if column can grow
    })

    if (resizableColumns.length) {
      excessWidth = distributeExcessWidth(resizableColumns, excessWidth)
    }
  }

  return excessWidth
}

/**
 * Distribute negative excessWidth on given resizable columns when they're at their minContentWidth limit.
 * Doing so will cause the columns to shrink beyond their minContentWidth causing definite word-break so this
 * algorithm helps minimizing that by first shrinking the longest column and then moving to the next in size-order.
 */
function shrinkColumnsBeyondMinContent(
  columns: Column[],
  excessWidth: number,
): number {
  // Make sure this is used only for shrinking
  if (excessWidth >= 0) return excessWidth

  // Sort columns by width, from longest to shortest
  columns.sort((a, b) => {
    return a.width < b.width ? 1 : -1
  })

  // equalColumns will hold grouped columns that will shrink together to the same width.
  // They will shrink down to the next column in queue then it will join them in the next round
  const equalColumns: Column[] = []
  distribute(true)

  function distribute(pushNextColumn: boolean) {
    const column = pushNextColumn ? columns.shift() : equalColumns[0]

    // End the recursion when there're no more columns to work on
    if (!column) return

    if (pushNextColumn) equalColumns.push(column)

    // Distribute the excess width on the grouped columns equally
    const equalShare = excessWidth / equalColumns.length
    let suggestedWidth = column.width + equalShare

    // Limit shrinking to the width of the next column in queue
    let nextLimitReached = false
    if (columns.length) {
      if (suggestedWidth < columns[0].width) {
        suggestedWidth = columns[0].width
        nextLimitReached = true
      }
    }

    const constrainedColumns: number[] = []

    // Shrink the grouped columns to the same width with respect to each minWidth
    equalColumns.forEach((column, i) => {
      const constrained = suggestedWidth < column.minWidth
      const newWidth = constrained ? column.minWidth : suggestedWidth
      excessWidth -= newWidth - column.width
      column.width = newWidth
      if (constrained) constrainedColumns.push(i)
    })

    // Removed any columns that reached their minWidth limit
    if (constrainedColumns.length) {
      for (const i of constrainedColumns.reverse()) {
        equalColumns.splice(i, 1)
      }
      // Redistribute the excess width that was supposed to be given to the constrained columns
      // before adding the next column in the queue as long as there're still columns in the group
      return distribute(equalColumns.length == 0)
    }

    // Recursively run until all the excess width has been distributed (or there're no more columns)
    if (nextLimitReached) distribute(true)
  }

  return excessWidth
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
      if (cell.width) {
        if (cell.styles.overflow === 'linebreak') {
          // Add one pt to textSpace to fix rounding error
          cell.text = doc.splitTextToSize(
            cell.text,
            textSpace + 1 / doc.scaleFactor(),
            { fontSize: cell.styles.fontSize },
          )
        } else if (cell.styles.overflow === 'ellipsize') {
          cell.text = ellipsize(cell.text, textSpace, cell.styles, doc, '...')
        } else if (cell.styles.overflow === 'hidden') {
          cell.text = ellipsize(cell.text, textSpace, cell.styles, doc, '')
        } else if (typeof cell.styles.overflow === 'function') {
          const result = cell.styles.overflow(cell.text, textSpace)
          if (typeof result === 'string') {
            cell.text = [result]
          } else {
            cell.text = result
          }
        }
      } else {
        // Empty the cell if it has no width to prevent unwanted extra height
        // otherwise it would require a line-height for each character in the cell
        cell.text = ['']
      }

      cell.contentHeight = cell.getContentHeight(
        doc.scaleFactor(),
        doc.getLineHeightFactor(),
      )

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
  overflow: string,
): string[] {
  return text.map((str) => ellipsizeStr(str, width, styles, doc, overflow))
}

function ellipsizeStr(
  text: string,
  width: number,
  styles: Partial<Styles>,
  doc: DocHandler,
  overflow: string,
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
