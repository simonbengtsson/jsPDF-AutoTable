import { setDefaults } from './state'
import './autoTableText'
import { parseHtml } from './htmlParser'
import autoTableText from './autoTableText'
import autoTable from './autoTable'

export default function (jsPDF) {
  jsPDF.API.autoTable = autoTable

  // Assign false to enable `doc.lastAutoTable.finalY || 40` sugar
  jsPDF.API.lastAutoTable = false
  jsPDF.API.previousAutoTable = false // deprecated in v3
  jsPDF.API.autoTable.previous = false // deprecated in v3

  jsPDF.API.autoTableText = function (text, x, y, styles) {
    autoTableText(text, x, y, styles, this)
  }

  jsPDF.API.autoTableSetDefaults = function (defaults) {
    setDefaults(defaults, this)
    return this
  }

  jsPDF.autoTableSetDefaults = function (defaults, doc) {
    setDefaults(defaults, doc)
    return this
  }

  jsPDF.API.autoTableHtmlToJson = function (tableElem, includeHiddenElements) {
    includeHiddenElements = includeHiddenElements || false

    if (!tableElem || !(tableElem instanceof HTMLTableElement)) {
      console.error('An HTMLTableElement has to be sent to autoTableHtmlToJson')
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
  jsPDF.API.autoTableEndPosY = function () {
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
  jsPDF.API.autoTableAddPageContent = function (hook) {
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
  jsPDF.API.autoTableAddPage = function () {
    console.error(
      'Use of deprecated function: autoTableAddPage. Use doc.addPage()'
    )
    this.addPage()
    return this
  }
}
