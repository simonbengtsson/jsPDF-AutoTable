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
    assert.equal(styles.lineWidth, 2 / pxScaleFactor, 'Line width')
    assert(styles.fontSize === 16 / pxScaleFactor, 'No font size')
  })

  it('minimal styles', () => {
    let element = table.insertRow()
    const styles = parseCss([], element, 1, element.style, dom.window)
    assert(styles, 'Should have result')
    assert(!styles.fillColor, 'Transparent')
    assert(!styles.halign, 'Empty string halign')
    assert(!styles.valign, 'Empty tring valign')
    assert(!(styles as any).cellPadding?.top, 'Empty string padding')
    assert(!styles.fontStyle, 'No font style')
  })
})
