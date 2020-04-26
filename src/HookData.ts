import { DocHandler, jsPDFDocument } from './documentHandler'
import { Table, Cell, Row, Column, Settings } from './models'

export class HookData {
  table: Table
  pageNumber: number
  pageCount: number // Deprecated, use pageNumber instead
  settings: Settings
  doc: jsPDFDocument
  cursor: { x: number; y: number }

  constructor(table: Table, doc: DocHandler) {
    this.table = table
    this.pageNumber = table.pageNumber
    this.pageCount = this.pageNumber
    this.settings = table.settings
    this.cursor = table.cursor
    this.doc = doc.getDocument()
  }
}

export class CellHookData extends HookData {
  cell: Cell
  row: Row
  column: Column
  section: 'head' | 'body' | 'foot'

  constructor(table: Table, doc: DocHandler, cell: Cell, row: Row, column: Column) {
    super(table, doc)

    this.cell = cell
    this.row = row
    this.column = column
    this.section = row.section
  }
}
