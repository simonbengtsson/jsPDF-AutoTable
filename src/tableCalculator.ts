import { DocHandler, jsPDFDocument } from './documentHandler'
import { Cell, Column, Row, Section, StylesProps, Table } from './models'
import { calculateWidths } from './widthCalculator'
import { getStringWidth } from './common'
import {
  CellInput,
  ColumnInput,
  defaultStyles,
  getTheme,
  RowInput,
  Styles,
  ThemeName,
} from './config'
import { assign } from './polyfills'
import { TableInput } from './inputParser'

export function createTable(jsPDFDoc: jsPDFDocument, input: TableInput) {
  const doc = new DocHandler(jsPDFDoc)

  const sf = doc.scaleFactor()
  const content = parseContent(input, sf)
  const table = new Table(input, content)

  calculate(table, sf, doc)

  table.minWidth = table.columns.reduce((total, col) => total + col.minWidth, 0)
  table.wrappedWidth = table.columns.reduce(
    (total, col) => total + col.wrappedWidth,
    0
  )

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

function parseContent(input: TableInput, sf: number) {
  const content = input.content
  const columns = createColumns(content.columns)

  // If no head or foot is set, try generating it with content from columns
  if (content.head.length === 0) {
    const sectionRow = generateTitleRow(columns, 'head')
    if (sectionRow) content.head.push(sectionRow)
  }
  if (content.foot.length === 0) {
    const sectionRow = generateTitleRow(columns, 'foot')
    if (sectionRow) content.foot.push(sectionRow)
  }

  const theme = input.settings.theme
  const styles = input.styles
  return {
    columns,
    head: parseSection('head', content.head, columns, styles, theme, sf),
    body: parseSection('body', content.body, columns, styles, theme, sf),
    foot: parseSection('foot', content.foot, columns, styles, theme, sf),
  }
}

function parseSection(
  sectionName: Section,
  sectionRows: RowInput[],
  columns: Column[],
  styleProps: StylesProps,
  theme: ThemeName,
  scaleFactor: number
): Row[] {
  const rowSpansLeftForColumn: {
    [key: string]: { left: number; times: number }
  } = {}
  const result = sectionRows.map((rawRow, rowIndex) => {
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
  return result
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

function createColumns(columns: ColumnInput[]) {
  return columns.map((input, index) => {
    let key
    if (typeof input === 'object') {
      key = input.dataKey ?? input.key ?? index
    } else {
      key = index
    }
    return new Column(key, input, index)
  })
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
