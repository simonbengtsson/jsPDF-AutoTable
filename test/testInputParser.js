'use strict'

const assert = require('assert')
const { DocHandler } = require('../src/documentHandler')
const { parseInput } = require('../src/inputParser')

describe('input parser', function () {
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
  })

  after(() => {
    delete global.window
    delete global.navigator
  })

  it('array input', function () {
    let jsPDF = require('jspdf')
    let doc = new DocHandler(new jsPDF())
    let table = parseInput([
      {
        head: [['test', 'test']],
        body: [
          ['test', 'test'],
          ['test', 'test'],
        ],
      },
    ], doc)
    assert(table, 'Has table')
    assert.equal(table.head.length, 1)
    assert.equal(table.body.length, 2)
    assert.equal(table.foot.length, 0)
    assert.equal(Object.keys(table.head[0].cells).length, 2)
    assert.equal(table.head[0].cells[0].text, 'test')
    assert(table.head[0].cells[0].minWidth > 0)
  })

  it('minReadableWidth', function () {
    let jsPDF = require('jspdf')
    let doc = new DocHandler(new jsPDF())
    let table = parseInput([
      {
        head: [['aaaa', 'aa', 'aaa']],
        body: [['a', 'a', 'a']],
      },
    ], doc)
    const cols = table.columns
    assert(table.body[0].cells[0].minReadableWidth > 0)
    assert(cols[0].minReadableWidth > cols[1].minReadableWidth)
    assert(cols[1].minReadableWidth < cols[2].minReadableWidth)
  })

  it('object input', function () {
    let jsPDF = require('jspdf')
    let doc = new DocHandler(new jsPDF())
    let table = parseInput([
      {
        head: [
          {
            id: 'ID',
            name: 'Name',
            email: 'Email',
            city: 'City',
            expenses: 'Expenses',
          },
        ],
      },
    ], doc)
    assert.equal(table.head[0].cells['id'].text, 'ID')
    assert.equal(table.head[0].cells[0].text, 'ID')
  })

  it('object input', function () {
    let jsPDF = require('jspdf')
    let doc = new DocHandler(new jsPDF())
    let table = parseInput([
      {
        head: [[{ content: 'test' }, 'test 2']],
        body: [
          ['body', 'test'],
          ['test', 'test'],
        ],
      },
    ], doc)
    assert.equal(table.head[0].cells[0].text, 'test')
    assert.equal(table.head[0].cells[1].text, 'test 2')
    assert.equal(table.body[0].cells[0].text, 'body')
  })

  it('rowspan input', function () {
    let jsPDF = require('jspdf')
    let doc = new DocHandler(new jsPDF())
    let table = parseInput([
      { body: [[{ content: 'test', rowSpan: 2 }, 'one'], ['two']] },
    ], doc)
    assert.equal(table.body[0].cells[0].text, 'test')
    assert.equal(table.body[1].cells[0], null)
    assert.equal(table.body[0].cells[1].text, 'one')
    assert.equal(table.body[1].cells[1].text, 'two')
  })
})
