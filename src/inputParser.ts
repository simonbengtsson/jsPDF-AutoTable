import {
  getTheme,
  defaultStyles,
  ThemeName,
  UserOptions,
  ColumnInput,
  RowInput,
  Styles,
  CellInput,
} from './config'
import { parseHtml } from './htmlParser'
import { assign } from './polyfills'
import { getStringWidth, marginOrPadding, MarginPadding } from './common'
import { DocHandler, jsPDFDocument } from './documentHandler'
import validateOptions from './inputValidator'
import {
  Row,
  Cell,
  Column,
  Table,
  Section,
  StyleProp,
  StylesProps,
  CellHook,
  PageHook,
  Settings,
} from './models'
import { calculateWidths } from './widthCalculator'

export function createTable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsPDFDoc: jsPDFDocument,
  current: UserOptions
) {
  const doc = new DocHandler(jsPDFDoc)
  const document = doc.getDocumentOptions()
  const global = doc.getGlobalOptions()

  validateOptions(global, document, current, doc)
  const options = assign({}, global, document, current)

  const previous = doc.getPreviousAutoTable()
  const sf = doc.scaleFactor()

  const margin = marginOrPadding(options.margin, 40 / sf)
  const startY = getStartY(previous, sf, doc.pageNumber(), options, margin.top)
  const settings = parseSettings(options, sf, startY, margin)
  const styles = parseStyles(global, document, current)

  let win: Window | undefined
  if (typeof window !== 'undefined') {
    win = window
  }
  const content = parseContent(doc, options, styles, settings.theme, sf, win)

  const table = new Table(
    current.tableId,
    settings,
    styles,
    parseHooks(global, document, current),
    content
  )

  calculate(table, sf, doc)

  table.minWidth = table.columns.reduce((total, col) => total + col.minWidth, 0)
  table.wrappedWidth = table.columns.reduce(
    (total, col) => total + col.wrappedWidth,
    0
  )

  if (typeof table.settings.tableWidth === 'number') {
    table.width = table.settings.tableWidth
  } else if (table.settings.tableWidth === 'wrap') {
    table.width = table.wrappedWidth
  } else {
    table.width = doc.pageSize().width - margin.left - margin.right
  }

  calculateWidths(doc, table)

  doc.applyStyles(doc.userStyles)

  return table
}

function calculate(table: Table, sf: number, doc: DocHandler) {
  table.allRows().forEach((row) => {
    for (const column of table.columns) {
      const cell = row.cells[column.index]
      if (!cell) continue
      table.callCellHooks(doc, table.hooks.didParseCell, cell, row, column)

      const padding = cell.padding('horizontal')
      cell.contentWidth = getStringWidth(cell.text, cell.styles, doc) + padding

      const longestWordWidth = getStringWidth(
        cell.text.join(' ').split(/\s+/),
        cell.styles,
        doc
      )
      cell.minReadableWidth = longestWordWidth + cell.padding('horizontal')

      if (typeof cell.styles.cellWidth === 'number') {
        cell.minWidth = cell.styles.cellWidth
        cell.wrappedWidth = cell.styles.cellWidth
      } else if (cell.styles.cellWidth === 'wrap') {
        cell.minWidth = cell.contentWidth
        cell.wrappedWidth = cell.contentWidth
      } else {
        // auto
        const defaultMinWidth = 10 / sf
        cell.minWidth = cell.styles.minCellWidth || defaultMinWidth
        cell.wrappedWidth = cell.contentWidth
        if (cell.minWidth > cell.wrappedWidth) {
          cell.wrappedWidth = cell.minWidth
        }
      }
    }
  })

  table.allRows().forEach((row) => {
    for (const column of table.columns) {
      const cell = row.cells[column.index]

      // For now we ignore the minWidth and wrappedWidth of colspan cells when calculating colspan widths.
      // Could probably be improved upon however.
      if (cell && cell.colSpan === 1) {
        column.wrappedWidth = Math.max(column.wrappedWidth, cell.wrappedWidth)
        column.minWidth = Math.max(column.minWidth, cell.minWidth)
        column.minReadableWidth = Math.max(
          column.minReadableWidth,
          cell.minReadableWidth
        )
      } else {
        // Respect cellWidth set in columnStyles even if there is no cells for this column
        // or if the column only have colspan cells. Since the width of colspan cells
        // does not affect the width of columns, setting columnStyles cellWidth enables the
        // user to at least do it manually.

        // Note that this is not perfect for now since for example row and table styles are
        // not accounted for
        const columnStyles =
          table.styles.columnStyles[column.dataKey] ||
          table.styles.columnStyles[column.index] ||
          {}
        const cellWidth = columnStyles.cellWidth
        if (cellWidth && typeof cellWidth === 'number') {
          column.minWidth = cellWidth
          column.wrappedWidth = cellWidth
        }
      }

      if (cell) {
        // Make sure all columns get at least min width even though width calculations are not based on them
        if (cell.colSpan > 1 && !column.minWidth) {
          column.minWidth = cell.minWidth
        }
        if (cell.colSpan > 1 && !column.wrappedWidth) {
          column.wrappedWidth = cell.minWidth
        }
      }
    }
  })
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

function parseSettings(
  options: UserOptions,
  sf: number,
  startY: number,
  margin: MarginPadding
): Settings {
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
  } else showHead = options.showHead ?? 'everyPage'

  const useCss = options.useCss ?? false
  const theme = options.theme || (useCss ? 'plain' : 'striped')

  const settings: Settings = {
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
  }
  return settings
}

function getStartY(
  previous: Table,
  sf: number,
  currentPage: number,
  options: UserOptions,
  marginTop: number
) {
  let isSamePageAsPreviousTable = false
  if (previous) {
    const endingPage = previous.startPageNumber + previous.pageNumber - 1
    isSamePageAsPreviousTable = endingPage === currentPage
  }

  let startY = options.startY
  if (startY == null || startY === false) {
    if (isSamePageAsPreviousTable) {
      // Some users had issues with overlapping tables when they used multiple
      // tables without setting startY so setting it here to a sensible default.
      startY = previous.finalY + 20 / sf
    }
  }
  return startY || marginTop
}

function parseContent(
  doc: DocHandler,
  options: UserOptions,
  styles: StylesProps,
  theme: ThemeName,
  sf: number,
  window?: Window
) {
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

  const columns = createColumns(options, head, body, foot)

  // If no head or foot is set, try generating it with content from columns
  if (head.length === 0 && options.columns) {
    const sectionRow = generateTitleRow(columns, 'head')
    if (sectionRow) head.push(sectionRow)
  }
  if (foot.length === 0 && options.columns) {
    const sectionRow = generateTitleRow(columns, 'foot')
    if (sectionRow) foot.push(sectionRow)
  }

  return {
    columns,
    head: parseSection('head', head, options, columns, styles, theme, sf),
    body: parseSection('body', body, options, columns, styles, theme, sf),
    foot: parseSection('foot', foot, options, columns, styles, theme, sf),
  }
}

function parseSection(
  sectionName: Section,
  sectionRows: RowInput[],
  settings: UserOptions,
  columns: Column[],
  styleProps: StylesProps,
  theme: ThemeName,
  scaleFactor: number
): Row[] {
  const rowSpansLeftForColumn: {
    [key: string]: { left: number; times: number }
  } = {}
  return sectionRows.map((rawRow, rowIndex) => {
    let skippedRowForRowSpans = 0
    const row = new Row(rawRow, rowIndex, sectionName)

    let colSpansAdded = 0
    let columnSpansLeft = 0
    for (const column of columns) {
      if (
        rowSpansLeftForColumn[column.index] == null ||
        rowSpansLeftForColumn[column.index].left === 0
      ) {
        if (columnSpansLeft === 0) {
          let rawCell
          if (Array.isArray(rawRow)) {
            rawCell =
              rawRow[column.index - colSpansAdded - skippedRowForRowSpans]
          } else {
            rawCell = rawRow[column.dataKey]
          }

          let cellInputStyles = {}
          if (typeof rawCell === 'object' && !Array.isArray(rawCell)) {
            cellInputStyles = rawCell?.styles || {}
          }
          const styles = cellStyles(
            sectionName,
            column,
            rowIndex,
            theme,
            styleProps,
            scaleFactor,
            cellInputStyles
          )
          const cell = new Cell(rawCell, styles, sectionName)
          // dataKey is not used internally no more but keep for
          // backwards compat in hooks
          row.cells[column.dataKey] = cell
          row.cells[column.index] = cell

          columnSpansLeft = cell.colSpan - 1
          rowSpansLeftForColumn[column.index] = {
            left: cell.rowSpan - 1,
            times: columnSpansLeft,
          }
        } else {
          columnSpansLeft--
          colSpansAdded++
        }
      } else {
        rowSpansLeftForColumn[column.index].left--
        columnSpansLeft = rowSpansLeftForColumn[column.index].times
        skippedRowForRowSpans++
      }
    }
    return row
  })
}

function generateTitleRow(
  columns: Column[],
  section: Section
): RowInput | null {
  const sectionRow: { [key: string]: CellInput } = {}
  columns.forEach((col) => {
    if (col.raw != null) {
      const title = getSectionTitle(section, col.raw)
      if (title != null) sectionRow[col.dataKey] = title
    }
  })
  return Object.keys(sectionRow).length > 0 ? sectionRow : null
}

function getSectionTitle(section: Section, column: ColumnInput) {
  if (section === 'head') {
    if (typeof column === 'object') {
      return column.header || column.title || null
    } else if (typeof column === 'string' || typeof column === 'number') {
      return column
    }
  } else if (section === 'foot' && typeof column === 'object') {
    return column.footer
  }
  return null
}

function createColumns(
  settings: UserOptions,
  head: RowInput[],
  body: RowInput[],
  foot: RowInput[]
) {
  if (settings.columns) {
    return settings.columns.map((input, index) => {
      let key
      if (typeof input === 'object') {
        key = input.dataKey ?? input.key ?? index
      } else {
        key = index
      }
      return new Column(key, input, index)
    })
  } else {
    const firstRow: RowInput = head[0] || body[0] || foot[0] || []
    const columns: Column[] = []
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
            id = columns.length
          } else {
            id = key + (i > 0 ? `_${i}` : '')
          }
          columns.push(new Column(id, null, columns.length))
        }
      })
    return columns
  }
}

function cellStyles(
  sectionName: Section,
  column: Column,
  rowIndex: number,
  themeName: ThemeName,
  styles: StylesProps,
  scaleFactor: number,
  cellInputStyles: Partial<Styles>
) {
  const theme = getTheme(themeName)
  let sectionStyles
  if (sectionName === 'head') {
    sectionStyles = styles.headStyles
  } else if (sectionName === 'body') {
    sectionStyles = styles.bodyStyles
  } else if (sectionName === 'foot') {
    sectionStyles = styles.footStyles
  }
  const otherStyles = assign(
    {},
    theme.table,
    theme[sectionName],
    styles.styles,
    sectionStyles
  )
  const columnStyles =
    styles.columnStyles[column.dataKey] ||
    styles.columnStyles[column.index] ||
    {}
  const colStyles = sectionName === 'body' ? columnStyles : {}
  const rowStyles =
    sectionName === 'body' && rowIndex % 2 === 0
      ? assign({}, theme.alternateRow, styles.alternateRowStyles)
      : {}
  const defaultStyle = defaultStyles(scaleFactor)
  const themeStyles = assign(
    {},
    defaultStyle,
    otherStyles,
    rowStyles,
    colStyles
  )
  return assign(themeStyles, cellInputStyles)
}
