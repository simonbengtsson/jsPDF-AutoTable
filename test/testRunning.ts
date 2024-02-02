import { jsPDF } from 'jspdf'
import { autoTable } from '../src/main'
import * as assert from 'assert'

describe('runner', () => {
  it('export', () => {
    const doc = new jsPDF()
    autoTable(doc, { body: [['cell']] })
    assert(true)
  })

  it('nodejs', () => {
    ;(global as any).window = {}
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
    assert.equal(doc.getCurrentPageInfo().pageNumber, 2)
  })
})
