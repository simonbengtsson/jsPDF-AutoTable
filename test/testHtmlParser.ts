import { parseHtml } from '../src/htmlParser'
import { DocHandler } from '../src/documentHandler'
import { loadJspdf } from './common'
const assert = require('assert')
const jsdom = require('jsdom')
const dom = new jsdom.JSDOM('')
const jsPDF = loadJspdf()

describe('html parser', () => {
  it('full table', () => {
    const doc = new DocHandler(new jsPDF())
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
    const doc = new DocHandler(new jsPDF())
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
    const doc = new DocHandler(new jsPDF())
    const table = dom.window.document.createElement('table')
    const res = parseHtml(doc, table, dom.window)
    assert(res, 'Should have result')
    assert(res.head.length === 0, 'Should have no head cells')
    assert(res.body.length === 0, 'Should have no body cells')
    assert(res.foot.length === 0, 'Should have no foot cells')
  })

  it('autoTableHtmlToJson', () => {
    ;(global as any).window = dom.window
    ;(global as any).HTMLTableElement = dom.window.HTMLTableElement
    const table = dom.window.document.createElement('table')
    let body = table.createTBody()
    let brow = body.insertRow()
    brow.insertCell().textContent = 'body'
    brow.insertCell().textContent = 'body 2'
    let head = table.createTHead()
    let hrow = head.insertRow()
    hrow.insertCell().textContent = 'head'
    hrow.insertCell().outerHTML = '<th>th</th>'
    const doc = new jsPDF()
    const res = doc.autoTableHtmlToJson(table)
    assert.equal(res.data[0].length, 2, 'Should have body cell')
    assert.equal(res.columns.length,  2, 'Should have columns cell')
    assert.equal(res.data[0][0].content, 'body', 'Should have body content')
    assert.equal(res.columns[0], 'head', 'Should have head content')
  })
})
