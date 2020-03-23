'use strict'

import applyApi from './applyApi'
import { UserOptions } from './interfaces'

export function applyPlugin(jsPDF) {
  applyApi(jsPDF)
}
export type autoTable = (options: UserOptions) => void

try {
  const jsPDF = require('jspdf')
  applyApi(jsPDF)
} catch(error) {
  // Importing jspdf in nodejs environment currently does not work
  // so we need to silence any errors
}
