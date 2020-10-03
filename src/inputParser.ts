import { UserOptions, ColumnInput, RowInput, CellInput } from './config'
import { parseHtml } from './htmlParser'
import { assign } from './polyfills'
import { parseSpacing } from './common'
import { DocHandler, jsPDFDocument } from './documentHandler'
import validateOptions from './inputValidator'
import {
  StyleProp,
  StylesProps,
  CellHook,
  PageHook,
  Settings,
  HookProps,
} from './models'

interface ContentInput {
  body: RowInput[]
  head: RowInput[]
  foot: RowInput[]
  columns: ColumnInput[]
}

export interface TableInput {
  id: string | number | undefined
  settings: Settings
  styles: StylesProps
  hooks: HookProps
  content: ContentInput
}

export function parseInput(d: jsPDFDocument, current: UserOptions): TableInput {
  const doc = new DocHandler(d)

  const document = doc.getDocumentOptions()
  const global = doc.getGlobalOptions()
  validateOptions(doc, global, document, current)
  const options = assign({}, global, document, current)

  let win: Window | undefined
  if (typeof window !== 'undefined') {
    win = window
  }

  const styles = parseStyles(global, document, current)
  const hooks = parseHooks(global, document, current)
  const settings = parseSettings(doc, options)
  const content = parseContent(doc, options, win)

  return {
    id: current.tableId,
    content,
    hooks,
    styles,
    settings,
  }
}

function parseStyles(
  gInput: UserOptions,
  dInput: UserOptions,
  cInput: UserOptions
) {
  const styleOptions: StylesProps = {
    styles: {},
    headStyles: {},
    bodyStyles: {},
    footStyles: {},
    alternateRowStyles: {},
    columnStyles: {},
  }
  for (const prop of Object.keys(styleOptions) as StyleProp[]) {
    if (prop === 'columnStyles') {
      const global = gInput[prop]
      const document = dInput[prop]
      const current = cInput[prop]
      styleOptions.columnStyles = assign({}, global, document, current)
    } else {
      const allOptions = [gInput, dInput, cInput]
      const styles = allOptions.map((opts) => opts[prop] || {})
      styleOptions[prop] = assign({}, styles[0], styles[1], styles[2])
    }
  }
  return styleOptions
}

function parseHooks(
  global: UserOptions,
  document: UserOptions,
  current: UserOptions
) {
  const allOptions = [global, document, current]
  const result = {
    didParseCell: [] as CellHook[],
    willDrawCell: [] as CellHook[],
    didDrawCell: [] as CellHook[],
    didDrawPage: [] as PageHook[],
  }
  for (const options of allOptions) {
    if (options.didParseCell) result.didParseCell.push(options.didParseCell)
    if (options.willDrawCell) result.willDrawCell.push(options.willDrawCell)
    if (options.didDrawCell) result.didDrawCell.push(options.didDrawCell)
    if (options.didDrawPage) result.didDrawPage.push(options.didDrawPage)
  }

  return result
}

function parseSettings(doc: DocHandler, options: UserOptions): Settings {
  const margin = parseSpacing(options.margin, 40 / doc.scaleFactor())
  const startY = getStartY(doc, options.startY) ?? margin.top

  let showFoot: 'everyPage' | 'lastPage' | 'never'
  if (options.showFoot === true) {
    showFoot = 'everyPage'
  } else if (options.showFoot === false) {
    showFoot = 'never'
  } else {
    showFoot = options.showFoot ?? 'everyPage'
  }

  let showHead: 'everyPage' | 'firstPage' | 'never'
  if (options.showHead === true) {
    showHead = 'everyPage'
  } else if (options.showHead === false) {
    showHead = 'never'
  } else {
    showHead = options.showHead ?? 'everyPage'
  }

  const useCss = options.useCss ?? false
  const theme = options.theme || (useCss ? 'plain' : 'striped')

  const horizontalPageBreak: boolean = options.horizontalPageBreak ? true : false

  return {
    includeHiddenHtml: options.includeHiddenHtml ?? false,
    useCss,
    theme,
    startY,
    margin,
    pageBreak: options.pageBreak ?? 'auto',
    rowPageBreak: options.rowPageBreak ?? 'auto',
    tableWidth: options.tableWidth ?? 'auto',
    showHead,
    showFoot,
    tableLineWidth: options.tableLineWidth ?? 0,
    tableLineColor: options.tableLineColor ?? 200,
    horizontalPageBreak,
  }
}

function getStartY(doc: DocHandler, userStartY: number | false | undefined) {
  const previous = doc.getLastAutoTable()
  const sf = doc.scaleFactor()
  const currentPage = doc.pageNumber()

  let isSamePageAsPreviousTable = false
  if (previous && previous.startPageNumber) {
    const endingPage = previous.startPageNumber + previous.pageNumber - 1
    isSamePageAsPreviousTable = endingPage === currentPage
  }

  if (typeof userStartY === 'number') {
    return userStartY
  } else if (userStartY == null || userStartY === false) {
    if (isSamePageAsPreviousTable && previous?.finalY != null) {
      // Some users had issues with overlapping tables when they used multiple
      // tables without setting startY so setting it here to a sensible default.
      return previous.finalY + 20 / sf
    }
  }
  return null
}

function parseContent(doc: DocHandler, options: UserOptions, window?: Window) {
  let head = options.head || []
  let body = options.body || []
  let foot = options.foot || []

  if (options.html) {
    const hidden = options.includeHiddenHtml
    if (window) {
      const htmlContent =
        parseHtml(doc, options.html, window, hidden, options.useCss) || {}
      head = htmlContent.head || head
      body = htmlContent.body || head
      foot = htmlContent.foot || head
    } else {
      console.error('Cannot parse html in non browser environment')
    }
  }

  const columns = options.columns || parseColumns(head, body, foot)
  return {
    columns,
    head,
    body,
    foot,
  }
}

function parseColumns(head: RowInput[], body: RowInput[], foot: RowInput[]) {
  const firstRow: RowInput = head[0] || body[0] || foot[0] || []
  const result: ColumnInput[] = []
  Object.keys(firstRow)
    .filter((key) => key !== '_element')
    .forEach((key) => {
      let colSpan = 1
      let input: CellInput
      if (Array.isArray(firstRow)) {
        input = firstRow[parseInt(key)]
      } else {
        input = firstRow[key]
      }
      if (typeof input === 'object' && !Array.isArray(input)) {
        colSpan = input?.colSpan || 1
      }
      for (let i = 0; i < colSpan; i++) {
        let id
        if (Array.isArray(firstRow)) {
          id = result.length
        } else {
          id = key + (i > 0 ? `_${i}` : '')
        }
        const rowResult: ColumnInput = { dataKey: id }
        result.push(rowResult)
      }
    })
  return result
}
