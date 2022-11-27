import * as assert from 'assert'
import jsPDF from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'
import autoTable from 'jspdf-autotable'

describe('typescript imports', () => {
  it('jspdf import checks', () => {
    assert.equal(typeof jsPDF, 'function')
    const doc = new jsPDF()
    assert.equal(typeof doc.text, 'function')
  })

  it('autotable prototype', () => {
    const doc: any = new jsPDF()
    assert.equal(typeof doc.autoTable, 'function')
  })

  it('applyPlugin', () => {
    (jsPDF.API as any).autoTable = undefined
    let doc: any = new jsPDF()
    assert.equal(typeof doc.autoTable, 'undefined')
    applyPlugin(jsPDF)
    doc = new jsPDF()
    assert.equal(typeof doc.autoTable, 'function')
  })

  it('deprecated autoTable default import', () => {
    assert.equal(typeof autoTable, 'function')
  })
})
