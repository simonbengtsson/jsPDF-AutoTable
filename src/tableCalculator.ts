import { DocHandler, jsPDFDocument } from './documentHandler'
import { Cell, Column, Row, Section, StylesProps, Table } from './models'
import { calculateWidths } from './widthCalculator'
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

  const content = parseContent(input, doc.scaleFactor())
  const table = new Table(input, content)

  calculateWidths(doc, table)

  doc.applyStyles(doc.userStyles)

  return table
}

function parseContent(input: TableInput, sf: number) {
  const content = input.content
  const columns = createColumns(content.columns)

  // If no head or foot is set, try generating it with content from columns
  if (content.head.length === 0) {
    const sectionRow = generateSectionRow(columns, 'head')
    if (sectionRow) content.head.push(sectionRow)
  }
  if (content.foot.length === 0) {
    const sectionRow = generateSectionRow(columns, 'foot')
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
    const cells: { [key: string]: Cell } = {}

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
          cells[column.dataKey] = cell
          cells[column.index] = cell

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
    return new Row(rawRow, rowIndex, sectionName, cells)
  })
  return result
}

function generateSectionRow(
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
