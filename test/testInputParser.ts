import { loadJspdf } from './common'
import { createTable } from '../src/tableCalculator'
import { parseInput } from '../src/inputParser'

const assert = require('assert')
const jsPDF = loadJspdf()

describe('input parser', () => {
  it('non browser', () => {
    const d = new jsPDF()
    const input = parseInput(d, { html: '#table' })
    const res = createTable(d, input)
    assert(res.body.length === 0, 'Should have empty result')
  })

  it('array input', () => {
    const d = new jsPDF()
    const input = parseInput(d, {
      head: [['test', 'test']],
      body: [
        ['test', 'test'],
        ['test', 'test'],
      ],
    })
    const table = createTable(d, input)
    assert(table, 'Has table')
    assert.equal(table.head.length, 1)
    assert.equal(table.body.length, 2)
    assert.equal(table.foot.length, 0)
    assert.equal(Object.keys(table.head[0].cells).length, 2)
    assert.equal(table.head[0].cells[0].text, 'test')
    assert(table.head[0].cells[0].minWidth > 0)
  })

  it('minReadableWidth', () => {
    const d = new jsPDF()
    const input = parseInput(d, {
      head: [['aaaa', 'aa', 'aaa']],
      body: [['a', 'a', 'a']],
    })
    const table = createTable(d, input)
    const cols = table.columns
    assert(table.body[0].cells[0].minReadableWidth > 0)
    assert(cols[0].minReadableWidth > cols[1].minReadableWidth)
    assert(cols[1].minReadableWidth < cols[2].minReadableWidth)
  })

  it('object input', () => {
    const d = new jsPDF()
    const input = parseInput(d, {
      head: [
        {
          id: 'ID',
          name: 'Name',
          email: 'Email',
          city: 'City',
          expenses: 'Expenses',
        },
      ],
    })
    const table = createTable(d, input)
    assert.equal(table.head[0].cells['id'].text, 'ID')
    assert.equal(table.head[0].cells[0].text, 'ID')
  })

  it('object input', () => {
    const d = new jsPDF()
    const input = parseInput(d, {
      head: [[{ content: 'test' }, 'test 2']],
      body: [
        ['body', 'test'],
        ['test', 'test'],
      ],
    })
    const table = createTable(d, input)
    assert.equal(table.head[0].cells[0].text, 'test')
    assert.equal(table.head[0].cells[1].text, 'test 2')
    assert.equal(table.body[0].cells[0].text, 'body')
  })

  it('rowspan input', () => {
    const d = new jsPDF()
    const input = parseInput(d, {
      body: [[{ content: 'test', rowSpan: 2 }, 'one'], ['two']],
    })
    const table = createTable(d, input)
    assert.equal(table.body[0].cells[0].text, 'test')
    assert.equal(table.body[1].cells[0], null)
    assert.equal(table.body[0].cells[1].text, 'one')
    assert.equal(table.body[1].cells[1].text, 'two')
  })

  it.only('rowspan input two', () => {
    const d = new jsPDF()
    const input = parseInput(d, {
      body: [['one', { content: 'test', rowSpan: 2 }], ['two']],
    })
    const table = createTable(d, input)
    assert.equal(table.body[0].cells[0].text, 'one')
    assert.equal(table.body[0].cells[1].text, 'test')
    assert.equal(table.body[1].cells[0].text, 'two')
    assert.equal(table.body[1].cells[1], null)
  })
})
