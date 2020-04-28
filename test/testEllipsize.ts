const assert = require('assert')
import { ellipsize } from '../src/widthCalculator'
import { DocHandler } from '../src/documentHandler'
import { loadJspdf } from './common'
const jsPDF = loadJspdf()

describe('ellipsize', () => {
  it('ellipsize string', () => {
    const doc = new DocHandler(new jsPDF())

    const text = ['lorem ipsum']
    let str = ellipsize(text, 0, {}, doc, '...')[0]
    assert(str.length < 5, `Should be reduced in length`)
    assert(str.endsWith('...'), `Should end with ...`)

    str = ellipsize(text, 100, {}, doc, '...')[0]
    assert.equal(str.length, 11, `Should not be reduced`)
  })

  it('ellipsize string array', () => {
    const doc = new DocHandler(new jsPDF())

    const text = ['lorem ipsum', 'lorem ipsum ipsum']
    let str = ellipsize(text, 0, {}, doc, '...')
    assert(str[0].length < 5, `Should be reduced in length`)
    assert(str[1].length < 5, `Should be reduced in length`)
    assert(str[0].endsWith('...'), `Should end with ...`)
    assert(str[1].endsWith('...'), `Should end with ...`)

    str = ellipsize(text, 100, {}, doc, '...')
    assert.equal(str[0].length, 11, `Should not be reduced`)
    assert.equal(str[1].length, 17, `Should not be reduced`)
  })
})
