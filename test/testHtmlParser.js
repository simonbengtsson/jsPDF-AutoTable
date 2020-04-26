const assert = require('assert')
const { parseHtml } = require('../src/htmlParser')
const { DocHandler } = require('../src/documentHandler')

describe('html parser', () => {
  let doc, jsPDF;
  before(() => {
    jsPDF = require('./common').loadJspdf()
    doc = new DocHandler(new jsPDF())
  })

  it('full table', () => {
    const table = {
      rows: [
        {
          parentElement: { tagName: 'THEAD' },
          cells: [{ cloneNode: () => ({ innerText: 'test', innerHTML: '' }) }],
        },
        {
          parentElement: { tagName: 'TBODY' },
          cells: [
            { cloneNode: () => ({ innerText: 'test', innerHTML: '' }) },
            { cloneNode: () => ({ innerText: 'test', innerHTML: '' }) },
          ],
        },
        {
          parentElement: { tagName: 'TFOOT' },
          cells: [{ cloneNode: () => ({ innerText: 'test', innerHTML: '' }) }],
        },
      ],
    }
    const res = parseHtml(doc, table, {
      getComputedStyle: () => {
        return { display: 'visible' }
      },
    })
    assert(res, 'Should have result')
    assert(res.head[0].length, 'Should have head cell')
    assert.equal(res.body[0].length, 2, 'Should have two body cells')
    assert(res.foot[0].length, 'Should have foot cell')
  })

  it('hidden content', () => {
    const table = {
      rows: [
        { parentElement: { tagName: 'THEAD' }, cells: [{ innerText: 'test' }] },
        { parentElement: { tagName: 'TBODY' }, cells: [{ innerText: 'test' }] },
        { parentElement: { tagName: 'TFOOT' }, cells: [{ innerText: 'test' }] },
      ],
    }
    const res = parseHtml(doc, table, {
      getComputedStyle: () => {
        return { display: 'none' }
      },
    })
    assert(res, 'Should have result')
    assert(res.head.length === 0, 'Should have no head cells')
    assert(res.body.length === 0, 'Should have no body cell')
    assert(res.foot.length === 0, 'Should have no foot cells')
  })

  it('empty table', () => {
    const table = {
      rows: [
        { parentElement: { tagName: 'THEAD' }, cells: [] },
        { parentElement: { tagName: 'TBODY' }, cells: [] },
        { parentElement: { tagName: 'TFOOT' }, cells: [] },
      ],
    }

    const res = parseHtml(doc, table, {
      getComputedStyle: () => {
        return { display: 'visible' }
      },
    })
    assert(res, 'Should have result')
    assert(res.head.length === 0, 'Should have no head cells')
    assert(res.body.length === 0, 'Should have no body cells')
    assert(res.foot.length === 0, 'Should have no foot cells')
  })
})
