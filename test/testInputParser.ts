import { loadJspdf } from './common'
import { createTable } from '../src/inputParser'

const assert = require('assert')
const jsPDF = loadJspdf()

describe('input parser', () => {
  it('non browser', () => {
    const res = createTable(new jsPDF(), { html: '#table' })
    assert(res.body.length === 0, 'Should have empty result')
  })

  it('array input', () => {
    const table = createTable(new jsPDF(),
      {
        head: [['test', 'test']],
        body: [
          ['test', 'test'],
          ['test', 'test'],
        ],
      }
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
    const table = createTable(new jsPDF(),
      {
        head: [['aaaa', 'aa', 'aaa']],
        body: [['a', 'a', 'a']],
      }
    )
    const cols = table.columns
    assert(table.body[0].cells[0].minReadableWidth > 0)
    assert(cols[0].minReadableWidth > cols[1].minReadableWidth)
    assert(cols[1].minReadableWidth < cols[2].minReadableWidth)
  })

  it('object input', () => {
    const table = createTable(new jsPDF(),
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
    )
    assert.equal(table.head[0].cells['id'].text, 'ID')
    assert.equal(table.head[0].cells[0].text, 'ID')
  })

  it('object input', () => {
    const table = createTable(new jsPDF(),
      {
        head: [[{ content: 'test' }, 'test 2']],
        body: [
          ['body', 'test'],
          ['test', 'test'],
        ],
      }
    )
    assert.equal(table.head[0].cells[0].text, 'test')
    assert.equal(table.head[0].cells[1].text, 'test 2')
    assert.equal(table.body[0].cells[0].text, 'body')
  })

  it('rowspan input', () => {
    const table = createTable(new jsPDF(),
      { body: [[{ content: 'test', rowSpan: 2 }, 'one'], ['two']] },
    )
    assert.equal(table.body[0].cells[0].text, 'test')
    assert.equal(table.body[1].cells[0], null)
    assert.equal(table.body[0].cells[1].text, 'one')
    assert.equal(table.body[1].cells[1].text, 'two')
  })
})
