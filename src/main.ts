'use strict'

import _applyPlugin from './applyPlugin'
import { UserOptions } from './config'
import { jsPDFConstructor, jsPDFDocument } from './documentHandler'
import { createTable } from './inputParser'
import { calculateWidths } from './widthCalculator'
import { drawTable } from './tableDrawer'

export type autoTable = (options: UserOptions) => void

// export { applyPlugin } didn't export applyPlugin
// to index.d.ts for some reason
export function applyPlugin(jsPDF: jsPDFConstructor) {
  _applyPlugin(jsPDF)
}

export default function autoTable(doc: jsPDFDocument, options: UserOptions) {
  const table = createTable(doc, options)
  drawTable(doc, table)
}

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const jsPDF = require('jspdf')
  applyPlugin(jsPDF)
} catch (error) {
  // Importing jspdf in nodejs environments does not work as of jspdf
  // 1.5.3 so we need to silence potential errors to support using for example
  // the nodejs jspdf dist files with the exported applyPlugin
}
