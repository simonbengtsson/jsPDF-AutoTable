import { jsPDF } from 'jspdf'
import { parseInput } from '../src/inputParser';
import { createTable } from '../src/tableCalculator';
import * as assert from 'assert'

function round(val: number) {
  return Math.round(val * 1000) / 1000
}

describe('width calculator', () => {

  it('minContentWidth & maxContentWidth', () => {
    const d = new jsPDF()
    const input = parseInput(d, {
      head: [['abcd', 'ab cd', 'abc']],
      body: [
        ['ab cd', 'a', 'a'],
        ['a', 'a', 'a'],
      ],
      styles: {fontSize: 10, fontStyle: 'normal'},
    })
    const table = createTable(d, input)
    const cols = table.columns
    assert(cols[0].minContentWidth > 0)
    assert(cols[0].minContentWidth > cols[1].minContentWidth)
    assert(cols[1].minContentWidth < cols[2].minContentWidth)
    assert(cols[0].maxContentWidth > 0)
    assert(cols[0].minContentWidth < cols[0].maxContentWidth)
    assert.equal(cols[0].maxContentWidth, cols[1].maxContentWidth)
    assert(cols[1].maxContentWidth > cols[2].maxContentWidth)
    assert.equal(cols[2].minContentWidth, cols[2].maxContentWidth)
  })

  it('grow relative to content', () => {
    const doc = new jsPDF()
    const row = ['abc', 'a', '', 'ab', 'abcd', 'ab', 'abc', 'ab cd']
    const input = parseInput(doc, {
      body: [row],
    })
    const table = createTable(doc, input)
    const cols = table.columns
    for (let i = 0; i < cols.length; i++) {
      for (let j = i+1; j < cols.length; j++) {
        const w1 = cols[i].width
        const w2 = cols[j].width
        if (row[i].length === row[j].length) {
          assert.equal(w1, w2, `equal width ${i}, ${j}`)
        } else {
          assert(row[i].length > row[j].length ? w1 > w2 : w1 < w2, `compare width ${i}, ${j}`)
        }
      }
    }
  })

  it('width options', () => {
    const doc = new jsPDF()
    const input = parseInput(doc, {
      body: [Array(4).fill('abc def')],
      columnStyles: {
        0: {cellWidth: 10},
        1: {cellWidth: 'min-content'},
        2: {cellWidth: 'max-content'},
      }
    })
    const table = createTable(doc, input)
    const cols = table.columns
    assert.equal(cols[0].width, 10, 'fixed width')
    assert.equal(cols[1].width, cols[1].minContentWidth, 'min-content')
    assert(cols[1].minContentWidth > 0)
    assert.equal(cols[2].width, cols[2].maxContentWidth, 'max-content')
    assert(cols[2].maxContentWidth > 0)
    assert(cols[2].maxContentWidth > cols[2].minContentWidth)
    assert.equal(round(cols[3].width), round(table.width - (cols[0].width + cols[1].width + cols[2].width)), 'auto width')
  })

  it('minCellWidth & maxCellWidth', () => {
    const doc = new jsPDF()
    const input = parseInput(doc, {
      body: [Array(6).fill('abc def')],
      styles: {cellWidth: 50},
      columnStyles: {
        0: {},
        1: {minCellWidth: 60},
        2: {maxCellWidth: 40},
        3: {minCellWidth: 60, maxCellWidth: 55},
        4: {maxCellWidth: 'max-content'},
        5: {cellWidth: 1, minCellWidth: 'min-content'},
      }
    })
    const table = createTable(doc, input)
    const cols = table.columns
    assert.equal(cols[0].width, 50, 'auto')
    assert.equal(cols[1].width, 60, 'minCellWidth')
    assert.equal(cols[2].width, 40, 'maxCellWidth')
    assert.equal(cols[3].width, 60, 'minCellWidth should override maxCellWidth')
    assert.equal(cols[4].width, cols[4].maxContentWidth, 'maxCellWidth max-content')
    assert.equal(cols[5].width, cols[5].minContentWidth, 'minCellWidth min-content')
  })

  it('aggregated min & max width', () => {
    const doc = new jsPDF()
    const input = parseInput(doc, {
      body: [
        ['a', 'a', 'a', 'a'],
        ['ab cd', 'ab cd', 'ab cd', 'ab cd'],
        ['', '', '', ''],
      ],
      columnStyles: {
        0: {},
        1: {minCellWidth: 'min-content', maxCellWidth: 'max-content'},
        2: {minCellWidth: 'max-content'},
        3: {maxCellWidth: 'min-content'},
      }
    })
    const table = createTable(doc, input)
    const cols = table.columns
    assert(cols[0].minWidth < cols[0].minContentWidth, 'minCellWidth auto')
    assert.equal(cols[0].maxWidth, Infinity, 'maxCellWidth auto')
    assert.equal(cols[1].minWidth, cols[1].minContentWidth, 'minCellWidth min-content')
    assert.equal(cols[1].maxWidth, cols[1].maxContentWidth, 'maxCellWidth max-content')
    assert.equal(cols[2].minWidth, cols[2].maxContentWidth, 'minCellWidth max-content')
    assert.equal(cols[2].maxWidth, Infinity, 'maxCellWidth auto')
    assert.equal(cols[3].maxWidth, cols[3].minContentWidth, 'maxCellWidth min-content')
    assert(cols[3].minWidth < cols[3].minContentWidth, 'minCellWidth auto')

    for (const col of cols) {
      assert(col.minContentWidth > 0 && col.maxContentWidth > col.minContentWidth)
      assert.equal(col.minContentWidth, table.body[1].cells[col.index].minContentWidth)
      assert.equal(col.maxContentWidth, table.body[1].cells[col.index].contentWidth)
      assert(col.width >= col.minWidth && col.width <= col.maxWidth)
    }
  })

  it('aggregated min & max width - with styles', () => {
    const doc = new jsPDF()
    const input = parseInput(doc, {
      head: [['a', 'a', 'ab cd']],
      body: [
        ['a', 'a', 'a'],
        ['ab cd', 'ab cd', 'a'],
        ['', '', ''],
      ],
      styles: {minCellWidth: 'min-content', maxCellWidth: 'max-content'},
      columnStyles: {
        0: {minCellWidth: 'auto', maxCellWidth: 'auto'},
      }
    })
    const table = createTable(doc, input)
    const cols = table.columns
    for (const col of cols) {
      assert(col.minContentWidth > 0 && col.maxContentWidth > col.minContentWidth)
      if (col.index === 0) {
        assert(col.minWidth < col.minContentWidth, 'minCellWidth auto')
        assert.equal(col.maxWidth, Infinity, 'maxCellWidth auto')
      } else {
        assert.equal(col.minWidth, col.minContentWidth, 'minCellWidth min-content')
        assert.equal(col.maxWidth, col.maxContentWidth, 'maxCellWidth max-content')
      }
      assert(col.width >= col.minWidth && col.width <= col.maxWidth)
    }
  })

  it('minimize word-break', () => {
    const doc = new jsPDF()
    const input = parseInput(doc, {
      body: [['abc', 'abc def', 'abcdef'.repeat(10), 'abc def'.repeat(10)]],
      tableWidth: 50,
    })
    const table = createTable(doc, input)
    for (const col of table.columns) {
      assert(col.minContentWidth > 0)
      if (col.index === 2) {
        assert(col.width < col.minContentWidth, 'shrink beyond minContentWidth')
      } else {
        assert.equal(col.width, col.minContentWidth, `minContentWidth ${col.index}`)
      }
    }
  })

  it('aggregate width styles', () => {
    const doc = new jsPDF()
    const input = parseInput(doc, {
      head: [['0', '1', {content: '2', styles: {cellWidth: 10}}, '3', '4']],
      body: [
        [{content: '0', styles: {cellWidth: 10}}, {content: '1', styles: {minCellWidth: 100}}, '2', '3', '4'],
        [{content: '0', styles: {cellWidth: 20}}, {content: '1', styles: {minCellWidth: 110}}, '2', '3', '4'],
        ['0', '1', {content: '2', styles: {cellWidth: 5}}, {content: '3', styles: {maxCellWidth: 10}}, '4'],
        ['0', '1', '2', {content: '3', styles: {maxCellWidth: 20}}, '4'],
        ['0', '1', '2', '3', {content: '4', styles: {maxCellWidth: 20}}],
      ],
      columnStyles: {
        0: {cellWidth: 15},
        1: {minCellWidth: 105},
        2: {minCellWidth: 100},
        4: {maxCellWidth: 10},
      },
      tableWidth: 260,
    })
    const table = createTable(doc, input)
    const cols = table.columns
    assert.equal(table.width, 260, 'tableWidth')
    assert.equal(cols[0].width, 20, 'cellWidth')
    assert.equal(cols[1].width, 110, 'minCellWidth')
    assert.equal(cols[2].width, 100, 'cellWidth on head')
    assert.equal(cols[3].width, 20, 'maxCellWidth')
    assert.equal(cols[4].width, 10, 'maxCellWidth on columnStyles should override cells')
  })

  it('reset column width', () => {
    // Make sure width styles can be reset in columnStyles after been set in styles
    const doc = new jsPDF()
    const input = parseInput(doc, {
      head: [{id: 'ID', name: 'Name', empty: '', info: 'Info'}],
      body: [
        {id: 'ID', name: 'Name', empty: '', info: 'Info'},
      ],
      foot: [{id: 'ID', name: 'Name', empty: '', info: 'Info'}],
      styles: {
        cellWidth: 'max-content',
        minCellWidth: 10,
        maxCellWidth: 20,
        cellPadding: 0,
      },
      columnStyles: {
        info: {cellWidth: 'auto', maxCellWidth: 'auto'},
        empty: {minCellWidth: 0},
      },
      tableWidth: 200,
    })
    const table = createTable(doc, input)
    for (const col of table.columns) {
      if (col.dataKey === 'empty') {
        assert.equal(col.width, 0, 'empty col should have 0 width (minCellWidth: 0)')
      } else if (col.dataKey === 'info') {
        assert(col.width > 100, 'col should have auto width and grow to fill remaining width')
      } else {
        assert(col.width >= 10, 'minCellWidth')
        assert(col.width <= 20, 'maxCellWidth')
      }
    }
  })
})
