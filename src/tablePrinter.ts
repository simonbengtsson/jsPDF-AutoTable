import { DocHandler } from './documentHandler'
import { Column, Table } from './models'

export interface ColumnFitInPageResult {
  colIndexes: number[]
  columns: Column[]
}

// get columns can be fit into page
const getColumnsCanFitInPage = (
  doc: DocHandler,
  table: Table,
  config: any = {}
): ColumnFitInPageResult => {
  // get page width
  const margins = table.settings.margin
  const availablePageWidth =
    doc.pageSize().width - (margins.left + margins.right)
  let remainingWidth = availablePageWidth
  const cols: number[] = []
  const columns: Column[] = []
  const len = table.columns.length
  let i = config && config.start ? config.start : 0
  while (i < len) {
    const colWidth = table.columns[i].wrappedWidth
    if (remainingWidth < colWidth) {
      // check if it's first column in the sequence then add it into result
      if (i === 0 || i === config.start) {
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
  return { colIndexes: cols, columns }
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
      index += result.columns.length
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
}
