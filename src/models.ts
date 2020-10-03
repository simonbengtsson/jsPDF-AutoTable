import {
  CellInput,
  Color,
  ColumnInput,
  FONT_ROW_RATIO,
  HtmlRowInput,
  RowInput,
  Styles,
} from './config'
import { DocHandler } from './documentHandler'
import { CellHookData, HookData } from './HookData'
import { parseSpacing, MarginPadding } from './common'
import { TableInput } from './inputParser'

export type Pos = { x: number; y: number }
export type PageHook = (data: HookData) => void | boolean
export type CellHook = (data: CellHookData) => void | boolean

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
  horizontalPageBreak?: boolean
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

type ContentSettings = {
  body: Row[]
  head: Row[]
  foot: Row[]
  columns: Column[]
}
export class Table {
  readonly id?: string | number

  readonly settings: Settings
  readonly styles: StylesProps
  readonly hooks: HookProps

  readonly columns: Column[]
  readonly head: Row[]
  readonly body: Row[]
  readonly foot: Row[]

  pageNumber = 1
  finalY?: number
  startPageNumber?: number

  // Deprecated, use pageNumber instead
  // Not using getter since:
  // https://github.com/simonbengtsson/jsPDF-AutoTable/issues/596
  pageCount = 1

  constructor(input: TableInput, content: ContentSettings) {
    this.id = input.id
    this.settings = input.settings
    this.styles = input.styles
    this.hooks = input.hooks

    this.columns = content.columns
    this.head = content.head
    this.body = content.body
    this.foot = content.foot
  }

  getHeadHeight(columns: Column[]) {
    return this.head.reduce(
      (acc, row) => acc + row.getMaxCellHeight(columns),
      0
    )
  }

  getFootHeight(columns: Column[]) {
    return this.foot.reduce(
      (acc, row) => acc + row.getMaxCellHeight(columns),
      0
    )
  }

  allRows() {
    return this.head.concat(this.body).concat(this.foot)
  }

  callCellHooks(
    doc: DocHandler,
    handlers: CellHook[],
    cell: Cell,
    row: Row,
    column: Column,
    cursor: { x: number; y: number } | null
  ): boolean {
    for (const handler of handlers) {
      const data = new CellHookData(doc, this, cell, row, column, cursor)
      const result = handler(data) === false
      // Make sure text is always string[] since user can assign string
      cell.text = Array.isArray(cell.text) ? cell.text : [cell.text]
      if (result) {
        return false
      }
    }
    return true
  }

  callEndPageHooks(doc: DocHandler, cursor: { x: number; y: number }) {
    doc.applyStyles(doc.userStyles)
    for (const handler of this.hooks.didDrawPage) {
      handler(new HookData(doc, this, cursor))
    }
  }

  getWidth(pageWidth: number) {
    if (typeof this.settings.tableWidth === 'number') {
      return this.settings.tableWidth
    } else if (this.settings.tableWidth === 'wrap') {
      const wrappedWidth = this.columns.reduce(
        (total, col) => total + col.wrappedWidth,
        0
      )
      return wrappedWidth
    } else {
      const margin = this.settings.margin
      return pageWidth - margin.left - margin.right
    }
  }
}

export class Row {
  readonly raw: HTMLTableRowElement | RowInput
  readonly element?: HTMLTableRowElement
  readonly index: number
  readonly section: Section
  readonly cells: { [key: string]: Cell }
  spansMultiplePages: boolean

  height = 0

  constructor(
    raw: RowInput | HTMLTableRowElement,
    index: number,
    section: Section,
    cells: { [key: string]: Cell },
    spansMultiplePages = false
  ) {
    this.raw = raw
    if (raw instanceof HtmlRowInput) {
      this.raw = raw._element
      this.element = raw._element
    }
    this.index = index
    this.section = section
    this.cells = cells
    this.spansMultiplePages = spansMultiplePages
  }

  getMaxCellHeight(columns: Column[]) {
    return columns.reduce(
      (acc, column) => Math.max(acc, this.cells[column.index]?.height || 0),
      0
    )
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

  canEntireRowFit(height: number, columns: Column[]) {
    return this.getMaxCellHeight(columns) <= height
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
  colSpan: number
  rowSpan: number

  contentHeight = 0
  contentWidth = 0
  wrappedWidth = 0
  minReadableWidth = 0
  minWidth = 0

  width = 0
  height = 0
  x = 0
  y = 0

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
    } else {
      this.rowSpan = 1
      this.colSpan = 1
    }

    // Stringify 0 and false, but not undefined or null
    const text = content != null ? '' + content : ''
    const splitRegex = /\r\n|\r|\n/g
    this.text = text.split(splitRegex)
  }

  getTextPos(): Pos {
    let y
    if (this.styles.valign === 'top') {
      y = this.y + this.padding('top')
    } else if (this.styles.valign === 'bottom') {
      y = this.y + this.height - this.padding('bottom')
    } else {
      const netHeight = this.height - this.padding('vertical')
      y = this.y + netHeight / 2 + this.padding('top')
    }

    let x
    if (this.styles.halign === 'right') {
      x = this.x + this.width - this.padding('right')
    } else if (this.styles.halign === 'center') {
      const netWidth = this.width - this.padding('horizontal')
      x = this.x + netWidth / 2 + this.padding('left')
    } else {
      x = this.x + this.padding('left')
    }
    return { x, y }
  }

  getContentHeight(scaleFactor: number) {
    const lineCount = Array.isArray(this.text) ? this.text.length : 1
    const fontHeight = (this.styles.fontSize / scaleFactor) * FONT_ROW_RATIO
    const height = lineCount * fontHeight + this.padding('vertical')
    return Math.max(height, this.styles.minCellHeight)
  }

  padding(
    name: 'vertical' | 'horizontal' | 'top' | 'bottom' | 'left' | 'right'
  ) {
    const padding = parseSpacing(this.styles.cellPadding, 0)
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
  raw: ColumnInput | null
  dataKey: string | number
  index: number

  wrappedWidth = 0
  minReadableWidth = 0
  minWidth = 0
  width = 0

  constructor(
    dataKey: string | number,
    raw: ColumnInput | null,
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
