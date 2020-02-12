'use strict'

let describe = global.describe
let it = global.it

var assert = require('assert')
let parseCss = require('../src/cssParser').parseCss
var state = require('../src/state')

describe('css parser', function() {
  before(function() {
    this.timeout(5000)
    global.window = {
      document: {
        createElementNS: function() {
          return {}
        },
      },
    }
    global.navigator = {}
    let jsPDF = require('jspdf')
    require('../src/main')
    state.setupState(new jsPDF())
  })

  after(function() {
    state.resetState()
  })

  it('normal styles', function() {
    global.window = {
      getComputedStyle: function() {
        return {
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
      },
    }

    let pxScaleFactor = 96 / 72
    let styles = parseCss({}, 1)
    console.log(styles)
    assert(styles, 'Should have result')
    assert(!styles.lineColor, 'Transparent color')
    assert(styles.fillColor, 'Parse color')
    assert(styles.halign === 'center', 'Horizontal align')
    assert(styles.valign === 'top', 'String value')
    assert.equal(styles.cellPadding.top, 5 / pxScaleFactor, 'Cell padding')
    assert.equal(styles.lineWidth, 2 / pxScaleFactor, 'Line width')
    assert(styles.fontSize === 16 / pxScaleFactor, 'No font size')

    delete global.window
  })

  it('minimal styles', function() {
    global.window = {
      getComputedStyle: function() {
        return {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          textAlign: 'baseline',
          verticalAlign: 'start',
          paddingTop: '0px',
          paddingLeft: '0px',
          paddingRight: '0px',
          paddingBottom: '0px',
          fontStyle: 'normal',
          fontWeight: 'normal',
          borderWidth: '0px',
          display: 'none',
        }
      },
    }

    let styles = parseCss({}, 1)
    assert(styles, 'Should have result')
    assert(!styles.fillColor, 'Transparent')
    assert(!styles.halign, 'Empty string halign')
    assert(!styles.valign, 'Empty tring valign')
    assert(!styles.cellPadding.top, 'Empty string padding')
    assert(!styles.fontStyle, 'No font style')

    delete global.window
  })
})
