import { FONT_ROW_RATIO } from './config'
import {
  addTableBorder,
  getFillStyle,
} from './common'
import { Cell, Row, Table } from './models'
import { DocHandler } from './documentHandler'
import { assign } from './polyfills'
import autoTableText from './autoTableText'

export function drawTable(table: Table, doc: DocHandler) {
  let settings = table.settings
  let startY = settings.startY
  let margin = settings.margin

  table.cursor = {
    x: margin.left,
    y: startY,
  }

  let minTableBottomPos =
    startY + margin.bottom + table.headHeight + table.footHeight
  if (settings.pageBreak === 'avoid') {
    minTableBottomPos += table.height
  }
  if (
    settings.pageBreak === 'always' ||
    (settings.startY != null &&
      minTableBottomPos > doc.pageSize().height)
  ) {
    nextPage(doc)
    table.cursor.y = margin.top
  }
  table.pageStartX = table.cursor.x
  table.pageStartY = table.cursor.y

  table.startPageNumber = doc.pageNumber()

  // An empty row used to cached cells those break through page
  doc.applyStyles(doc.userStyles)
  if (settings.showHead === 'firstPage' || settings.showHead === 'everyPage') {
    table.head.forEach((row) => printRow(table, row, doc))
  }
  doc.applyStyles(doc.userStyles)
  table.body.forEach(function (row, index) {
    printFullRow(table, row, index === table.body.length - 1, doc)
  })
  doc.applyStyles(doc.userStyles)
  if (settings.showFoot === 'lastPage' || settings.showFoot === 'everyPage') {
    table.foot.forEach((row) => printRow(table, row, doc))
  }

  addTableBorder(table, doc)

  table.callEndPageHooks(doc)
}

function getRemainingLineCount(cell: Cell, remainingPageSpace: number, doc: DocHandler) {
  let fontHeight =
    (cell.styles.fontSize / doc.scaleFactor()) * FONT_ROW_RATIO
  let vPadding = cell.padding('vertical', doc)
  let remainingLines = Math.floor((remainingPageSpace - vPadding) / fontHeight)
  return Math.max(0, remainingLines)
}

function modifyRowToFit(row: Row, remainingPageSpace: number, table: Table, doc: DocHandler) {
  let remainderRow = new Row(row.raw, -1, row.section)
  remainderRow.spansMultiplePages = true
  row.spansMultiplePages = true
  row.height = 0
  row.maxCellHeight = 0

  for (let column of table.columns) {
    let cell: Cell = row.cells[column.index]
    if (!cell) continue

    if (!Array.isArray(cell.text)) {
      cell.text = [cell.text]
    }

    let remainderCell = new Cell(cell.raw, cell.styles, cell.section)
    remainderCell = assign(remainderCell, cell)
    remainderCell.textPos = assign({}, cell.textPos)
    remainderCell.text = []

    let remainingLineCount = getRemainingLineCount(cell, remainingPageSpace, doc)
    if (cell.text.length > remainingLineCount) {
      remainderCell.text = cell.text.splice(
        remainingLineCount,
        cell.text.length
      )
    }

    cell.contentHeight = cell.getContentHeight(doc)
    if (cell.contentHeight > row.height) {
      row.height = cell.contentHeight
      row.maxCellHeight = cell.contentHeight
    }

    remainderCell.contentHeight = remainderCell.getContentHeight(doc)
    if (remainderCell.contentHeight > remainderRow.height) {
      remainderRow.height = remainderCell.contentHeight
      remainderRow.maxCellHeight = remainderCell.contentHeight
    }

    remainderRow.cells[column.index] = remainderCell
  }

  for (let column of table.columns) {
    let remainderCell = remainderRow.cells[column.index]
    if (remainderCell) {
      remainderCell.height = remainderRow.height
    }
    let cell = row.cells[column.index]
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
  let pageHeight = doc.pageSize().height
  let margin = table.settings.margin
  let marginHeight = margin.top + margin.bottom
  let maxRowHeight = pageHeight - marginHeight
  if (row.section === 'body') {
    // Should also take into account that head and foot is not
    // on every page with some settings
    maxRowHeight -= table.headHeight + table.footHeight
  }

  const minRowHeight = row.getMinimumRowHeight(table.columns, doc)
  let minRowFits = minRowHeight < remainingPageSpace
  if (minRowHeight > maxRowHeight) {
    console.error(
      `Will not be able to print row ${row.index} correctly since it's minimum height is larger than page height`
    )
    return true
  }

  if (!minRowFits) {
    return false
  }

  let rowHasRowSpanCell = row.hasRowSpan(table.columns)
  let rowHigherThanPage = row.maxCellHeight > maxRowHeight
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

function printFullRow(table: Table, row: Row, isLastRow: boolean, doc: DocHandler) {
  let remainingPageSpace = getRemainingPageSpace(table, isLastRow, doc)
  if (row.canEntireRowFit(remainingPageSpace)) {
    printRow(table, row, doc)
  } else {
    if (shouldPrintOnCurrentPage(doc, row, remainingPageSpace, table)) {
      let remainderRow = modifyRowToFit(row, remainingPageSpace, table, doc)
      printRow(table, row, doc)
      addPage(table, doc)
      printFullRow(table, remainderRow, isLastRow, doc)
    } else {
      addPage(table, doc)
      printFullRow(table, row, isLastRow, doc)
    }
  }
}

function printRow(table: Table, row: Row, doc: DocHandler) {
  table.cursor.x = table.settings.margin.left
  row.y = table.cursor.y
  row.x = table.cursor.x

  for (let column of table.columns) {
    let cell = row.cells[column.index]
    if (!cell) {
      table.cursor.x += column.width
      continue
    }
    doc.applyStyles(cell.styles)

    cell.x = table.cursor.x
    cell.y = row.y
    if (cell.styles.valign === 'top') {
      cell.textPos.y = table.cursor.y + cell.padding('top', doc)
    } else if (cell.styles.valign === 'bottom') {
      cell.textPos.y = table.cursor.y + cell.height - cell.padding('bottom', doc)
    } else {
      const netHeight = cell.height - cell.padding('vertical', doc)
      cell.textPos.y = table.cursor.y + netHeight / 2 + cell.padding('top', doc)
    }

    if (cell.styles.halign === 'right') {
      cell.textPos.x = cell.x + cell.width - cell.padding('right', doc)
    } else if (cell.styles.halign === 'center') {
      const netWidth = cell.width - cell.padding('horizontal', doc)
      cell.textPos.x = cell.x + netWidth / 2 + cell.padding('left', doc)
    } else {
      cell.textPos.x = cell.x + cell.padding('left', doc)
    }

    const result = table.callCellHooks(
      doc,
      table.hooks.willDrawCell,
      cell,
      row,
      column
    )
    if (result === false) {
      table.cursor.x += column.width
      continue
    }

    let cellStyles = cell.styles
    let fillStyle = getFillStyle(cellStyles.lineWidth, cellStyles.fillColor)
    if (fillStyle) {
      doc.rect(
        cell.x,
        table.cursor.y,
        cell.width,
        cell.height,
        fillStyle
      )
    }
    autoTableText(cell.text, cell.textPos.x, cell.textPos.y, {
      halign: cell.styles.halign,
      valign: cell.styles.valign,
      maxWidth: Math.ceil(
        cell.width - cell.padding('left', doc) - cell.padding('right', doc)
      ),
    }, doc.getDocument())

    table.callCellHooks(doc, table.hooks.didDrawCell, cell, row, column)

    table.cursor.x += column.width
  }

  table.cursor.y += row.height
}

function getRemainingPageSpace(table: Table, isLastRow: boolean, doc: DocHandler) {
  let bottomContentHeight = table.settings.margin.bottom
  let showFoot = table.settings.showFoot
  if (showFoot === 'everyPage' || (showFoot === 'lastPage' && isLastRow)) {
    bottomContentHeight += table.footHeight
  }
  return doc.pageSize().height - table.cursor.y - bottomContentHeight
}

export function addPage(table: Table, doc: DocHandler) {
  doc.applyStyles(doc.userStyles)
  if (table.settings.showFoot === 'everyPage') {
    table.foot.forEach((row: Row) => printRow(table, row, doc))
  }

  table.finalY = table.cursor.y

  // Add user content just before adding new page ensure it will
  // be drawn above other things on the page
  table.callEndPageHooks(doc)

  let margin = table.settings.margin
  addTableBorder(table, doc)
  nextPage(doc)
  table.pageNumber++
  table.pageCount++
  table.cursor = { x: margin.left, y: margin.top }
  table.pageStartX = table.cursor.x
  table.pageStartY = table.cursor.y

  if (table.settings.showHead === 'everyPage') {
    table.head.forEach((row: Row) => printRow(table, row, doc))
  }
}

function nextPage(doc: DocHandler) {
  let current = doc.pageNumber()
  doc.setPage(current + 1)
  let newCurrent = doc.pageNumber()

  if (newCurrent === current) {
    doc.addPage()
  }
}
