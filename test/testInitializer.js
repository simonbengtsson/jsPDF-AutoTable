const assert = require('assert')

describe('execution', () => {
  let jsPDF
  before(() => {
    jsPDF = require('./common').loadJspdf()
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
      willDrawCell: (data) => {
        doc.addPage()
      },
    })

    assert.equal(doc.internal.getCurrentPageInfo().pageNumber, 2)
  })
})
