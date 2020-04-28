import { DocHandler, jsPDFDocument } from './documentHandler'
import { createTable } from './inputParser'
import { calculateWidths } from './widthCalculator'
import { drawTable } from './tableDrawer'
import { UserOptions } from './config'

export default function autoTable(doc: jsPDFDocument, options: UserOptions) {
  const docHandler = new DocHandler(doc)

  let win: Window | undefined
  if (typeof window !== 'undefined') {
    win = window
  }

  const table = createTable(options, docHandler, win)
  calculateWidths(table, docHandler)
  drawTable(table, docHandler)

  table.finalY = table.cursor.y
  doc.previousAutoTable = table
  doc.lastAutoTable = table // Deprecated
  doc.autoTable.previous = table // Deprecated

  docHandler.applyStyles(docHandler.userStyles)
}
