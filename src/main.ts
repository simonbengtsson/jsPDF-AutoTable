'use strict'

import applyPlugin from './applyPlugin'
import { UserOptions } from './interfaces'

export { applyPlugin }
export type autoTable = (options: UserOptions) => void

try {
  const jsPDF = require('jspdf')
  applyPlugin(jsPDF)
} catch (error) {
  // Importing jspdf in nodejs environments does not work as of jspdf
  // 1.5.3 so we need to silence any errors to support using for example
  // the nodejs jspdf dist files with the exported applyPlugin
}
