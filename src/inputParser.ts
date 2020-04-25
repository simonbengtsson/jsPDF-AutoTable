import { getTheme, defaultStyles } from './config'
import { parseHtml } from './htmlParser'
import { assign } from './polyfills'
import { getStringWidth, marginOrPadding } from './common'
import state, { getGlobalOptions, getDocumentOptions } from './state'
import validateInput from './inputValidator'
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

export function parseInput(args: any) {
  let tableOptions = parseUserArguments(args)
  let globalOptions = getGlobalOptions()
  let documentOptions = getDocumentOptions()
  let allOptions = [globalOptions, documentOptions, tableOptions]
  validateInput(allOptions)
  let options: UserInput = assign({}, ...allOptions)

  const settings = parseSettings(options)
  const styles = parseStyles(allOptions)
  let table = new Table(
    tableOptions.tableId,
    settings,
    styles,
    getUserStyles(),
    parseHooks(allOptions),
    parseContent(options, styles, settings.theme),
  )
  state().table = table

  calculate(table)

  table.minWidth = table.columns.reduce((total, col) => total + col.minWidth, 0)
  table.wrappedWidth = table.columns.reduce(
    (total, col) => total + col.wrappedWidth,
    0
  )

  let margin = table.settings.margin
  if (typeof table.settings.tableWidth === 'number') {
    table.width = table.settings.tableWidth
  } else if (table.settings.tableWidth === 'wrap') {
    table.width = table.wrappedWidth
  } else {
    table.width = state().pageWidth() - margin.left - margin.right
  }

  return table
}

function calculate(table: Table) {
  table.allRows().forEach((row) => {
    for (let column of table.columns) {
      const cell = row.cells[column.index]
      if (!cell) continue
      table.callCellHooks(table.hooks.didParseCell, cell, row, column)
      cell.text = Array.isArray(cell.text) ? cell.text : [cell.text]

      cell.contentWidth =
        getStringWidth(cell.text, cell.styles) + cell.padding('horizontal')

      const longestWordWidth = getStringWidth(
        cell.text.join(' ').split(/\s+/),
        cell.styles
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
        const defaultMinWidth = 10 / state().scaleFactor()
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

function getUserStyles(): Partial<Styles> {
  let doc = state().doc
  return {
    // Setting to black for versions of jspdf without getTextColor
    textColor: doc.getTextColor ? doc.getTextColor() : 0,
    fontSize: doc.internal.getFontSize(),
    fontStyle: doc.internal.getFont().fontStyle,
    font: doc.internal.getFont().fontName,
  }
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

function parseSettings(options: UserInput): Settings {
  const defaultMargin = 40 / state().scaleFactor()
  const margin = marginOrPadding(options.margin, defaultMargin)
  const startY = getStartY(state().doc, options, margin.top)

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

function getStartY(doc: any, options: UserInput, marginTop: number) {
  let startY = options.startY
  if (startY == null || startY === false) {
    const previous = doc.previousAutoTable
    if (isSamePageAsPreviousTable(previous)) {
      // Many users had issues with overlapping tables when they used multiple
      // tables without setting startY so setting it here to a sensible default.
      startY = previous.finalY + 20 / state().scaleFactor()
    }
  }
  return startY || marginTop
}

function isSamePageAsPreviousTable(previous: Table | null) {
  if (previous == null) return false
  let endingPage = previous.startPageNumber + previous.pageNumber - 1
  return endingPage === state().pageNumber()
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

function parseContent(options: UserInput, styles: StylesProps, theme: 'plain'|'striped'|'grid') {
  let head = options.head || []
  let body = options.body || []
  let foot = options.foot || []
  if (options.html) {
    const hidden = options.includeHiddenHtml
    const htmlContent = parseHtml(options.html, hidden, options.useCss) || {}
    head = htmlContent.head || head
    body = htmlContent.body || head
    foot = htmlContent.foot || head
  }

  const columns = createColumns(options, head, body, foot)
  return  {
    columns,
    head: parseSection('head', head, options, columns, styles, theme),
    body: parseSection('body', body, options, columns, styles, theme),
    foot: parseSection('foot', foot, options, columns, styles, theme)
  }
}

function parseSection(
  sectionName: Section,
  sectionRows: RowInput[],
  settings: UserInput,
  columns: Column[],
  styleProps: StylesProps,
  theme: 'striped'|'plain'|'grid'
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
  return sectionRows.map((rawRow: any, rowIndex: number) => {
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

          let styles = cellStyles(sectionName, column, rowIndex, theme, styleProps)
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
  let sectionRow: { [key: string]: CellType } = {}
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
    return settings.columns.map((input: any, index: number) => {
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

function cellStyles(sectionName: Section, column: Column, rowIndex: number, themeName: 'striped'|'plain'|'grid', styles: StylesProps) {
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
  return assign(defaultStyles(), ...[...otherStyles, rowStyles, colStyles])
}
