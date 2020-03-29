import { entries } from './common'
import state from './state'

export function resizeSentencesColumns(columns, resizeWidth) {
  const wrappedSum = columns.reduce((acc, column) => {
    return column.wrappedWidth + acc
  }, 0)
  const originalResizeWidth = resizeWidth
  for (const [i, column] of entries(columns)) {
    let ratio = column.wrappedWidth / wrappedSum
    let suggestedChange = originalResizeWidth * ratio
    let suggestedWidth = column.wrappedWidth + suggestedChange

    if (suggestedWidth < column.longestWordWidth) {
      column.width = column.longestWordWidth + 1 / state().scaleFactor()
      columns.splice(i, 1)
      return resizeSentencesColumns(columns, originalResizeWidth)
    }
    column.width = suggestedWidth
    resizeWidth -= suggestedChange
  }
  return Math.round(resizeWidth * 10e10) / 10e10
}

export function resizeColumns(columns, resizeWidth) {
  const wrappedSum = columns.reduce((acc, column) => {
    return (column.width || column.wrappedWidth) + acc
  }, 0)

  const originalResizeWidth = resizeWidth
  for (const [i, column] of entries(columns)) {
    const columnWidth = column.width || column.wrappedWidth
    let ratio = columnWidth / wrappedSum
    let suggestedChange = originalResizeWidth * ratio
    let suggestedWidth = columnWidth + suggestedChange

    if (suggestedWidth < column.minWidth) {
      // Add 1 to minWidth as linebreaks calc otherwise sometimes made two rows
      column.width = column.minWidth + 1 / state().scaleFactor()
      columns.splice(i, 1)
      return resizeColumns(columns, originalResizeWidth)
    }

    column.width = suggestedWidth
    resizeWidth -= suggestedChange
  }
  return resizeWidth
}