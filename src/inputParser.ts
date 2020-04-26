import { getTheme, defaultStyles, ThemeName } from './config'
import { parseHtml } from './htmlParser'
import { assign } from './polyfills'
import { getStringWidth, marginOrPadding, MarginPadding } from './common'
import { DocHandler } from './documentHandler'
import validateOptions from './inputValidator'
import {
  CellDefinition,
  CellType,
  ColumnOption,
  RowInput,
  Settings, Styles,
  UserInput
} from './interfaces'
import {
  Row,
  Cell,
  Column,
  Table,
  Section,
  StyleProp,
  StylesProps,
  HookProp,
  CellHook,
  PageHook,
} from './models'

export function parseInput(args: any, doc: DocHandler) {
  let currentInput = parseUserArguments(args)
  let globalOptions = doc.getGlobalOptions()
  let documentOptions = doc.getDocumentOptions()
  let allOptions = [globalOptions, documentOptions, currentInput]

  validateOptions(allOptions, doc)
  let options: UserInput = assign({}, ...allOptions)

  let previous = doc.getPreviousAutoTable()
  const sf = doc.scaleFactor()

  const margin = marginOrPadding(options.margin, 40 / sf)
  const startY = getStartY(previous, sf, doc.pageNumber(), options, margin.top)
  const settings = parseSettings(options, sf, startY, margin)
  const styles = parseStyles(allOptions)

  let table = new Table(
    currentInput.tableId,
    settings,
    styles,
    parseHooks(allOptions),
    parseContent(doc, options, styles, settings.theme, sf),
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

      let padding = cell.padding('horizontal', doc)
      cell.contentWidth =
        getStringWidth(cell.text, cell.styles, doc) + padding

      const longestWordWidth = getStringWidth(
        cell.text.join(' ').split(/\s+/),
        cell.styles,
        doc
      )
      cell.minReadableWidth = longestWordWidth + cell.padding('horizontal', doc)

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

function parseStyles(allOptions: UserInput[]) {
  let styleOptions: StylesProps = {
    styles: {},
    headStyles: {},
    bodyStyles: {},
    footStyles: {},
    alternateRowStyles: {},
    columnStyles: {},
  }
  for (let prop of Object.keys(styleOptions) as StyleProp[]) {
    let styles = allOptions.map((opts) => opts[prop] || {})
    styleOptions[prop] = assign({}, ...styles)
  }
  return styleOptions
}

function parseHooks(allOptions: UserInput[]) {
  let getHooks = (hookName: HookProp) =>
    allOptions.map((opts) => opts[hookName]).filter((hook) => !!hook)
  return {
    didParseCell: getHooks('didParseCell') as CellHook[],
    willDrawCell: getHooks('willDrawCell') as CellHook[],
    didDrawCell: getHooks('didDrawCell') as CellHook[],
    didDrawPage: getHooks('didDrawPage') as PageHook[],
  }
}

function parseSettings(options: UserInput, sf: number, startY: number, margin: MarginPadding): Settings {
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
  } else (
    showHead = options.showHead ?? 'everyPage'
  )

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

function getStartY(previous: Table, sf: number, currentPage: number, options: UserInput, marginTop: number) {
  let isSamePageAsPreviousTable = false
  if (previous) {
    let endingPage = previous.startPageNumber + previous.pageNumber - 1
    isSamePageAsPreviousTable = endingPage === currentPage
  }

  let startY = options.startY
  if (startY == null || startY === false) {
    if (isSamePageAsPreviousTable) {
      // Many users had issues with overlapping tables when they used multiple
      // tables without setting startY so setting it here to a sensible default.
      startY = previous.finalY + 20 / sf
    }
  }
  return startY || marginTop
}

function parseUserArguments(args: any): UserInput {
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

function parseContent(doc: DocHandler, options: UserInput, styles: StylesProps, theme: ThemeName, sf: number) {
  let head = options.head || []
  let body = options.body || []
  let foot = options.foot || []
  if (options.html) {
    const hidden = options.includeHiddenHtml
    const htmlContent = parseHtml(doc, options.html, hidden, options.useCss) || {}
    head = htmlContent.head || head
    body = htmlContent.body || head
    foot = htmlContent.foot || head
  }

  const columns = createColumns(options, head, body, foot)
  return  {
    columns,
    head: parseSection('head', head, options, columns, styles, theme, sf),
    body: parseSection('body', body, options, columns, styles, theme, sf),
    foot: parseSection('foot', foot, options, columns, styles, theme, sf)
  }
}

function parseSection(
  sectionName: Section,
  sectionRows: RowInput[],
  settings: UserInput,
  columns: Column[],
  styleProps: StylesProps,
  theme: ThemeName,
  scaleFactor: number,
): Row[] {
  let rowSpansLeftForColumn: {
    [key: string]: { left: number; times: number }
  } = {}
  if (sectionRows.length === 0 && settings.columns && sectionName !== 'body') {
    // If no head or foot is set, try generating one with content in columns
    let sectionRow = generateSectionRowFromColumnData(
      columns,
      sectionName
    )
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

          let cellInputStyles = (rawCell && rawCell.styles) || {}
          let styles = cellStyles(sectionName, column, rowIndex, theme, styleProps, scaleFactor, cellInputStyles)
          let cell = new Cell(rawCell, styles, sectionName)
          // dataKey is not used internally anymore but keep for backwards compat in hooks
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
  let sectionRow: RowInput = {}
  columns.forEach((col) => {
    let columnData = col.raw
    if (sectionName === 'head') {
      let val = columnData && columnData.header ? columnData.header : columnData
      if (val) {
        sectionRow[col.dataKey] = val
      }
    } else if (sectionName === 'foot' && columnData.footer) {
      sectionRow[col.dataKey] = columnData.footer
    }
  })

  return Object.keys(sectionRow).length > 0 ? sectionRow : null
}

function createColumns(
  settings: UserInput,
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
    let firstRow = head[0] || body[0] || foot[0] || []
    let columns: Column[] = []
    Object.keys(firstRow)
      .filter((key) => key !== '_element')
      .forEach((key) => {
        let colSpan = 1
        if (typeof firstRow[key] === 'object') {
          let def = firstRow[key] as CellDefinition
          colSpan = def.colSpan || 1
        }
        for (let i = 0; i < colSpan; i++) {
          let id
          if (Array.isArray(firstRow)) {
            id = columns.length
          } else {
            id = key + (i > 0 ? `_${i}` : '')
          }
          columns.push(new Column(id, id, columns.length))
        }
      })
    return columns
  }
}

function cellStyles(sectionName: Section, column: Column, rowIndex: number, themeName: ThemeName, styles: StylesProps, scaleFactor: number, cellInputStyles: Partial<Styles>) {
  let theme = getTheme(themeName)
  let sectionStyles
  if (sectionName === 'head') {
    sectionStyles = styles.headStyles
  } else if (sectionName === 'body') {
    sectionStyles = styles.bodyStyles
  } else if (sectionName === 'foot') {
    sectionStyles = styles.footStyles
  }
  let otherStyles = [
    theme.table,
    theme[sectionName],
    styles.styles,
    sectionStyles,
  ]
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
  let themeStyles = assign({}, defaultStyle, ...otherStyles, rowStyles, colStyles)
  return assign(themeStyles, cellInputStyles)
}
