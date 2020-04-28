const assert = require('assert')
import { resizeColumns } from '../src/widthCalculator'
import { Column } from '../src/models'

describe('calculator', () => {
  describe('columns resizer', () => {
    it('shrink: one column - no min', () => {
      const col1 = new Column('col1', null, 0)
      col1.width = 700
      col1.wrappedWidth = 700
      const resizeWidth = resizeColumns([col1], -700, () => 0)
      assert.equal(col1.width, 0, 'width')
      assert.equal(resizeWidth, 0, 'resizeWidth')
    })

    it('shrink: one column - min', () => {
      const col1 = new Column('col1', null, 0)
      col1.width = 700
      col1.wrappedWidth = 700
      col1.minWidth = 200
      const resizeWidth = resizeColumns([col1], -600, (col) => col.minWidth)
      assert.equal(col1.width, 200, 'width')
      assert.equal(resizeWidth, -100, 'resizeWidth')
    })

    it('shrink: two columns - no min', () => {
      const w1 = 1200,
        w2 = 400,
        r = -500
      const col1 = new Column('col1', null, 0)
      col1.width = w1
      col1.wrappedWidth = w1
      const col2 = new Column('col2', null, 1)
      col2.width = w2
      col2.wrappedWidth = w2
      const resizeWidth = resizeColumns([col1, col2], r, () => 0)
      assert.equal(col1.width, w1 + r * (w1 / (w1 + w2)), 'col1 width')
      assert.equal(col2.width, w2 + r * (w2 / (w1 + w2)), 'col2 width')
      assert.equal(resizeWidth, 0, 'resizeWidth')
    })

    it('shrink: two columns - min', () => {
      const w1 = 1200,
        w2 = 400,
        r = -500
      const col1 = new Column('col1', null, 0)
      col1.width = w1
      col1.wrappedWidth = w1
      col1.minWidth = 900
      const col2 = new Column('col2', null, 1)
      col2.width = w2
      col2.wrappedWidth = w2
      col2.minWidth = 100
      const resizeWidth = resizeColumns([col1, col2], r, (col) => col.minWidth)
      assert.equal(col1.width, 900, 'col1 width')
      assert.equal(col2.width, 200, 'col2 width')
      assert.equal(resizeWidth, 0, 'resizeWidth')
    })

    // this case will test if the space distribution is consistent for equal columns (important)
    it('shrink: consistent distribution', () => {
      const w1 = 1200,
        w2 = 400,
        r = -500
      const col1 = new Column('col1', null, 0)
      col1.width = w1
      col1.wrappedWidth = w1
      col1.minWidth = 350
      const col2 = new Column('col2', null, 0)
      col2.width = w2
      col2.wrappedWidth = w2
      col2.minWidth = 350
      const col3 = new Column('col3', null, 0)
      col3.width = w1
      col3.wrappedWidth = w1
      col3.minWidth = 350
      const col4 = new Column('col4', null, 0)
      col4.width = w2
      col4.wrappedWidth = w2
      col4.minWidth = 350

      let resizeWidth = resizeColumns(
        [col1, col2, col3, col4],
        r,
        (col) => col.minWidth
      )
      assert.equal(resizeWidth, 0, 'resizeWidth')
      assert.equal(col1.width, col3.width, 'col1 = col3')
      assert.equal(col2.width, col4.width, 'col2 = col4')

      resizeWidth = resizeColumns(
        [col1, col2, col4, col3],
        r,
        (col) => col.minWidth
      )
      assert.equal(resizeWidth, 0, 'resizeWidth')
      assert.equal(col1.width, col3.width, 'col1 = col3')
      assert.equal(col2.width, col4.width, 'col2 = col4')
    })

    it('grow: two columns - no min', () => {
      const w1 = 50,
        w2 = 60,
        r = 1000
      const col1 = new Column('col1', null, 0)
      col1.width = w1
      col1.wrappedWidth = w1
      const col2 = new Column('col2', null, 1)
      col2.width = w2
      col2.wrappedWidth = w2
      const resizeWidth = resizeColumns([col1, col2], r, () => 0)
      assert.equal(
        Math.round(col1.width),
        Math.round(w1 + r * (w1 / (w1 + w2))),
        'col3 width'
      )
      assert.equal(
        Math.round(col2.width),
        Math.round(w2 + r * (w2 / (w1 + w2))),
        'col2 width'
      )
      assert.equal(resizeWidth, 0, 'resizeWidth')
    })

    it('grow: three columns - col1 min', () => {
      const w1 = 50,
        w2 = 60,
        w3 = 70,
        r = 1000
      const col1 = new Column('col1', null, 0)
      col1.width = w1
      col1.wrappedWidth = w1
      col1.minWidth = 500
      const col2 = new Column('col2', null, 1)
      col2.width = w2
      col2.wrappedWidth = w2
      const col3 = new Column('col3', null, 1)
      col3.width = w3
      col3.wrappedWidth = w3
      const resizeWidth = resizeColumns(
        [col1, col2, col3],
        r,
        (col) => col.minWidth
      )
      assert.equal(col1.width, 500, 'col1 width')
      assert.equal(
        Math.round(col2.width),
        Math.round(w2 + (r - col1.minWidth + w1) * (w2 / (w2 + w3))),
        'col2 width'
      )
      assert.equal(
        Math.round(col3.width),
        Math.round(w3 + (r - col1.minWidth + w1) * (w3 / (w2 + w3))),
        'col3 width'
      )
      assert.equal(resizeWidth, 0, 'resizeWidth')
    })
  })
})
