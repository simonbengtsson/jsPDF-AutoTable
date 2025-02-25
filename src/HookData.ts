import { DocHandler, jsPDFDocument } from './documentHandler'
import { Cell, Column, Pos, Row, Settings, Table } from './models'

export class HookData {
  table: Table
  pageNumber: number
  settings: Settings
  doc: jsPDFDocument
  cursor: Pos | null

  constructor(doc: DocHandler, table: Table, cursor: Pos | null) {
    this.table = table
    this.pageNumber = table.pageNumber
    this.settings = table.settings
    this.cursor = cursor
    this.doc = doc.getDocument()
  }
}

export class CellHookData extends HookData {
  cell: Cell
  row: Row
  column: Column
  section: 'head' | 'body' | 'foot'

  constructor(
    doc: DocHandler,
    table: Table,
    cell: Cell,
    row: Row,
    column: Column,
    cursor: Pos | null,
  ) {
    super(doc, table, cursor)

    this.cell = cell
    this.row = row
    this.column = column
    this.section = row.section
  }
}
