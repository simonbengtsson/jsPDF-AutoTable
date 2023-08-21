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
  // Get page width
  const availablePageWidth = getPageAvailableWidth(doc, table)
  let remainingWidth = availablePageWidth

  // Get column data key to repeat
  const repeatColumnsMap = new Map<number, Column>();
  let repeatColumn = null
  const cols: number[] = []
  const columns: Column[] = []

  const len = table.columns.length
  let i = config?.start ?? 0;

  const horizontalPageBreakRepeat = table.settings.horizontalPageBreakRepeat
  // Code to repeat the given column in split pages
  if (horizontalPageBreakRepeat !== null && horizontalPageBreakRepeat !== undefined && Array.isArray(horizontalPageBreakRepeat)) {
    for (const field of horizontalPageBreakRepeat) {
      const col = table.columns.find(
        (item) =>
          item.dataKey === field ||
          item.index === field
      )
      if (col) {
        repeatColumnsMap.set(col.index, col);
        cols.push(col.index)
        columns.push(table.columns[col.index])
        remainingWidth = remainingWidth - col.wrappedWidth
      }
    }
    // It can be a single value of type string or number (even number: 0)
  } else if (horizontalPageBreakRepeat !== null && horizontalPageBreakRepeat !== undefined) {
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
    // Prevent columnDataKeyToRepeat from being pushed twice on a page
    if ((Array.isArray(horizontalPageBreakRepeat) && repeatColumnsMap.get(i))
      || repeatColumn?.index === i) {
      i++;
      continue;
    }

    const colWidth = table.columns[i].wrappedWidth;
    if (remainingWidth < colWidth) {
      if (i === 0 || i === config.start) {
        cols.push(i);
        columns.push(table.columns[i]);
      }
      break;
    }

    cols.push(i);
    columns.push(table.columns[i]);
    remainingWidth -= colWidth;
    i++;
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
