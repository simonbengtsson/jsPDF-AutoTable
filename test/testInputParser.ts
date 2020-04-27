const assert = require('assert')
import { DocHandler } from '../src/documentHandler'
import { createTable } from '../src/inputParser'

describe('input parser', () => {
  let doc: DocHandler, jsPDF
  before(() => {
    jsPDF = require('./common').loadJspdf()
    doc = new DocHandler(new jsPDF())
  })

  it('non browser', () => {
    const res = createTable({ html: '#table' }, doc)
    assert(res.body.length === 0, 'Should have empty result')
  })

  it('array input', () => {
    const table = createTable(
      {
        head: [['test', 'test']],
        body: [
          ['test', 'test'],
          ['test', 'test'],
        ],
      },
      doc
    )
    assert(table, 'Has table')
    assert.equal(table.head.length, 1)
    assert.equal(table.body.length, 2)
    assert.equal(table.foot.length, 0)
    assert.equal(Object.keys(table.head[0].cells).length, 2)
    assert.equal(table.head[0].cells[0].text, 'test')
    assert(table.head[0].cells[0].minWidth > 0)
  })

  it('minReadableWidth', () => {
    const table = createTable(
      {
        head: [['aaaa', 'aa', 'aaa']],
        body: [['a', 'a', 'a']],
      },
      doc
    )
    const cols = table.columns
    assert(table.body[0].cells[0].minReadableWidth > 0)
    assert(cols[0].minReadableWidth > cols[1].minReadableWidth)
    assert(cols[1].minReadableWidth < cols[2].minReadableWidth)
  })

  it('object input', () => {
    const table = createTable(
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
      doc
    )
    assert.equal(table.head[0].cells['id'].text, 'ID')
    assert.equal(table.head[0].cells[0].text, 'ID')
  })

  it('object input', () => {
    const table = createTable(
      {
        head: [[{ content: 'test' }, 'test 2']],
        body: [
          ['body', 'test'],
          ['test', 'test'],
        ],
      },
      doc
    )
    assert.equal(table.head[0].cells[0].text, 'test')
    assert.equal(table.head[0].cells[1].text, 'test 2')
    assert.equal(table.body[0].cells[0].text, 'body')
  })

  it('rowspan input', () => {
    const table = createTable(
      { body: [[{ content: 'test', rowSpan: 2 }, 'one'], ['two']] },
      doc
    )
    assert.equal(table.body[0].cells[0].text, 'test')
    assert.equal(table.body[1].cells[0], null)
    assert.equal(table.body[0].cells[1].text, 'one')
    assert.equal(table.body[1].cells[1].text, 'two')
  })
})
