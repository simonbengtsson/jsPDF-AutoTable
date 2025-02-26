import autoTableText, { TextStyles } from './autoTableText'
import { UserOptions } from './config'
import { DocHandler, jsPDFConstructor, jsPDFDocument } from './documentHandler'
import { parseHtml } from './htmlParser'
import { parseInput } from './inputParser'
import { createTable } from './tableCalculator'
import { drawTable } from './tableDrawer'

export function applyPlugin(jsPDF: jsPDFConstructor) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsPDF.API.autoTable = function (this: jsPDFDocument, ...args: any[]) {
    const options: UserOptions = args[0]
    const input = parseInput(this, options)
    const table = createTable(this, input)
    drawTable(this, table)
    return this
  }

  // Assign false to enable `doc.lastAutoTable.finalY || 40` sugar
  jsPDF.API.lastAutoTable = false

  jsPDF.API.autoTableText = function (
    text: string | string[],
    x: number,
    y: number,
    styles: TextStyles,
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
    includeHiddenElements = false,
  ) {
    if (typeof window === 'undefined') {
      console.error('Cannot run autoTableHtmlToJson in non browser environment')
      return null
    }

    const doc = new DocHandler(this)
    const { head, body } = parseHtml(
      doc,
      tableElem,
      window,
      includeHiddenElements,
      false,
    )
    const columns = head[0]?.map((c) => c.content) || []
    return { columns, rows: body, data: body }
  }
}
