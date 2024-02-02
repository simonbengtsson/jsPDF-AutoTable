'use strict'

import { UserOptions } from './config'
import { jsPDFDocument } from './documentHandler'
import { parseInput } from './inputParser'
import { drawTable as _drawTable } from './tableDrawer'
import { createTable as _createTable } from './tableCalculator'
import { Table } from './models'
import { CellHookData } from './HookData'
import { Cell, Column, Row } from './models'

export function autoTable(d: jsPDFDocument, options: UserOptions) {
  const input = parseInput(d, options)
  const table = _createTable(d, input)
  _drawTable(d, table)
}

export { CellHookData, Table, Row, Column, Cell }
