import { getPageNetWidth } from './common'
import { DocHandler } from './documentHandler'
import { Column, Table } from './models'

interface ColumnFitInPageResult {
  colIndexes: number[]
  columns: Column[]
  lastIndex: number
}

// get columns can be fit into page
function getColumnsCanFitInPage(
  doc: DocHandler,
  table: Table,
  config: { start?: number } = {},
): ColumnFitInPageResult {
  // Get page width (allow for small tolerance to prevent unwanted page breaks)
  let remainingWidth = getPageNetWidth(doc, table) + 1e-10

  // Get column data key to repeat
  const repeatColumnsMap = new Map<number, boolean>()
  const colIndexes: number[] = []
  const columns: Column[] = []

  let horizontalPageBreakRepeat: (number | string)[] = []
  table.settings.horizontalPageBreakRepeat

  if (Array.isArray(table.settings.horizontalPageBreakRepeat)) {
    horizontalPageBreakRepeat = table.settings.horizontalPageBreakRepeat
    // It can be a single value of type string or number (even number: 0)
  } else if (
    typeof table.settings.horizontalPageBreakRepeat === 'string' ||
    typeof table.settings.horizontalPageBreakRepeat === 'number'
  ) {
    horizontalPageBreakRepeat = [table.settings.horizontalPageBreakRepeat]
  }

  // Code to repeat the given column in split pages
  horizontalPageBreakRepeat.forEach((field) => {
    const col = table.columns.find(
      (item) => item.dataKey === field || item.index === field,
    )

    if (col && !repeatColumnsMap.has(col.index)) {
      repeatColumnsMap.set(col.index, true)
      colIndexes.push(col.index)
      columns.push(table.columns[col.index])
      remainingWidth -= col.width
    }
  })

  let first = true
  let i = config?.start ?? 0
  while (i < table.columns.length) {
    // Prevent duplicates
    if (repeatColumnsMap.has(i)) {
      i++
      continue
    }

    const colWidth = table.columns[i].width

    // Take at least one column even if it doesn't fit to prevent infinite loops
    if (first || remainingWidth >= colWidth) {
      first = false
      colIndexes.push(i)
      columns.push(table.columns[i])
      remainingWidth -= colWidth
    } else {
      break
    }
    i++
  }

  return { colIndexes, columns, lastIndex: i - 1 }
}

export function calculateAllColumnsCanFitInPage(
  doc: DocHandler,
  table: Table,
): ColumnFitInPageResult[] {
  const allResults: ColumnFitInPageResult[] = []
  for (let i = 0; i < table.columns.length; i++) {
    const result = getColumnsCanFitInPage(doc, table, { start: i })
    if (result.columns.length) {
      allResults.push(result)
      i = result.lastIndex
    }
  }
  return allResults
}
