import { DocHandler } from './documentHandler'
import { parseInput } from './inputParser'
import { calculateWidths } from './widthCalculator'
import { drawTable } from './tableDrawer'
import { ColumnOption, RowInput, UserInput } from './config'

// First definition is deprecated
export function autoTable(columns: ColumnOption[], data: RowInput[], options: UserInput): any
export function autoTable(options: UserInput): any
export function autoTable(this: any) {
  const doc = new DocHandler(this)

  let win: Window|undefined
  if (typeof window !== 'undefined') {
    win = window
  }

  // 1. Parse and unify user input
  let table = parseInput(arguments, doc, win)

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
