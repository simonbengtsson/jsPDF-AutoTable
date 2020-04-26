import { parseHtml } from '../src/htmlParser'
import { DocHandler } from '../src/documentHandler'
const assert = require('assert')
const jsdom = require('jsdom');
const dom = new jsdom.JSDOM('');

describe('html parser', () => {
  let doc: any, jsPDF: any;
  before(() => {
    jsPDF = require('./common').loadJspdf()
    doc = new DocHandler(new jsPDF())
  })

  it('full table', () => {
    const table = dom.window.document.createElement('table')
    let section = table.createTBody()
    let row = section.insertRow()
    let cell1 = row.insertCell()
    cell1.innerHTML = '<p>test</p>'
    let cell2 = row.insertCell()
    cell2.innerHTML = '<p>test</p>'

    section = table.createTHead()
    row = section.insertRow()
    cell1 = row.insertCell()
    cell1.innerHTML = '<p>test</p>'

    section = table.createTFoot()
    row = section.insertRow()
    cell1 = row.insertCell()
    cell1.innerHTML = '<p>test</p>'

    const res = parseHtml(doc, table, dom.window)
    assert(res, 'Should have result')
    assert(res.head[0].length, 'Should have head cell')
    assert.equal(res.body[0].length, 2, 'Should have two body cells')
    assert(res.foot[0].length, 'Should have foot cell')
  })

  it('hidden content', () => {
    const table = dom.window.document.createElement('table')
    let section = table.createTBody()
    let row = section.insertRow()
    let cell1 = row.insertCell()
    cell1.style.display = 'none'
    cell1.innerHTML = '<p>test</p>'
    let cell2 = row.insertCell()
    cell2.innerHTML = '<p>test</p>'

    section = table.createTHead()
    row = section.insertRow()
    cell1 = row.insertCell()
    cell1.style.display = 'none'
    cell1.innerHTML = '<p>test</p>'

    section = table.createTFoot()
    row = section.insertRow()
    cell1 = row.insertCell()
    cell1.style.display = 'none'
    cell1.innerHTML = '<p>test</p>'

    const res = parseHtml(doc, table, dom.window)
    assert(res, 'Should have result')
    assert(res.head.length === 0, 'Should have no head cells')
    assert(res.body.length === 1, 'Should have one body cell')
    assert(res.foot.length === 0, 'Should have no foot cells')
  })

  it('empty table', () => {
    const table = dom.window.document.createElement('table')
    const res = parseHtml(doc, table, dom.window)
    assert(res, 'Should have result')
    assert(res.head.length === 0, 'Should have no head cells')
    assert(res.body.length === 0, 'Should have no body cells')
    assert(res.foot.length === 0, 'Should have no foot cells')
  })
})
