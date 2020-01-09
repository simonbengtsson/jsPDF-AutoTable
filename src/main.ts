'use strict'

import { drawTable, addPage } from './tableDrawer'
import { calculateWidths } from './widthCalculator'
import { parseInput } from './inputParser'
import { setDefaults, setupState, resetState } from './state'
import './autoTableText'
import { applyUserStyles } from './common'
import { UserOptions } from './interfaces'
import { parseHtml } from './htmlParser'

const jsPDF = require('jspdf')

export type autoTable = (options: UserOptions) => void

function autoTable(options: UserOptions)
function autoTable(...args) {
  setupState(this)

  // 1. Parse and unify user input
  let table = parseInput(args)

  // 2. Calculate preliminary table, column, row and cell dimensions
  calculateWidths(table)

  // 3. Output table to pdf
  drawTable(table)

  table.finalY = table.cursor.y
  this.previousAutoTable = table
  this.lastAutoTable = table
  this.autoTable.previous = table // Deprecated

  applyUserStyles()
  resetState()
  return this
}
jsPDF.API.autoTable = autoTable

// Assign false to enable `doc.lastAutoTable.finalY || 40` sugar;
jsPDF.API.lastAutoTable = false
jsPDF.API.previousAutoTable = false // deprecated in v3
jsPDF.API.autoTable.previous = false // deprecated in v3

jsPDF.API.autoTableSetDefaults = function(defaults) {
  setDefaults(defaults, this)
  return this
}

jsPDF.autoTableSetDefaults = function(defaults, doc) {
  setDefaults(defaults, doc)
  return this
}

jsPDF.API.autoTableHtmlToJson = function(tableElem, includeHiddenElements) {
  includeHiddenElements = includeHiddenElements || false

  if (!tableElem || !(tableElem instanceof HTMLTableElement)) {
    console.error('A HTMLTableElement has to be sent to autoTableHtmlToJson')
    return null
  }

  let { head, body, foot } = parseHtml(tableElem, includeHiddenElements, false)
  let firstRow = head[0] || body[0] || foot[0]

  return { columns: firstRow, rows: body, data: body }
}

/**
 * @deprecated
 */
jsPDF.API.autoTableEndPosY = function() {
  console.error(
    'Use of deprecated function: autoTableEndPosY. Use doc.previousAutoTable.finalY instead.'
  )
  let prev = this.previousAutoTable
  if (prev.cursor && typeof prev.cursor.y === 'number') {
    return prev.cursor.y
  } else {
    return 0
  }
}

/**
 * @deprecated
 */
jsPDF.API.autoTableAddPageContent = function(hook) {
  console.error(
    'Use of deprecated function: autoTableAddPageContent. Use jsPDF.autoTableSetDefaults({didDrawPage: () => {}}) instead.'
  )
  if (!jsPDF.API.autoTable.globalDefaults) {
    jsPDF.API.autoTable.globalDefaults = {}
  }
  jsPDF.API.autoTable.globalDefaults.addPageContent = hook
  return this
}

/**
 * @deprecated
 */
jsPDF.API.autoTableAddPage = function() {
  console.error(
    'Use of deprecated function: autoTableAddPage. Use doc.addPage()'
  )
  this.addPage()
  return this
}
