// Fix for https://github.com/simonbengtsson/jsPDF-AutoTable/runs/3567913815
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

import { parseCss } from '../src/cssParser'
const assert = require('assert')
const jsdom = require('jsdom')
const dom = new jsdom.JSDOM('')
const table = dom.window.document.createElement('table')

describe('css parser', () => {
  it('normal styles', () => {
    const style = {
      fontFamily: 'Times',
      borderColor: 'rgba(0, 0, 0, 0)',
      fontStyle: 'italic',
      fontWeight: 'bold',
      backgroundColor: 'rgba(240, 255, 255, 1)',
      color: 'rgb(50, 50, 50)',
      textAlign: 'center',
      verticalAlign: 'top',
      fontSize: '16px',
      paddingTop: '5px',
      paddingLeft: '5px',
      paddingRight: '5px',
      paddingBottom: '5px',
      borderTopWidth: '2px',
      borderBottomWidth: '2px',
      borderLeftWidth: '2px',
      borderRightWidth: '2px',
    }
    const pxScaleFactor = 96 / 72
    let element = table.insertRow()
    for (const [prop, value] of Object.entries(style)) {
      element.style[prop] = value
    }
    const styles = parseCss([], element, 1, element.style, dom.window)
    assert(styles, 'Should have result')
    assert(!styles.lineColor, 'Transparent color')
    assert(styles.fillColor, 'Parse color')
    assert(styles.halign === 'center', 'Horizontal align')
    assert(styles.valign === 'top', 'String value')
    assert.equal(
      (styles as any).cellPadding.top,
      5 / pxScaleFactor,
      'Cell padding'
    )
    assert.equal(typeof styles.lineWidth, 'number', 'Line width number')
    assert.equal(styles.lineWidth, 2 / pxScaleFactor, 'Line width')
    assert(styles.fontSize === 16 / pxScaleFactor, 'No font size')
  })

  it('individual border sides', () => {
    const style = {
      borderRightWidth: '2px',
      borderBottomWidth: '3px',
      borderLeftWidth: '4px',
    }
    const pxScaleFactor = 96 / 72
    const scaleFactor = 2
    let element = table.insertRow()
    for (const [prop, value] of Object.entries(style)) {
      element.style[prop] = value
    }
    const styles = parseCss([], element, scaleFactor, element.style, dom.window)
    assert.equal(typeof styles.lineWidth, 'object', 'Line width object')
    assert.deepStrictEqual(styles.lineWidth, {
      top: 0,
      right: 2 / pxScaleFactor / scaleFactor,
      bottom: 3 / pxScaleFactor / scaleFactor,
      left: 4 / pxScaleFactor / scaleFactor,
    }, 'Line widths')
  })

  it('minimal styles', () => {
    let element = table.insertRow()
    const styles = parseCss([], element, 1, element.style, dom.window)
    assert(styles, 'Should have result')
    assert.strictEqual(styles.fillColor, undefined, 'Transparent')
    assert(styles.halign == null, 'Empty string halign')
    assert(styles.valign == null, 'Empty tring valign')
    assert((styles as any).cellPadding?.top == 0, 'Empty string padding')
    assert(styles.fontStyle == null, 'No font style')
  })
})
