'use strict'

const { before, it, describe } = global
const assert = require('assert')

describe('execution', function () {
  let jsPDF = null

  before(function () {
    this.timeout(5000)
    global.window = {
      document: {
        createElementNS: function () {
          return {}
        },
      },
    }
    global.navigator = {}
    jsPDF = require('jspdf')
    require('../src/main')
  })

  after(function () {
    delete global.navigator
    delete global.window
  })

  it('init', function () {
    let doc = new jsPDF()
    assert.equal(typeof doc.autoTable, 'function')
  })

  it('add page in hook', function () {
    let doc = new jsPDF()

    doc.autoTable({
      head: [],
      body: [['test']],
      willDrawCell: function (data) {
        doc.addPage()
      },
    })

    assert.equal(doc.internal.getCurrentPageInfo().pageNumber, 2)
  })
})
