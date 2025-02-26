'use strict'

import { applyPlugin } from './applyPlugin'
import { UserOptions } from './config'
import { jsPDFDocument } from './documentHandler'
import { CellHookData, HookData } from './HookData'
import { parseInput } from './inputParser'
import { Cell, Column, Row, Table } from './models'
import { createTable as _createTable } from './tableCalculator'
import { drawTable as _drawTable } from './tableDrawer'

export type autoTableInstanceType = (options: UserOptions) => void
export { applyPlugin }

export function autoTable(d: jsPDFDocument, options: UserOptions) {
  const input = parseInput(d, options)
  const table = _createTable(d, input)
  _drawTable(d, table)
}

// Experimental export
export function __createTable(d: jsPDFDocument, options: UserOptions): Table {
  const input = parseInput(d, options)
  return _createTable(d, input)
}

export function __drawTable(d: jsPDFDocument, table: Table) {
  _drawTable(d, table)
}

try {
  if (typeof window !== 'undefined' && window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyWindow = window as any
    const jsPDF = anyWindow.jsPDF || anyWindow.jspdf?.jsPDF
    if (jsPDF) {
      applyPlugin(jsPDF)
    }
  }
} catch (error) {
  console.error('Could not apply autoTable plugin', error)
}

export default autoTable
export { Cell, CellHookData, Column, HookData, Row, Table }
