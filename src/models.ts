import {
  CellInput,
  Color,
  ColumnOption,
  FONT_ROW_RATIO,
  HtmlRowInput,
  RowInput,
  Styles,
} from './config'
import { DocHandler } from './documentHandler'
import { CellHookData, HookData } from './HookData'
import { marginOrPadding, MarginPadding } from './common'

export type PageHook = (data: HookData) => void | boolean
export type CellHook = (data: CellHookData) => void | boolean

export type HookProp =
  | 'didParseCell'
  | 'willDrawCell'
  | 'didDrawCell'
  | 'didDrawPage'

export interface HookProps {
  didParseCell: CellHook[]
  willDrawCell: CellHook[]
  didDrawCell: CellHook[]
  didDrawPage: PageHook[]
}

export interface Settings {
  includeHiddenHtml: boolean
  useCss: boolean
  theme: 'striped' | 'grid' | 'plain'
  startY: number
  margin: MarginPadding
  pageBreak: 'auto' | 'avoid' | 'always'
  rowPageBreak: 'auto' | 'avoid'
  tableWidth: 'auto' | 'wrap' | number
  showHead: 'everyPage' | 'firstPage' | 'never'
  showFoot: 'everyPage' | 'lastPage' | 'never'
  tableLineWidth: number
  tableLineColor: Color
}

export type StyleProp =
  | 'styles'
  | 'headStyles'
  | 'bodyStyles'
  | 'footStyles'
  | 'alternateRowStyles'
  | 'columnStyles'

export interface StylesProps {
  styles: Partial<Styles>
  headStyles: Partial<Styles>
  bodyStyles: Partial<Styles>
  footStyles: Partial<Styles>
  alternateRowStyles: Partial<Styles>
  columnStyles: { [key: string]: Partial<Styles> }
}

export class Table {
  id?: string | number
  cursor = { x: 0, y: 0 }
  settings: Settings
  styles: StylesProps

  columns: Column[] = []

  head: Row[] = []
  body: Row[] = []
  foot: Row[] = []

  wrappedWidth = 0
  minWidth = 0
  width = 0
  height = 0
  headHeight = 0
  footHeight = 0

  startPageNumber = 1
  pageNumber = 1

  // Deprecated, use pageNumber instead
  // Not using getter since:
  // https://github.com/simonbengtsson/jsPDF-AutoTable/issues/596
  pageCount = 1

  pageStartX = 0
  pageStartY = 0
  finalY = 0

  hooks: HookProps

  constructor(
    id: string | number | undefined,
    settings: Settings,
    styles: StylesProps,
    hooks: HookProps,
    content: { body: Row[]; head: Row[]; foot: Row[]; columns: Column[] }
  ) {
    this.id = id
    this.settings = settings
    this.styles = styles
    this.hooks = hooks
    this.columns = content.columns
    this.head = content.head
    this.body = content.body
    this.foot = content.foot
  }

  allRows() {
    return this.head.concat(this.body).concat(this.foot)
  }

  callCellHooks(
    doc: DocHandler,
    handlers: CellHook[],
    cell: Cell,
    row: Row,
    column: Column
  ): boolean {
    for (const handler of handlers) {
      const data = new CellHookData(this, doc, cell, row, column)
      const result = handler(data) === false
      // Make sure text is always string[] since user can assign string
      cell.text = Array.isArray(cell.text) ? cell.text : [cell.text]
      if (result) {
        return false
      }
    }
    return true
  }

  callEndPageHooks(doc: DocHandler) {
    doc.applyStyles(doc.userStyles)
    for (const handler of this.hooks.didDrawPage) {
      handler(new HookData(this, doc))
    }
  }
}

export class Row {
  raw: HTMLTableRowElement | RowInput
  element?: HTMLTableRowElement
  index: number
  cells: { [key: string]: Cell } = {}
  section: Section

  height = 0
  maxCellHeight = 0
  x = 0
  y = 0

  spansMultiplePages = false

  constructor(
    raw: RowInput | HTMLTableRowElement,
    index: number,
    section: Section
  ) {
    this.raw = raw
    if (raw instanceof HtmlRowInput) {
      this.raw = raw._element
      this.element = raw._element
    }
    this.index = index
    this.section = section
  }

  hasRowSpan(columns: Column[]) {
    return (
      columns.filter((column: Column) => {
        const cell = this.cells[column.index]
        if (!cell) return false
        return cell.rowSpan > 1
      }).length > 0
    )
  }

  canEntireRowFit(height: number) {
    return this.maxCellHeight <= height
  }

  getMinimumRowHeight(columns: Column[], doc: DocHandler) {
    return columns.reduce((acc: number, column: Column) => {
      const cell = this.cells[column.index]
      if (!cell) return 0
      const fontHeight =
        (cell.styles.fontSize / doc.scaleFactor()) * FONT_ROW_RATIO
      const vPadding = cell.padding('vertical')
      const oneRowHeight = vPadding + fontHeight
      return oneRowHeight > acc ? oneRowHeight : acc
    }, 0)
  }
}

export type Section = 'head' | 'body' | 'foot'
export class Cell {
  raw: HTMLTableCellElement | CellInput
  styles: Styles
  text: string[]
  section: Section

  contentHeight = 0
  contentWidth = 0
  wrappedWidth = 0
  minReadableWidth = 0
  minWidth = 0
  width = 0
  height = 0
  textPos = { y: 0, x: 0 }
  x = 0
  y = 0

  colSpan = 1
  rowSpan = 1

  constructor(raw: CellInput, styles: Styles, section: Section) {
    this.styles = styles
    this.section = section
    this.raw = raw

    let content = raw
    if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
      this.rowSpan = raw.rowSpan || 1
      this.colSpan = raw.colSpan || 1
      content = raw.content ?? raw.title ?? raw
      if (raw._element) {
        this.raw = raw._element
      }
    }

    // Stringify 0 and false, but not undefined or null
    const text = content != null ? '' + content : ''
    const splitRegex = /\r\n|\r|\n/g
    this.text = text.split(splitRegex)
  }

  getContentHeight(doc: DocHandler) {
    const lineCount = Array.isArray(this.text) ? this.text.length : 1
    const fontHeight =
      (this.styles.fontSize / doc.scaleFactor()) * FONT_ROW_RATIO
    return lineCount * fontHeight + this.padding('vertical')
  }

  padding(
    name: 'vertical' | 'horizontal' | 'top' | 'bottom' | 'left' | 'right'
  ) {
    const padding = marginOrPadding(this.styles.cellPadding, 0)
    if (name === 'vertical') {
      return padding.top + padding.bottom
    } else if (name === 'horizontal') {
      return padding.left + padding.right
    } else {
      return padding[name]
    }
  }
}

export class Column {
  raw: ColumnOption | null
  dataKey: string | number
  index: number

  wrappedWidth = 0
  minReadableWidth = 0
  minWidth = 0
  width = 0

  constructor(
    dataKey: string | number,
    raw: ColumnOption | null,
    index: number
  ) {
    this.dataKey = dataKey
    this.raw = raw
    this.index = index
  }

  getMaxCustomCellWidth(table: Table) {
    let max = 0
    for (const row of table.allRows()) {
      const cell: Cell = row.cells[this.index]
      if (cell && typeof cell.styles.cellWidth === 'number') {
        max = Math.max(max, cell.styles.cellWidth)
      }
    }
    return max
  }
}
