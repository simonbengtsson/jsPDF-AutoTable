import { DocHandler, jsPDFDocument } from './documentHandler'
import { parseInput } from './inputParser'
import { calculateWidths } from './widthCalculator'
import { drawTable } from './tableDrawer'
import { UserOptions } from './config'

export function autoTable(options: UserOptions): jsPDFDocument
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function autoTable(this: jsPDFDocument, ...args: any) {
  const doc = new DocHandler(this)

  let win: Window | undefined
  if (typeof window !== 'undefined') {
    win = window
  }

  // 1. Parse and unify user input
  const table = parseInput(args, doc, win)

  // 2. Calculate preliminary table, column, row and cell dimensions
  calculateWidths(table, doc)

  // 3. Output table to pdf
  drawTable(table, doc)

  table.finalY = table.cursor.y
  this.previousAutoTable = table
  this.lastAutoTable = table // Deprecated
  this.autoTable.previous = table // Deprecated

  doc.applyStyles(doc.userStyles)
  return this
}
