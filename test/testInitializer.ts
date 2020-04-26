const assert = require('assert')
import { loadJspdf } from './common'

describe('execution', () => {
  let jsPDF: any
  before(() => {
    jsPDF = loadJspdf()
    require('../src/main')
  })

  it('init', () => {
    const autoTable = new jsPDF().autoTable
    assert.equal(typeof autoTable, 'function')
  })

  it('add page in hook', () => {
    const doc = new jsPDF()
    doc.autoTable({
      head: [],
      body: [['test']],
      willDrawCell: () => {
        doc.addPage()
      },
    })

    assert.equal(doc.internal.getCurrentPageInfo().pageNumber, 2)
  })
})
