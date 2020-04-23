import { defaultConfig, FONT_ROW_RATIO } from './config'
import state from './state'
import { CellHookData, HookData } from './HookData'
import { applyUserStyles, marginOrPadding, styles } from './common'
import { assign } from './polyfills'

type HookHandler = (data: HookData) => void | boolean
type CellHookHandler = (data: CellHookData) => void | boolean

class CellHooks {
  didParseCell: CellHookHandler[] = []
  willDrawCell: CellHookHandler[] = []
  didDrawCell: CellHookHandler[] = []
  didDrawPage: HookHandler[] = []
}

export class Table {
  id?: any
  cursor = { x: 0, y: 0 }
  doc: any
  userStyles: any
  settings: any

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

  styles: any = {
    styles: {},
    headStyles: {},
    bodyStyles: {},
    footStyles: {},
    alternateRowStyles: {},
    columnStyles: {},
  }

  cellHooks: any = new CellHooks()

  allRows() {
    return this.head.concat(this.body).concat(this.foot)
  }

  callCellHooks(
    handlers: HookHandler[] | CellHookHandler[],
    cell: Cell,
    row: Row,
    column: Column
  ): boolean {
    for (let handler of handlers) {
      if (handler(new CellHookData(cell, row, column)) === false) {
        return false
      }
    }
    return true
  }

  callEndPageHooks() {
    applyUserStyles()
    for (let handler of this.cellHooks.didDrawPage) {
      handler(new HookData())
    }
  }

  margin(side: string) {
    return marginOrPadding(this.settings.margin, defaultConfig().margin)[side]
  }
}

export class Row {
  raw: HTMLTableRowElement | any
  index: number
  cells: { [key: string]: any } = {}
  section: Section

  height = 0
  maxCellHeight = 0
  x = 0
  y = 0

  spansMultiplePages = false

  constructor(raw: any, index: number, section: Section) {
    this.raw = raw
    if (raw._element) {
      this.raw = raw._element
    }
    this.index = index
    this.section = section
  }

  hasRowSpan() {
    return (
      state().table.columns.filter((column: Column) => {
        let cell = this.cells[column.index]
        if (!cell) return false
        return cell.rowSpan > 1
      }).length > 0
    )
  }

  canEntireRowFit(height: number) {
    return this.maxCellHeight <= height
  }

  getMinimumRowHeight() {
    return state().table.columns.reduce((acc: number, column: Column) => {
      let cell = this.cells[column.index]
      if (!cell) return 0
      let fontHeight =
        (cell.styles.fontSize / state().scaleFactor()) * FONT_ROW_RATIO
      let vPadding = cell.padding('vertical')
      let oneRowHeight = vPadding + fontHeight
      return oneRowHeight > acc ? oneRowHeight : acc
    }, 0)
  }
}

export type Section = 'head' | 'body' | 'foot'
export class Cell {
  raw: HTMLTableCellElement | any
  styles: any
  text: string | string[]
  section: Section

  contentHeight = 0
  contentWidth = 0
  wrappedWidth = 0
  minReadableWidth = 0
  minWidth = 0
  width = 0
  height = 0
  textPos = {}
  x = 0
  y = 0

  colSpan: number
  rowSpan: number

  constructor(raw: any, themeStyles: any, section: Section) {
    this.rowSpan = (raw && raw.rowSpan) || 1
    this.colSpan = (raw && raw.colSpan) || 1
    this.styles = assign(themeStyles, (raw && raw.styles) || {})
    this.section = section

    let text
    let content = raw && raw.content != null ? raw.content : raw
    content = content && content.title != null ? content.title : content

    this.raw = raw && raw._element ? raw._element : raw

    // Stringify 0 and false, but not undefined or null
    text = content != null ? '' + content : ''

    let splitRegex = /\r\n|\r|\n/g
    this.text = text.split(splitRegex)
  }

  getContentHeight() {
    let lineCount = Array.isArray(this.text) ? this.text.length : 1
    let fontHeight =
      (this.styles.fontSize / state().scaleFactor()) * FONT_ROW_RATIO
    return lineCount * fontHeight + this.padding('vertical')
  }

  padding(
    name: 'vertical' | 'horizontal' | 'top' | 'bottom' | 'left' | 'right'
  ) {
    let padding = marginOrPadding(
      this.styles.cellPadding,
      styles([]).cellPadding
    )
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
  raw: any
  dataKey: string | number
  index: number

  wrappedWidth = 0
  minReadableWidth = 0
  minWidth = 0
  width = 0

  constructor(dataKey: string | number, raw: any, index: number) {
    this.dataKey = dataKey
    this.raw = raw
    this.index = index
  }

  getMaxCustomCellWidth() {
    let max = 0
    for (const row of state().table.allRows()) {
      const cell: Cell = row.cells[this.index]
      if (cell && typeof cell.styles.cellWidth === 'number') {
        max = Math.max(max, cell.styles.cellWidth)
      }
    }
    return max
  }
}
