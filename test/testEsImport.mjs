import assert from 'assert'
import { jsPDF } from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'
import defaultAutoTableImport from 'jspdf-autotable'

describe('es imports', () => {
  it('jspdf import checks', () => {
    assert.equal(typeof jsPDF, 'function')
    const doc = new jsPDF()
    assert.equal(typeof doc.text, 'function')
  })

  it('applyPlugin', () => {
    jsPDF.API.autoTable = undefined
    let doc = new jsPDF()
    assert.equal(typeof doc.autoTable, 'undefined')
    applyPlugin(jsPDF)
    doc = new jsPDF()
    assert.equal(typeof doc.autoTable, 'function')
  })

  it('default import', () => {
    assert.equal(typeof defaultAutoTableImport, 'function')
  })

  it('deprecated default property import', () => {
    assert.equal(typeof defaultAutoTableImport.default, 'function')
  })
})
