import { parseSpacing } from './common'
import { DocHandler } from './documentHandler'
import { Column, Table } from './models'

export interface ColumnFitInPageResult {
  colIndexes: number[]
  columns: Column[],
  lastIndex: number
}

const getPageAvailableWidth = (doc: DocHandler, table: Table) => {
  const margins = parseSpacing(table.settings.margin, 0)
  const availablePageWidth =
    doc.pageSize().width - (margins.left + margins.right)
  return availablePageWidth
}

// get columns can be fit into page
const getColumnsCanFitInPage = (
  doc: DocHandler,
  table: Table,
  config: any = {}
): ColumnFitInPageResult => {
  // get page width
  const availablePageWidth = getPageAvailableWidth(doc, table)
  let remainingWidth = availablePageWidth
  // get column data key to repeat
  const horizontalPageBreakRepeat = table.settings.horizontalPageBreakRepeat
  let repeatColumn = null
  const cols: number[] = []
  const columns: Column[] = []
  const len = table.columns.length
  let i = config && config.start ? config.start : 0
  // code to repeat the given column in split pages
  if (horizontalPageBreakRepeat != null) {
    repeatColumn = table.columns.find(
      (item) =>
        item.dataKey === horizontalPageBreakRepeat ||
        item.index === horizontalPageBreakRepeat
    )
    if (repeatColumn) {
      cols.push(repeatColumn.index)
      columns.push(table.columns[repeatColumn.index])
      remainingWidth = remainingWidth - repeatColumn.wrappedWidth
    }
  }
  while (i < len) {
    if (repeatColumn?.index === i) {
      i++ // prevent columnDataKeyToRepeat to be pushed twice in a page
      continue
    }
    const colWidth = table.columns[i].wrappedWidth
    if (remainingWidth < colWidth) {
      // check if it's first column in the sequence then add it into result
      if (i === 0 || i === config.start) {
        // this cell width is more than page width set it available pagewidth
        /* table.columns[i].wrappedWidth = availablePageWidth
        table.columns[i].minWidth = availablePageWidth */
        cols.push(i)
        columns.push(table.columns[i])
      }
      // can't print more columns in same page
      break
    }
    cols.push(i)
    columns.push(table.columns[i])
    remainingWidth = remainingWidth - colWidth
    i++
  }
  return { colIndexes: cols, columns, lastIndex: i }
}

const calculateAllColumnsCanFitInPage = (
  doc: DocHandler,
  table: Table
): ColumnFitInPageResult[] => {
  // const margins = table.settings.margin;
  // const availablePageWidth = doc.pageSize().width - (margins.left + margins.right);

  const allResults: ColumnFitInPageResult[] = []
  let index = 0
  const len = table.columns.length
  while (index < len) {
    const result = getColumnsCanFitInPage(doc, table, {
      start: index === 0 ? 0 : index,
    })
    if (result && result.columns && result.columns.length) {
      index = result.lastIndex
      allResults.push(result)
    } else {
      index++
    }
  }
  return allResults
}

export default {
  getColumnsCanFitInPage,
  calculateAllColumnsCanFitInPage,
  getPageAvailableWidth,
}
