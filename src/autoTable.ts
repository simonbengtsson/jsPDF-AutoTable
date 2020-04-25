import { ColumnOption, RowInput, UserInput } from './interfaces'
import state, { resetState, setupState } from './state'
import { parseInput } from './inputParser'
import { calculateWidths } from './widthCalculator'
import { drawTable } from './tableDrawer'
import { applyStyles } from './common'

// First definition is deprecated
export function autoTable(columns: ColumnOption[], data: RowInput[], options: UserInput): any
export function autoTable(options: UserInput): any
export function autoTable(this: any) {
  setupState(this)

  // 1. Parse and unify user input
  let table = parseInput(arguments)

  // 2. Calculate preliminary table, column, row and cell dimensions
  calculateWidths(table)

  // 3. Output table to pdf
  drawTable(table)

  table.finalY = table.cursor.y
  this.previousAutoTable = table
  this.lastAutoTable = table
  this.autoTable.previous = table // Deprecated

  applyStyles(table.userStyles)
  resetState()
  return this
}
