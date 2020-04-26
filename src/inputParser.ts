import {
  getTheme,
  defaultStyles,
  ThemeName,
  UserOptions,
  ColumnOption,
  RowInput,
  Styles,
  CellInput,
} from './config'
import { parseHtml } from './htmlParser'
import { assign } from './polyfills'
import { getStringWidth, marginOrPadding, MarginPadding } from './common'
import { DocHandler } from './documentHandler'
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

export function parseInput(
  userInput: IArguments,
  doc: DocHandler,
  window?: Window
) {
  let current = parseUserInput(userInput)
  let document = doc.getDocumentOptions()
  let global = doc.getGlobalOptions()

  validateOptions(global, document, current, doc)
  let options = assign({}, global, document, current)

  let previous = doc.getPreviousAutoTable()
  const sf = doc.scaleFactor()

  const margin = marginOrPadding(options.margin, 40 / sf)
  const startY = getStartY(previous, sf, doc.pageNumber(), options, margin.top)
  const settings = parseSettings(options, sf, startY, margin)
  const styles = parseStyles(global, document, current)
  const content = parseContent(doc, options, styles, settings.theme, sf, window)

  let table = new Table(
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

  return table
}

function calculate(table: Table, sf: number, doc: DocHandler) {
  table.allRows().forEach((row) => {
    for (let column of table.columns) {
      const cell = row.cells[column.index]
      if (!cell) continue
      table.callCellHooks(doc, table.hooks.didParseCell, cell, row, column)

      let padding = cell.padding('horizontal')
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
    for (let column of table.columns) {
      let cell = row.cells[column.index]

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
        let columnStyles =
          table.styles.columnStyles[column.dataKey] ||
          table.styles.columnStyles[column.index] ||
          {}
        let cellWidth = columnStyles.cellWidth
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
  let styleOptions: StylesProps = {
    styles: {},
    headStyles: {},
    bodyStyles: {},
    footStyles: {},
    alternateRowStyles: {},
    columnStyles: {},
  }
  for (let prop of Object.keys(styleOptions) as StyleProp[]) {
    if (prop === 'columnStyles') {
      let global = dInput.columnStyles
      let document = dInput.columnStyles
      let current = dInput.columnStyles
      styleOptions.columnStyles = assign({}, global, document, current)
    } else {
      let allOptions = [gInput, dInput, cInput]
      let styles = allOptions.map((opts) => opts[prop] || {})
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
  let allOptions = [global, document, current]
  const result = {
    didParseCell: [] as CellHook[],
    willDrawCell: [] as CellHook[],
    didDrawCell: [] as CellHook[],
    didDrawPage: [] as PageHook[],
  }
  for (const options of allOptions) {
    if (options.didDrawCell) result.didDrawCell.push(options.didDrawCell)
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
    let endingPage = previous.startPageNumber + previous.pageNumber - 1
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

function parseUserInput(args: IArguments): UserOptions {
  // Normal initialization on format doc.autoTable(options)
  if (args.length === 1) {
    return args[0]
  } else {
    // Deprecated initialization on format doc.autoTable(columns, body, [options])
    let opts = args[2] || {}

    opts.body = args[1]
    opts.columns = args[0]

    opts.columns.forEach((col: ColumnOption) => {
      // Support v2 title prop in v3
      if (typeof col === 'object' && col.header == null) {
        col.header = col.title
      }
    })

    return opts
  }
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
  let rowSpansLeftForColumn: {
    [key: string]: { left: number; times: number }
  } = {}
  if (sectionRows.length === 0 && settings.columns && sectionName !== 'body') {
    // If no head or foot is set, try generating one with content in columns
    let sectionRow = generateSectionRowFromColumnData(columns, sectionName)
    if (sectionRow) {
      sectionRows.push(sectionRow)
    }
  }
  return sectionRows.map((rawRow, rowIndex) => {
    let skippedRowForRowSpans = 0
    let row = new Row(rawRow, rowIndex, sectionName)

    let colSpansAdded = 0
    let columnSpansLeft = 0
    for (let column of columns) {
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
          let styles = cellStyles(
            sectionName,
            column,
            rowIndex,
            theme,
            styleProps,
            scaleFactor,
            cellInputStyles
          )
          let cell = new Cell(rawCell, styles, sectionName)
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

function generateSectionRowFromColumnData(
  columns: Column[],
  sectionName: Section
): RowInput | null {
  let sectionRow: { [key: string]: CellInput } = {}
  columns.forEach((col) => {
    let columnData = col.raw
    if (sectionName === 'head' && columnData?.header) {
      sectionRow[col.dataKey] = columnData.header
    } else if (sectionName === 'foot' && columnData?.footer) {
      sectionRow[col.dataKey] = columnData.footer
    }
  })

  return Object.keys(sectionRow).length > 0 ? sectionRow : null
}

function createColumns(
  settings: UserOptions,
  head: RowInput[],
  body: RowInput[],
  foot: RowInput[]
) {
  if (settings.columns) {
    return settings.columns.map((input, index) => {
      const key = input.dataKey || input.key || index
      return new Column(key, input, index)
    })
  } else {
    let firstRow: RowInput = head[0] || body[0] || foot[0] || []
    let columns: Column[] = []
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
  let theme = getTheme(themeName)
  let sectionStyles
  if (sectionName === 'head') {
    sectionStyles = styles.headStyles
  } else if (sectionName === 'body') {
    sectionStyles = styles.bodyStyles
  } else if (sectionName === 'foot') {
    sectionStyles = styles.footStyles
  }
  let otherStyles = assign(
    {},
    theme.table,
    theme[sectionName],
    styles.styles,
    sectionStyles
  )
  let columnStyles =
    styles.columnStyles[column.dataKey] ||
    styles.columnStyles[column.index] ||
    {}
  let colStyles = sectionName === 'body' ? columnStyles : {}
  let rowStyles =
    sectionName === 'body' && rowIndex % 2 === 0
      ? assign({}, theme.alternateRow, styles.alternateRowStyles)
      : {}
  const defaultStyle = defaultStyles(scaleFactor)
  let themeStyles = assign({}, defaultStyle, otherStyles, rowStyles, colStyles)
  return assign(themeStyles, cellInputStyles)
}
