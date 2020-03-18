'use strict'

import applyApi from './applyApi'
import { UserOptions } from './interfaces'

export type autoTable = (options: UserOptions) => void

const jsPDF = require('jspdf')
applyApi(jsPDF)
