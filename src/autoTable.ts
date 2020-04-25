import { ColumnOption, RowInput, UserInput } from './interfaces'
import { DocHandler } from './documentHandler'
import { parseInput } from './inputParser'
import { calculateWidths } from './widthCalculator'
import { drawTable } from './tableDrawer'

// First definition is deprecated
export function autoTable(columns: ColumnOption[], data: RowInput[], options: UserInput): any
export function autoTable(options: UserInput): any
export function autoTable(this: any) {
  const doc = new DocHandler(this)

  // 1. Parse and unify user input
  let table = parseInput(arguments, doc)

  // 2. Calculate preliminary table, column, row and cell dimensions
  calculateWidths(table, doc)
  // 3. Output table to pdf
  drawTable(table, doc)

  table.finalY = table.cursor.y
  this.previousAutoTable = table
  this.lastAutoTable = table
  this.autoTable.previous = table // Deprecated

  doc.applyStyles(table.userStyles)
  return this
}
