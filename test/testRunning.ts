import { loadJspdf } from './common'
const jsPDF = loadJspdf()
import autoTable, { autoTable as autoTableType } from '../src/main'
const assert = require('assert')

describe('runner', () => {
  it('prototype', () => {
    const doc = new jsPDF()
    doc.autoTable({ body: [['cell']] })
    assert(true)
  })

  it('export', () => {
    const doc = new jsPDF()
    autoTable(doc, { body: [['cell']] })
    assert(true)
  })

  it('nodejs', () => {
    (global as any).window = {}
    const jsPDFNode = require('jspdf/dist/jspdf.node').jsPDF
    delete (global as any).window

    const doc = new jsPDFNode()
    autoTable(doc, { body: [['cell']] })
    assert(true)
  })

  it('add page in hook', () => {
    const doc = new jsPDF()
    autoTable(doc, {
      body: [['test']],
      willDrawCell: () => {
        doc.addPage()
      },
    })
    assert.equal(doc.internal.getCurrentPageInfo().pageNumber, 2)
  })

  it('previous typing', () => {
    const doc = new jsPDF()
    ;((doc as any).autoTable as autoTableType)({
      body: [['test']],
    })
    assert(true)
  })
})
