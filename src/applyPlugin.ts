import { parseHtml } from './htmlParser'
import autoTableText, { TextStyles } from './autoTableText'
import { autoTable } from './autoTable'
import { DocHandler, jsPDFConstructor, jsPDFDocument } from './documentHandler'
import { UserOptions } from './config'

export default function (jsPDF: jsPDFConstructor) {
  jsPDF.API.autoTable = autoTable

  // Assign false to enable `doc.lastAutoTable.finalY || 40` sugar
  jsPDF.API.lastAutoTable = false
  jsPDF.API.previousAutoTable = false // deprecated in v3
  jsPDF.API.autoTable.previous = false // deprecated in v3

  jsPDF.API.autoTableText = function (
    text: string | string[],
    x: number,
    y: number,
    styles: TextStyles
  ) {
    autoTableText(text, x, y, styles, this)
  }

  jsPDF.API.autoTableSetDefaults = function (defaults: UserOptions) {
    DocHandler.setDefaults(defaults, this)
    return this
  }

  jsPDF.autoTableSetDefaults = (defaults: UserOptions, doc?: jsPDFDocument) => {
    DocHandler.setDefaults(defaults, doc)
  }

  jsPDF.API.autoTableHtmlToJson = function (
    tableElem: HTMLTableElement,
    includeHiddenElements: boolean = false
  ) {
    if (typeof window === 'undefined') {
      console.error('Cannot run autoTableHtmlToJson in non browser environment')
      return null
    }

    if (!tableElem || !(tableElem instanceof HTMLTableElement)) {
      console.error('An HTMLTableElement has to be sent to autoTableHtmlToJson')
      return null
    }

    let { head, body, foot } = parseHtml(
      this,
      tableElem,
      window,
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
  jsPDF.API.autoTableAddPageContent = function (hook: Function) {
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
