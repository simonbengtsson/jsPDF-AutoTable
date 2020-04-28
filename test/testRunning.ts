const assert = require('assert')
import { loadJspdf } from './common'
import { autoTable as autoTableType } from '../src/main'

describe('runner', () => {
  it('prototype', () => {
    const jsPDF = loadJspdf()
    require('../src/main')
    const doc = new jsPDF()
    doc.autoTable({ body: [['cell']] })
    assert(true)
  })

  it('export', () => {
    const jsPDF = loadJspdf()
    const doc = new jsPDF()
    const autoTable = require('../src/main').default
    autoTable(doc, { body: [['cell']] })
    assert(true)
  })

  it('add page in hook', () => {
    const jsPDF = loadJspdf()
    const doc = new jsPDF()
    const autoTable = require('../src/main').default
    autoTable(doc, {
      body: [['test']],
      willDrawCell: () => {
        doc.addPage()
      },
    })

    assert.equal(doc.internal.getCurrentPageInfo().pageNumber, 2)
  })

  it('previous typing', () => {
    const jsPDF = loadJspdf()
    require('../src/main')
    const doc = new jsPDF()
    ;((doc as any).autoTable as autoTableType)({
      body: [['test']],
    })
    assert(true)
  })
})
