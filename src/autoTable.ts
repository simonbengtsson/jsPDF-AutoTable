import { UserOptions } from './interfaces'
import { resetState, setupState } from './state'
import { parseInput } from './inputParser'
import { calculateWidths } from './widthCalculator'
import { drawTable } from './tableDrawer'
import { applyUserStyles } from './common'

export default function autoTable(options: UserOptions)
export default function autoTable(...args) {
  setupState(this)

  // 1. Parse and unify user input
  let table = parseInput(args)

  // 2. Calculate preliminary table, column, row and cell dimensions
  calculateWidths(table)

  // 3. Output table to pdf
  drawTable(table)

  table.finalY = table.cursor.y
  this.previousAutoTable = table
  this.lastAutoTable = table
  this.autoTable.previous = table // Deprecated

  applyUserStyles()
  resetState()
  return this
}
