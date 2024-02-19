'use strict'

import { UserOptions } from './config'
import { jsPDFDocument } from './documentHandler'
import { parseInput } from './inputParser'
import { drawTable } from './tableDrawer'
import { createTable } from './tableCalculator'
import { Table } from './models'
import { CellHookData } from './HookData'
import { Cell, Column, Row } from './models'

export function autoTable(doc: jsPDFDocument, options: UserOptions) {
  const input = parseInput(doc, options)
  const table = createTable(doc, input)
  drawTable(doc, table)
  doc.lastAutoTable = table
  return table
}

export { CellHookData, Table, Row, Column, Cell }
