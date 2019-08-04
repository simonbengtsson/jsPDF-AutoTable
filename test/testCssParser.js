"use strict";

let describe = global.describe;
let it = global.it;

var assert = require('assert');
let parseCss = require('../src/cssParser').parseCss;

describe('css parser', function () {
    
    it('normal styles', function () {
        global.window = {getComputedStyle: function () {
            return {
                fontFamily: "Times",
                borderColor: "rgba(0, 0, 0, 0)",
                fontStyle: 'italic',
                fontWeight: 'bold',
                backgroundColor: "rgba(240, 255, 255, 1)",
                color: "rgb(50, 50, 50)",
                textAlign: 'center',
                verticalAlign: 'top',
                fontSize: "16px",
                padding: "5px",
                borderTopWidth: "2px",
            }
        }};

        let pxScaleFactor =  96 / 72;
        let styles = parseCss({}, 1);
        assert(styles, 'Should have result');
        assert(!styles.lineColor, "Transparent color");
        assert(styles.fillColor, 'Parse color');
        assert(styles.halign === 'center', 'Horizontal align');
        assert(styles.valign === 'top', 'String value');
        assert.equal(styles.cellPadding.top, 5 / pxScaleFactor, 'Cell padding');
        assert.equal(styles.lineWidth, 2 / pxScaleFactor, 'Line width');

        delete global.window;
    });

    it('minimal styles', function () {
        global.window = {getComputedStyle: function () {
            return {
                backgroundColor: "transparent",
                textAlign: '',
                verticalAlign: '',
                padding: "",
                fontStyle: 'normal',
                fontWeight: 'normal',
                fontSize: "",
                borderWidth: "",
                display: 'none'
            }
        }};

        let styles = parseCss({}, 1);
        assert(styles, 'Should have result');
        assert(!styles.fillColor, 'Transparent');
        assert(!styles.halign, 'Empty string halign');
        assert(!styles.valign, 'Empty tring valign');
        assert(!styles.cellPadding, 'Empty string padding');
        assert(!styles.fontStyle, 'No font style');
        assert(!styles.fontSize, 'No font size');
        
        delete global.window;
    });
});