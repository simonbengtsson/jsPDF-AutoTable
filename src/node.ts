'use strict'

import { drawTable } from './tableDrawer'
import { calculateWidths } from './widthCalculator'
import { parseInput } from './inputParser'
import { setDefaults, setupState, resetState } from './state'
import { autoTableText } from './autoTableText'
import { applyUserStyles } from './common'
import { UserOptions } from './interfaces'
import { parseHtml } from './htmlParser'

export type autoTable = (options: UserOptions) => void
export const jsPDFAutoTable = (_jsPDF: any) => {
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

  _jsPDF.API.autoTable = autoTable
  _jsPDF.API.autoTableText = autoTableText

  // Assign false to enable `doc.lastAutoTable.finalY || 40` sugar;
  _jsPDF.API.lastAutoTable = false
  _jsPDF.API.previousAutoTable = false // deprecated in v3
  _jsPDF.API.autoTable.previous = false // deprecated in v3

  _jsPDF.API.autoTableSetDefaults = function(defaults) {
    setDefaults(defaults, this)
    return this
  }

  _jsPDF.autoTableSetDefaults = function(defaults, doc) {
    setDefaults(defaults, doc)
    return this
  }

  _jsPDF.API.autoTableHtmlToJson = function(tableElem, includeHiddenElements) {
    includeHiddenElements = includeHiddenElements || false

    if (!tableElem || !(tableElem instanceof HTMLTableElement)) {
      console.error('A HTMLTableElement has to be sent to autoTableHtmlToJson')
      return null
    }

    let { head, body, foot } = parseHtml(
      tableElem,
      includeHiddenElements,
      false
    )
    let firstRow = head[0] || body[0] || foot[0]

    return { columns: firstRow, rows: body, data: body }
  }

  /**
   * @deprecated
   */
  _jsPDF.API.autoTableEndPosY = function() {
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
  _jsPDF.API.autoTableAddPageContent = function(hook) {
    console.error(
      'Use of deprecated function: autoTableAddPageContent. Use jsPDF.autoTableSetDefaults({didDrawPage: () => {}}) instead.'
    )
    if (!_jsPDF.API.autoTable.globalDefaults) {
      _jsPDF.API.autoTable.globalDefaults = {}
    }
    _jsPDF.API.autoTable.globalDefaults.addPageContent = hook
    return this
  }

  /**
   * @deprecated
   */
  _jsPDF.API.autoTableAddPage = function() {
    console.error(
      'Use of deprecated function: autoTableAddPage. Use doc.addPage()'
    )
    this.addPage()
    return this
  }
}
