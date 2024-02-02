// Fix for https://github.com/simonbengtsson/jsPDF-AutoTable/runs/3567913815
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

import { parseHtml } from '../src/htmlParser'
import { DocHandler } from '../src/documentHandler'
import { jsPDF } from 'jspdf'
import * as assert from 'assert'
import { JSDOM } from 'jsdom'
const dom = new JSDOM('')

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

  it('cloned table', () => {
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

    const res = parseHtml(
      doc,
      table.cloneNode(true) as HTMLTableElement,
      dom.window,
    )
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
})
