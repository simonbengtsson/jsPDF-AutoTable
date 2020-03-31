'use strict'


const assert = require('assert')
const state = require('../src/state')
const { resizeColumns } = require('../src/widthCalculator')
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

  describe('columns resizer', () => {
    it('shrink: one column - no min', () => {
      const one = new Column('one', 'one', 0)
      one.width = 700
      one.wrappedWidth = 700
      const resizeWidth = resizeColumns([one], -700, () => 0)
      assert.equal(one.width, 0, 'width')
      assert.equal(resizeWidth, 0, 'resizeWidth')
    })

    it('shrink: one column - min', () => {
      const one = new Column('one', 'one', 0)
      one.width = 700
      one.wrappedWidth = 700
      one.minWidth = 200
      const resizeWidth = resizeColumns([one], -600, (col) => col.minWidth)
      assert.equal(one.width, 200, 'width')
      assert.equal(resizeWidth, -100, 'resizeWidth')
    })

    it('shrink: two columns - no min', () => {
      const one = new Column('one', 'one', 0)
      const w1 = 1200, w2 = 400, r = -500
      one.width = w1
      one.wrappedWidth = w1
      const two = new Column('two', 'two', 1)
      two.width = w2
      two.wrappedWidth = w2
      const resizeWidth = resizeColumns([one, two], r, () => 0)
      assert.equal(one.width, w1 + (r * (w1 / (w1 + w2))), 'width one')
      assert.equal(two.width, w2 + (r * (w2 / (w1 + w2))), 'width two')
      assert.equal(resizeWidth, 0, 'resizeWidth')
    })

    it('shrink: two columns - min', () => {
      const one = new Column('one', 'one', 0)
      const w1 = 1200, w2 = 400, r = -500
      one.width = w1
      one.wrappedWidth = w1
      one.minWidth = 900
      const two = new Column('two', 'two', 1)
      two.width = w2
      two.wrappedWidth = w2
      two.minWidth = 100
      const resizeWidth = resizeColumns([one, two], r, (col) => col.minWidth)
      assert.equal(one.width, 900, 'width one')
      assert.equal(two.width, 200, 'width two')
      assert.equal(resizeWidth, 0, 'resizeWidth')
    })

    it('grow: two columns - no min', () => {
      const one = new Column('one', 'one', 0)
      const w1 = 50, w2 = 60, w3 = 70, r = 1000
      one.width = w1
      one.wrappedWidth = w1
      const two = new Column('two', 'two', 1)
      two.width = w2
      two.wrappedWidth = w2
      const resizeWidth = resizeColumns([one, two], r, () => 0)
      assert.equal(one.width, w1 + (r * (w1 / (w1 + w2))), 'width three')
      assert.equal(two.width, w2 + (r * (w2 / (w1 + w2))), 'width two')
      assert.equal(resizeWidth, 0, 'resizeWidth')
    })

    it('grow: three columns - one min', () => {
      const one = new Column('one', 'one', 0)
      const w1 = 50, w2 = 60, w3 = 70, r = 1000
      one.width = w1
      one.wrappedWidth = w1
      one.minWidth = 500
      const two = new Column('two', 'two', 1)
      two.width = w2
      two.wrappedWidth = w2
      const three = new Column('three', 'three', 1)
      three.width = w3
      three.wrappedWidth = w3
      const resizeWidth = resizeColumns([one, two, three], r, (col) => col.minWidth)
      assert.equal(one.width, 500, 'width one')
      assert.equal(two.width, w2 + ((r - one.minWidth + w1) * (w2 / (w2 + w3))), 'width two')
      assert.equal(three.width, w3 + ((r - one.minWidth + w1) * (w3 / (w2 + w3))), 'width three')
      assert.equal(resizeWidth, 0, 'resizeWidth')
    })
  })
})
