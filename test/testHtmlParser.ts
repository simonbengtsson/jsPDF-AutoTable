import { Window } from 'happy-dom'
import { jsPDF } from 'jspdf'
import assert from 'node:assert'
import { applyPlugin } from '../src/applyPlugin'
import { DocHandler } from '../src/documentHandler'
import { parseHtml } from '../src/htmlParser'

const window = new Window()

applyPlugin(jsPDF)

function createTable() {
  const table = window.document.createElement('table')
  window.document.body.appendChild(table)
  return table
}

describe('html parser', () => {
  it('full table', () => {
    const doc = new DocHandler(new jsPDF())
    const table = createTable()
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

    const res = parseHtml(doc, table as any, window as any)
    assert(res, 'Should have result')
    assert(res.head[0].length, 'Should have head cell')
    assert.equal(res.body[0].length, 2, 'Should have two body cells')
    assert(res.foot[0].length, 'Should have foot cell')
  })

  it('cloned table', () => {
    const doc = new DocHandler(new jsPDF())
    const table = createTable()
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

    const res = parseHtml(doc, table.cloneNode(true) as any, window as any)
    assert(res, 'Should have result')
    assert(res.head[0].length, 'Should have head cell')
    assert.equal(res.body[0].length, 2, 'Should have two body cells')
    assert(res.foot[0].length, 'Should have foot cell')
  })

  it('hidden content', () => {
    const doc = new DocHandler(new jsPDF())
    const table = createTable()
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

    const res = parseHtml(doc, table as any, window as any)
    assert(res, 'Should have result')
    assert(res.head.length === 0, 'Should have no head cells')
    assert(res.body.length === 1, 'Should have one body cell')
    assert(res.foot.length === 0, 'Should have no foot cells')
  })

  it('empty table', () => {
    const doc = new DocHandler(new jsPDF())
    const table = createTable()
    const res = parseHtml(doc, table as any, window as any)
    assert(res, 'Should have result')
    assert(res.head.length === 0, 'Should have no head cells')
    assert(res.body.length === 0, 'Should have no body cells')
    assert(res.foot.length === 0, 'Should have no foot cells')
  })

  it('autoTableHtmlToJson', () => {
    ; (global as any).window = window
      ; (global as any).HTMLTableElement = window.HTMLTableElement
    const table = createTable()
    let body = table.createTBody()
    let brow = body.insertRow()
    brow.insertCell().textContent = 'body'
    brow.insertCell().textContent = 'body 2'
    let head = table.createTHead()
    let hrow = head.insertRow()
    hrow.innerHTML = '<td>head</td><th>th</th>'
    const doc: any = new jsPDF()
    const res = doc.autoTableHtmlToJson(table)
    assert.equal(res.data[0].length, 2, 'Should have body cell')
    assert.equal(res.columns.length, 2, 'Should have columns cell')
    assert.equal(res.data[0][0].content, 'body', 'Should have body content')
    assert.equal(res.columns[0], 'head', 'Should have head content')
  })

  it('autoTableHtmlToJson should work with tables without head', () => {
    ; (global as any).window = window
      ; (global as any).HTMLTableElement = window.HTMLTableElement
    const table = createTable()
    let body = table.createTBody()
    let brow = body.insertRow()
    brow.insertCell().textContent = 'body'
    brow.insertCell().textContent = 'body 2'
    const doc: any = new jsPDF()
    const res = doc.autoTableHtmlToJson(table)
    assert.equal(res.data[0].length, 2, 'Should have body cell')
    assert.equal(res.data[0][0].content, 'body', 'Should have body content')
    assert.equal(res.columns.length, 0, 'Should have empty head columns array')
  })
})
