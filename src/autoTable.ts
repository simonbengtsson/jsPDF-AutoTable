import { DocHandler, jsPDFDocument } from './documentHandler'
import { createTable } from './inputParser'
import { calculateWidths } from './widthCalculator'
import { drawTable } from './tableDrawer'
import { ColumnInput, RowInput, UserOptions } from './config'

export function autoTable(options: UserOptions): jsPDFDocument
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function autoTable(this: jsPDFDocument, ...args: any[]) {
  const doc = new DocHandler(this)

  let win: Window | undefined
  if (typeof window !== 'undefined') {
    win = window
  }

  // 1. Parse user input
  const options = parseUserInput(args)
  const table = createTable(options, doc, win)

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseUserInput(args: any[]): UserOptions {
  if (args.length === 1) {
    return args[0] as UserOptions
  } else {
    console.error(
      `Use of deprecated initiation format, use the new autoTable({/* options */}) instead`
    )
    const opts: UserOptions = args[2] || {}
    opts.columns = args[0] as ColumnInput[]
    opts.body = args[1] as RowInput[]
    return opts
  }
}
