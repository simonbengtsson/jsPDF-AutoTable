import { LineWidths } from './config'
import { addTableBorder, getFillStyle } from './common'
import { Cell, Column, Pos, Row, Table } from './models'
import { DocHandler, jsPDFDocument } from './documentHandler'
import { assign } from './polyfills'
import autoTableText from './autoTableText'
import { calculateAllColumnsCanFitInPage } from './tablePrinter'

export function drawTable(jsPDFDoc: jsPDFDocument, table: Table): void {
  const settings = table.settings
  const startY = settings.startY
  const margin = settings.margin
  const cursor = {
    x: margin.left,
    y: startY,
  }
  const sectionsHeight =
    table.getHeadHeight(table.columns) + table.getFootHeight(table.columns)
  let minTableBottomPos = startY + margin.bottom + sectionsHeight

  if (settings.pageBreak === 'avoid') {
    const rows = table.body
    const tableHeight = rows.reduce((acc, row) => acc + row.height, 0)

    minTableBottomPos += tableHeight
  }

  const doc = new DocHandler(jsPDFDoc)

  if (
    settings.pageBreak === 'always' ||
    (settings.startY != null && minTableBottomPos > doc.pageSize().height)
  ) {
    nextPage(doc)
    cursor.y = margin.top
  }
  table.callWillDrawPageHooks(doc, cursor)

  const startPos = assign({}, cursor)

  table.startPageNumber = doc.pageNumber()

  if (settings.horizontalPageBreak) {
    // managed flow for split columns
    printTableWithHorizontalPageBreak(doc, table, startPos, cursor)
  } else {
    // normal flow
    doc.applyStyles(doc.userStyles)

    if (
      settings.showHead === 'firstPage' ||
      settings.showHead === 'everyPage'
    ) {
      table.head.forEach((row) =>
        printRow(doc, table, row, cursor, table.columns),
      )
    }

    doc.applyStyles(doc.userStyles)
    table.body.forEach((row, index) => {
      const isLastRow = index === table.body.length - 1
      printFullRow(doc, table, row, isLastRow, startPos, cursor, table.columns)
    })
    doc.applyStyles(doc.userStyles)

    if (settings.showFoot === 'lastPage' || settings.showFoot === 'everyPage') {
      table.foot.forEach((row) =>
        printRow(doc, table, row, cursor, table.columns),
      )
    }
  }

  addTableBorder(doc, table, startPos, cursor)
  table.callEndPageHooks(doc, cursor)

  table.finalY = cursor.y
  jsPDFDoc.lastAutoTable = table
  jsPDFDoc.previousAutoTable = table // Deprecated

  if (jsPDFDoc.autoTable) jsPDFDoc.autoTable.previous = table // Deprecated

  doc.applyStyles(doc.userStyles)
}

function printTableWithHorizontalPageBreak(
  doc: DocHandler,
  table: Table,
  startPos: { x: number; y: number },
  cursor: { x: number; y: number },
) {
  // calculate width of columns and render only those which can fit into page
  const allColumnsCanFitResult = calculateAllColumnsCanFitInPage(doc, table)
  const settings = table.settings

  if (settings.horizontalPageBreakBehaviour === 'afterAllRows') {
    allColumnsCanFitResult.forEach((colsAndIndexes, index: number) => {
      doc.applyStyles(doc.userStyles)
      // add page to print next columns in new page
      if (index > 0) {
        // When adding a page here, make sure not to print the footers
        // because they were already printed before on this same loop
        addPage(doc, table, startPos, cursor, colsAndIndexes.columns, true)
      } else {
        // print head for selected columns
        printHead(doc, table, cursor, colsAndIndexes.columns)
      }
      // print body & footer for selected columns
      printBody(doc, table, startPos, cursor, colsAndIndexes.columns)
      printFoot(doc, table, cursor, colsAndIndexes.columns)
    })
  } else {
    let lastRowIndexOfLastPage = -1
    const firstColumnsToFitResult = allColumnsCanFitResult[0]

    while (lastRowIndexOfLastPage < table.body.length - 1) {
      // Print the first columns, taking note of the last row printed
      let lastPrintedRowIndex = lastRowIndexOfLastPage

      if (firstColumnsToFitResult) {
        doc.applyStyles(doc.userStyles)
        const firstColumnsToFit = firstColumnsToFitResult.columns
        if (lastRowIndexOfLastPage >= 0) {
          // When adding a page here, make sure not to print the footers
          // because they were already printed before on this same loop
          addPage(doc, table, startPos, cursor, firstColumnsToFit, true)
        } else {
          printHead(doc, table, cursor, firstColumnsToFit)
        }
        lastPrintedRowIndex = printBodyWithoutPageBreaks(
          doc,
          table,
          lastRowIndexOfLastPage + 1,
          cursor,
          firstColumnsToFit,
        )
        printFoot(doc, table, cursor, firstColumnsToFit)
      }

      // Check how many rows were printed, so that the next columns would not print more rows than that
      const maxNumberOfRows = lastPrintedRowIndex - lastRowIndexOfLastPage

      // Print the next columns, never exceding maxNumberOfRows
      allColumnsCanFitResult.slice(1).forEach((colsAndIndexes) => {
        doc.applyStyles(doc.userStyles)
        // When adding a page here, make sure not to print the footers
        // because they were already printed before on this same loop
        addPage(doc, table, startPos, cursor, colsAndIndexes.columns, true)

        printBodyWithoutPageBreaks(
          doc,
          table,
          lastRowIndexOfLastPage + 1,
          cursor,
          colsAndIndexes.columns,
          maxNumberOfRows,
        )

        printFoot(doc, table, cursor, colsAndIndexes.columns)
      })

      lastRowIndexOfLastPage = lastPrintedRowIndex
    }
  }
}

function printHead(
  doc: DocHandler,
  table: Table,
  cursor: Pos,
  columns: Column[],
) {
  const settings = table.settings
  doc.applyStyles(doc.userStyles)
  if (settings.showHead === 'firstPage' || settings.showHead === 'everyPage') {
    table.head.forEach((row) => printRow(doc, table, row, cursor, columns))
  }
}

function printBody(
  doc: DocHandler,
  table: Table,
  startPos: Pos,
  cursor: Pos,
  columns: Column[],
) {
  doc.applyStyles(doc.userStyles)
  table.body.forEach((row, index) => {
    const isLastRow = index === table.body.length - 1
    printFullRow(doc, table, row, isLastRow, startPos, cursor, columns)
  })
}

function printBodyWithoutPageBreaks(
  doc: DocHandler,
  table: Table,
  startRowIndex: number,
  cursor: Pos,
  columns: Column[],
  maxNumberOfRows?: number,
): number {
  doc.applyStyles(doc.userStyles)
  maxNumberOfRows = maxNumberOfRows ?? table.body.length
  const endRowIndex = Math.min(
    startRowIndex + maxNumberOfRows,
    table.body.length,
  )
  let lastPrintedRowIndex = -1
  table.body.slice(startRowIndex, endRowIndex).forEach((row, index) => {
    const isLastRow = startRowIndex + index === table.body.length - 1

    const remainingSpace = getRemainingPageSpace(doc, table, isLastRow, cursor)
    if (row.canEntireRowFit(remainingSpace, columns)) {
      printRow(doc, table, row, cursor, columns)
      lastPrintedRowIndex = startRowIndex + index
    }
  })

  return lastPrintedRowIndex
}

function printFoot(
  doc: DocHandler,
  table: Table,
  cursor: Pos,
  columns: Column[],
) {
  const settings = table.settings
  doc.applyStyles(doc.userStyles)
  if (settings.showFoot === 'lastPage' || settings.showFoot === 'everyPage') {
    table.foot.forEach((row) => printRow(doc, table, row, cursor, columns))
  }
}

function getRemainingLineCount(
  cell: Cell,
  remainingPageSpace: number,
  doc: DocHandler,
) {
  const lineHeight = doc.getLineHeight(cell.styles.fontSize)
  const vPadding = cell.padding('vertical')
  const remainingLines = Math.floor(
    (remainingPageSpace - vPadding) / lineHeight,
  )
  return Math.max(0, remainingLines)
}

function modifyRowToFit(
  row: Row,
  remainingPageSpace: number,
  table: Table,
  doc: DocHandler,
) {
  const cells: { [key: string]: Cell } = {}
  row.spansMultiplePages = true
  row.height = 0

  let rowHeight = 0

  for (const column of table.columns) {
    const cell: Cell = row.cells[column.index]
    if (!cell) continue

    if (!Array.isArray(cell.text)) {
      cell.text = [cell.text]
    }

    let remainderCell = new Cell(cell.raw, cell.styles, cell.section)
    remainderCell = assign(remainderCell, cell)
    remainderCell.text = []

    const remainingLineCount = getRemainingLineCount(
      cell,
      remainingPageSpace,
      doc,
    )
    if (cell.text.length > remainingLineCount) {
      remainderCell.text = cell.text.splice(
        remainingLineCount,
        cell.text.length,
      )
    }

    const scaleFactor = doc.scaleFactor()
    const lineHeightFactor = doc.getLineHeightFactor()
    cell.contentHeight = cell.getContentHeight(scaleFactor, lineHeightFactor)

    if (cell.contentHeight >= remainingPageSpace) {
      cell.contentHeight = remainingPageSpace
      remainderCell.styles.minCellHeight -= remainingPageSpace
    }
    if (cell.contentHeight > row.height) {
      row.height = cell.contentHeight
    }

    remainderCell.contentHeight = remainderCell.getContentHeight(
      scaleFactor,
      lineHeightFactor,
    )
    if (remainderCell.contentHeight > rowHeight) {
      rowHeight = remainderCell.contentHeight
    }

    cells[column.index] = remainderCell
  }
  const remainderRow = new Row(row.raw, -1, row.section, cells, true)
  remainderRow.height = rowHeight

  for (const column of table.columns) {
    const remainderCell = remainderRow.cells[column.index]
    if (remainderCell) {
      remainderCell.height = remainderRow.height
    }
    const cell = row.cells[column.index]
    if (cell) {
      cell.height = row.height
    }
  }

  return remainderRow
}

function shouldPrintOnCurrentPage(
  doc: DocHandler,
  row: Row,
  remainingPageSpace: number,
  table: Table,
) {
  const pageHeight = doc.pageSize().height
  const margin = table.settings.margin
  const marginHeight = margin.top + margin.bottom
  let maxRowHeight = pageHeight - marginHeight
  if (row.section === 'body') {
    // Should also take into account that head and foot is not
    // on every page with some settings
    maxRowHeight -=
      table.getHeadHeight(table.columns) + table.getFootHeight(table.columns)
  }

  const minRowHeight = row.getMinimumRowHeight(table.columns, doc)
  const minRowFits = minRowHeight < remainingPageSpace
  if (minRowHeight > maxRowHeight) {
    console.error(
      `Will not be able to print row ${row.index} correctly since it's minimum height is larger than page height`,
    )
    return true
  }

  if (!minRowFits) {
    return false
  }

  const rowHasRowSpanCell = row.hasRowSpan(table.columns)
  const rowHigherThanPage = row.getMaxCellHeight(table.columns) > maxRowHeight
  if (rowHigherThanPage) {
    if (rowHasRowSpanCell) {
      console.error(
        `The content of row ${row.index} will not be drawn correctly since drawing rows with a height larger than the page height and has cells with rowspans is not supported.`,
      )
    }
    return true
  }

  if (rowHasRowSpanCell) {
    // Currently a new page is required whenever a rowspan row don't fit a page.
    return false
  }

  if (table.settings.rowPageBreak === 'avoid') {
    return false
  }

  // In all other cases print the row on current page
  return true
}

function printFullRow(
  doc: DocHandler,
  table: Table,
  row: Row,
  isLastRow: boolean,
  startPos: Pos,
  cursor: Pos,
  columns: Column[],
) {
  const remainingSpace = getRemainingPageSpace(doc, table, isLastRow, cursor)
  if (row.canEntireRowFit(remainingSpace, columns)) {
    // The row fits in the current page
    printRow(doc, table, row, cursor, columns)
  } else if (shouldPrintOnCurrentPage(doc, row, remainingSpace, table)) {
    // The row gets split in two here, each piece in one page
    const remainderRow = modifyRowToFit(row, remainingSpace, table, doc)
    printRow(doc, table, row, cursor, columns)
    addPage(doc, table, startPos, cursor, columns)
    printFullRow(doc, table, remainderRow, isLastRow, startPos, cursor, columns)
  } else {
    // The row get printed entirelly on the next page
    addPage(doc, table, startPos, cursor, columns)
    printFullRow(doc, table, row, isLastRow, startPos, cursor, columns)
  }
}

function printRow(
  doc: DocHandler,
  table: Table,
  row: Row,
  cursor: Pos,
  columns: Column[],
) {
  cursor.x = table.settings.margin.left
  for (const column of columns) {
    const cell = row.cells[column.index]
    if (!cell) {
      cursor.x += column.width
      continue
    }
    doc.applyStyles(cell.styles)

    cell.x = cursor.x
    cell.y = cursor.y

    const result = table.callCellHooks(
      doc,
      table.hooks.willDrawCell,
      cell,
      row,
      column,
      cursor,
    )
    if (result === false) {
      cursor.x += column.width
      continue
    }

    drawCellRect(doc, cell, cursor)

    const textPos = cell.getTextPos()
    autoTableText(
      cell.text,
      textPos.x,
      textPos.y,
      {
        halign: cell.styles.halign,
        valign: cell.styles.valign,
        maxWidth: Math.ceil(
          cell.width - cell.padding('left') - cell.padding('right'),
        ),
      },
      doc.getDocument(),
    )

    table.callCellHooks(doc, table.hooks.didDrawCell, cell, row, column, cursor)

    cursor.x += column.width
  }

  cursor.y += row.height
}

function drawCellRect(doc: DocHandler, cell: Cell, cursor: Pos) {
  const cellStyles = cell.styles

  // https://github.com/simonbengtsson/jsPDF-AutoTable/issues/774
  // TODO (v4): better solution?
  doc.getDocument().setFillColor(doc.getDocument().getFillColor())

  if (typeof cellStyles.lineWidth === 'number') {
    // Draw cell background with normal borders
    const fillStyle = getFillStyle(cellStyles.lineWidth, cellStyles.fillColor)
    if (fillStyle) {
      doc.rect(cell.x, cursor.y, cell.width, cell.height, fillStyle)
    }
  } else if (typeof cellStyles.lineWidth === 'object') {
    // Draw cell background
    if (cellStyles.fillColor) {
      doc.rect(cell.x, cursor.y, cell.width, cell.height, 'F')
    }
    // Draw cell individual borders
    drawCellBorders(doc, cell, cursor, cellStyles.lineWidth)
  }
}

/**
 * Draw all specified borders. Borders are centered on cell's edge and lengthened
 * to overlap with neighbours to create sharp corners.
 * @param doc
 * @param cell
 * @param cursor
 * @param fillColor
 * @param lineWidth
 */
function drawCellBorders(
  doc: DocHandler,
  cell: Cell,
  cursor: Pos,
  lineWidth: Partial<LineWidths>,
) {
  let x1, y1, x2, y2

  if (lineWidth.top) {
    x1 = cursor.x
    y1 = cursor.y
    x2 = cursor.x + cell.width
    y2 = cursor.y
    if (lineWidth.right) {
      x2 += 0.5 * lineWidth.right
    }
    if (lineWidth.left) {
      x1 -= 0.5 * lineWidth.left
    }
    drawLine(lineWidth.top, x1, y1, x2, y2)
  }

  if (lineWidth.bottom) {
    x1 = cursor.x
    y1 = cursor.y + cell.height
    x2 = cursor.x + cell.width
    y2 = cursor.y + cell.height
    if (lineWidth.right) {
      x2 += 0.5 * lineWidth.right
    }
    if (lineWidth.left) {
      x1 -= 0.5 * lineWidth.left
    }
    drawLine(lineWidth.bottom, x1, y1, x2, y2)
  }

  if (lineWidth.left) {
    x1 = cursor.x
    y1 = cursor.y
    x2 = cursor.x
    y2 = cursor.y + cell.height
    if (lineWidth.top) {
      y1 -= 0.5 * lineWidth.top
    }
    if (lineWidth.bottom) {
      y2 += 0.5 * lineWidth.bottom
    }
    drawLine(lineWidth.left, x1, y1, x2, y2)
  }

  if (lineWidth.right) {
    x1 = cursor.x + cell.width
    y1 = cursor.y
    x2 = cursor.x + cell.width
    y2 = cursor.y + cell.height
    if (lineWidth.top) {
      y1 -= 0.5 * lineWidth.top
    }
    if (lineWidth.bottom) {
      y2 += 0.5 * lineWidth.bottom
    }
    drawLine(lineWidth.right, x1, y1, x2, y2)
  }

  function drawLine(
    width: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) {
    doc.getDocument().setLineWidth(width)
    doc.getDocument().line(x1, y1, x2, y2, 'S')
  }
}

function getRemainingPageSpace(
  doc: DocHandler,
  table: Table,
  isLastRow: boolean,
  cursor: Pos,
) {
  let bottomContentHeight = table.settings.margin.bottom
  const showFoot = table.settings.showFoot
  if (showFoot === 'everyPage' || (showFoot === 'lastPage' && isLastRow)) {
    bottomContentHeight += table.getFootHeight(table.columns)
  }
  return doc.pageSize().height - cursor.y - bottomContentHeight
}

export function addPage(
  doc: DocHandler,
  table: Table,
  startPos: Pos,
  cursor: Pos,
  columns: Column[] = [],
  suppressFooter: boolean = false,
) {
  doc.applyStyles(doc.userStyles)
  if (table.settings.showFoot === 'everyPage' && !suppressFooter) {
    table.foot.forEach((row: Row) => printRow(doc, table, row, cursor, columns))
  }

  // Add user content just before adding new page ensure it will
  // be drawn above other things on the page
  table.callEndPageHooks(doc, cursor)

  const margin = table.settings.margin
  addTableBorder(doc, table, startPos, cursor)
  nextPage(doc)
  table.pageNumber++
  table.pageCount++
  cursor.x = margin.left
  cursor.y = margin.top
  startPos.y = margin.top

  // call didAddPage hooks before any content is added to the page
  table.callWillDrawPageHooks(doc, cursor)

  if (table.settings.showHead === 'everyPage') {
    table.head.forEach((row: Row) => printRow(doc, table, row, cursor, columns))
    doc.applyStyles(doc.userStyles)
  }
}

function nextPage(doc: DocHandler) {
  const current = doc.pageNumber()
  doc.setPage(current + 1)
  const newCurrent = doc.pageNumber()

  if (newCurrent === current) {
    doc.addPage()
    return true
  }
  return false
}
