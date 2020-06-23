import { FONT_ROW_RATIO } from './config'
import { addTableBorder, getFillStyle } from './common'
import { Cell, Pos, Row, Table } from './models'
import { DocHandler, jsPDFDocument } from './documentHandler'
import { assign } from './polyfills'
import autoTableText from './autoTableText'

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
    const rows = table.allRows()
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
  const startPos = assign({}, cursor)

  table.startPageNumber = doc.pageNumber()

  doc.applyStyles(doc.userStyles)
  if (settings.showHead === 'firstPage' || settings.showHead === 'everyPage') {
    table.head.forEach((row) => printRow(doc, table, row, cursor))
  }
  doc.applyStyles(doc.userStyles)
  table.body.forEach((row, index) => {
    const isLastRow = index === table.body.length - 1
    printFullRow(doc, table, row, isLastRow, startPos, cursor)
  })
  doc.applyStyles(doc.userStyles)
  if (settings.showFoot === 'lastPage' || settings.showFoot === 'everyPage') {
    table.foot.forEach((row) => printRow(doc, table, row, cursor))
  }

  addTableBorder(doc, table, startPos, cursor)
  table.callEndPageHooks(doc, cursor)

  table.finalY = cursor.y
  jsPDFDoc.lastAutoTable = table
  jsPDFDoc.previousAutoTable = table // Deprecated
  if (jsPDFDoc.autoTable) jsPDFDoc.autoTable.previous = table // Deprecated

  doc.applyStyles(doc.userStyles)
}

function getRemainingLineCount(
  cell: Cell,
  remainingPageSpace: number,
  doc: DocHandler
) {
  const fontHeight = (cell.styles.fontSize / doc.scaleFactor()) * FONT_ROW_RATIO
  const vPadding = cell.padding('vertical')
  const remainingLines = Math.floor(
    (remainingPageSpace - vPadding) / fontHeight
  )
  return Math.max(0, remainingLines)
}

function modifyRowToFit(
  row: Row,
  remainingPageSpace: number,
  table: Table,
  doc: DocHandler
) {
  const cells: { [key: string]: Cell } = {}
  row.spansMultiplePages = true

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
      doc
    )
    if (cell.text.length > remainingLineCount) {
      remainderCell.text = cell.text.splice(
        remainingLineCount,
        cell.text.length
      )
    }

    const scaleFactor = doc.scaleFactor()
    cell.contentHeight = cell.getContentHeight(scaleFactor)

    if (cell.contentHeight >= remainingPageSpace) {
      cell.contentHeight = remainingPageSpace
      remainderCell.styles.minCellHeight -= remainingPageSpace
    }
    if (cell.contentHeight > row.height) {
      row.height = cell.contentHeight
    }

    remainderCell.contentHeight = remainderCell.getContentHeight(scaleFactor)
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
  table: Table
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
      `Will not be able to print row ${row.index} correctly since it's minimum height is larger than page height`
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
        `The content of row ${row.index} will not be drawn correctly since drawing rows with a height larger than the page height and has cells with rowspans is not supported.`
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
  cursor: Pos
) {
  const remainingSpace = getRemainingPageSpace(doc, table, isLastRow, cursor)
  if (row.canEntireRowFit(remainingSpace, table.columns)) {
    printRow(doc, table, row, cursor)
  } else {
    if (shouldPrintOnCurrentPage(doc, row, remainingSpace, table)) {
      const remainderRow = modifyRowToFit(row, remainingSpace, table, doc)
      printRow(doc, table, row, cursor)
      addPage(doc, table, startPos, cursor)
      printFullRow(doc, table, remainderRow, isLastRow, startPos, cursor)
    } else {
      addPage(doc, table, startPos, cursor)
      printFullRow(doc, table, row, isLastRow, startPos, cursor)
    }
  }
}

function printRow(doc: DocHandler, table: Table, row: Row, cursor: Pos) {
  cursor.x = table.settings.margin.left

  for (const column of table.columns) {
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
      cursor
    )
    if (result === false) {
      cursor.x += column.width
      continue
    }

    const cellStyles = cell.styles
    const fillStyle = getFillStyle(cellStyles.lineWidth, cellStyles.fillColor)
    if (fillStyle) {
      doc.rect(cell.x, cursor.y, cell.width, cell.height, fillStyle)
    }
    const textPos = cell.getTextPos()
    autoTableText(
      cell.text,
      textPos.x,
      textPos.y,
      {
        halign: cell.styles.halign,
        valign: cell.styles.valign,
        maxWidth: Math.ceil(
          cell.width - cell.padding('left') - cell.padding('right')
        ),
      },
      doc.getDocument()
    )

    table.callCellHooks(doc, table.hooks.didDrawCell, cell, row, column, cursor)

    cursor.x += column.width
  }

  cursor.y += row.height
}

function getRemainingPageSpace(
  doc: DocHandler,
  table: Table,
  isLastRow: boolean,
  cursor: Pos
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
  cursor: Pos
) {
  doc.applyStyles(doc.userStyles)
  if (table.settings.showFoot === 'everyPage') {
    table.foot.forEach((row: Row) => printRow(doc, table, row, cursor))
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

  if (table.settings.showHead === 'everyPage') {
    table.head.forEach((row: Row) => printRow(doc, table, row, cursor))
  }
}

function nextPage(doc: DocHandler) {
  const current = doc.pageNumber()
  doc.setPage(current + 1)
  const newCurrent = doc.pageNumber()

  if (newCurrent === current) {
    doc.addPage()
  }
}
