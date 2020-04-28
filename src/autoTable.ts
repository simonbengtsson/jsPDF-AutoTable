import { DocHandler, jsPDFDocument } from './documentHandler'
import { createTable } from './inputParser'
import { calculateWidths } from './widthCalculator'
import { drawTable } from './tableDrawer'
import { UserOptions } from './config'

export function autoTable(document: jsPDFDocument, options: UserOptions) {
  const doc = new DocHandler(document)

  let win: Window | undefined
  if (typeof window !== 'undefined') {
    win = window
  }

  const table = createTable(options, doc, win)
  calculateWidths(table, doc)
  drawTable(table, doc)

  table.finalY = table.cursor.y
  document.previousAutoTable = table
  document.lastAutoTable = table // Deprecated
  document.autoTable.previous = table // Deprecated

  doc.applyStyles(doc.userStyles)
}
