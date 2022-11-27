import assert from 'assert'
import { jsPDF } from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'
import defaultAutoTableImport from 'jspdf-autotable'

describe('esm imports', () => {
  it('jspdf import checks', () => {
    assert.equal(typeof jsPDF, 'function')
    const doc = new jsPDF()
    assert.equal(typeof doc.text, 'function')
  })

  it('autotable prototype', () => {
    const doc = new jsPDF()
    assert.equal(typeof doc.autoTable, 'function')
  })

  it('applyPlugin', () => {
    jsPDF.API.autoTable = undefined
    let doc = new jsPDF()
    assert.equal(typeof doc.autoTable, 'undefined')
    applyPlugin(jsPDF)
    doc = new jsPDF()
    assert.equal(typeof doc.autoTable, 'function')
  })

  it('deprecated autoTable default import', () => {
    assert.equal(typeof defaultAutoTableImport.default, 'function')
  })
})
