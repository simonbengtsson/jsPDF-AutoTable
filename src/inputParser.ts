import { UserOptions, ColumnInput, RowInput, CellInput } from './config'
import { parseHtml } from './htmlParser'
import { parseSpacing } from './common'
import { DocHandler, jsPDFDocument } from './documentHandler'
import { validateOptions } from './inputValidator'
import { StylesProps, HookProps, Settings } from './models'

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

export function parseInput(
  jsPDFDoc: jsPDFDocument,
  options: UserOptions,
): TableInput {
  const doc = new DocHandler(jsPDFDoc)

  validateOptions(options)

  let win: Window | undefined
  if (typeof window !== 'undefined') {
    win = window
  }

  const styles = parseStyles(options)
  const hooks = parseHooks(options)
  const settings = parseSettings(doc, options)
  const content = parseContent(doc, options, win)

  return {
    id: options.tableId,
    content,
    hooks,
    styles,
    settings,
  }
}

function parseStyles(options: UserOptions) {
  const styleOptions: StylesProps = {
    styles: {},
    headStyles: {},
    bodyStyles: {},
    footStyles: {},
    alternateRowStyles: {},
    columnStyles: {},
  }
  type Prop = keyof typeof styleOptions
  for (const prop of Object.keys(styleOptions) as Prop[]) {
    styleOptions[prop] = options[prop] ?? {}
  }
  return styleOptions
}

function parseHooks(options: UserOptions): HookProps {
  return {
    didParseCell: options.didParseCell,
    willDrawCell: options.willDrawCell,
    didDrawCell: options.didDrawCell,
    willDrawPage: options.willDrawPage,
    didDrawPage: options.didDrawPage,
  }
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

  const horizontalPageBreak: boolean = !!options.horizontalPageBreak
  const horizontalPageBreakRepeat = options.horizontalPageBreakRepeat ?? null

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
    horizontalPageBreakRepeat,
    horizontalPageBreakBehaviour:
      options.horizontalPageBreakBehaviour ?? 'afterAllRows',
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
