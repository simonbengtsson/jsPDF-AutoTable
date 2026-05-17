import { jsPDF } from 'jspdf'
import assert from 'node:assert'
import autoTable, { applyPlugin, autoTableInstanceType } from '../src/main'

applyPlugin(jsPDF)

describe('runner', () => {
  it('prototype', () => {
    const doc: any = new jsPDF()
    doc.autoTable({ body: [['cell']] })
    assert(true)
  })

  it('export', () => {
    const doc = new jsPDF()
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

  it('previous typing', () => {
    applyPlugin(jsPDF)
    const doc = new jsPDF()
    ;((doc as any).autoTable as autoTableInstanceType)({ body: [['test']] })
    assert(true)
  })
})
