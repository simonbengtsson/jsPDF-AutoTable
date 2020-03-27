'use strict'


const assert = require('assert')
const state = require('../src/state')
const { resizeSentencesColumns, resizeColumns } = require('../src/columnResizer')
const { Column } = require('../src/models')

describe('column resizer', () => {
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
    let jsPDF = require('jspdf')
    require('../src/main')
    state.setupState(new jsPDF())
  })

  after(function () {
    state.resetState()
  })

  describe('sentence columns resizer', () => {
    it('one columns', () => {
      const one = new Column('one', 'one', 0)
      one.wrappedWidth = 700
      one.longestWordWidth = 100
      const resizeWidth = resizeSentencesColumns([one], -500)
      assert.equal(one.width, 200)
      assert.equal(resizeWidth, 0)
    })

    it('two columns', () => {
      const one = new Column('one', 'one', 0)
      one.wrappedWidth = 1200
      one.longestWordWidth = 100
      const two = new Column('two', 'two', 1)
      two.wrappedWidth = 300
      two.longestWordWidth = 100
      const resizeWidth = resizeSentencesColumns([one, two], -500)
      assert.equal(resizeWidth, 0)
      assert.equal(one.width + two.width, 1200 + 300 - 500)
    })

    it('long one word', () => {
      const one = new Column('one', 'one', 0)
      one.wrappedWidth = 1200
      one.longestWordWidth = 100
      const two = new Column('two', 'two', 1)
      two.wrappedWidth = 300
      two.longestWordWidth = 300
      const width = resizeSentencesColumns([one, two], -500)
      assert.equal(width, 0)
      assert.equal(one.width + two.width, 300 + 1200 - 500)
      assert(two.width >= 300, `${two.width}`)
    })
  })

  describe('word columns resizer', () => {
    it('one columns', () => {
      const one = new Column('one', 'one', 0)
      one.wrappedWidth = 700
      one.minWidth = 100
      const resizeWidth = resizeColumns([one], -500)
      assert.equal(one.width, 200)
      assert.equal(resizeWidth, 0)
    })
  })
})
