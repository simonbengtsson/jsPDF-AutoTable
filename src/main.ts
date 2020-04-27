'use strict'

import _applyPlugin from './applyPlugin'
import { UserOptions } from './config'
import { jsPDFConstructor } from './documentHandler'
import { autoTable as _autoTable } from './autoTable'

// export { applyPlugin } didn't export applyPlugin
// to index.d.ts for some reason
export function applyPlugin(jsPDF: jsPDFConstructor) {
  _applyPlugin(jsPDF)
}
export type autoTable = (options: UserOptions) => void

export function autoTable(jsPDF: jsPDFConstructor, options: UserOptions) {
  _applyPlugin(jsPDF)
  _autoTable(options)
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
