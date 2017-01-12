"use strict";

let describe = global.describe;
let it = global.it;

let MockBrowser = require('mock-browser').mocks.MockBrowser;
var assert = require('assert');
let parseHtml = require('../src/htmlParser').parseHtml;

describe('html parser', function () {

    it('Full table', function () {
        let window = new MockBrowser().getWindow();
        global.window = window;
        
        var table = window.document.createElement('table');
        var row = table.insertRow(0);

        table.createTHead();
        let h = table.tHead.insertRow(0);
        let hc = h.insertCell(0);
        hc.innerHTML = 'head';

        let cell = row.insertCell(0);
        cell.innerHTML = 'test';
        cell = row.insertCell(0);
        cell.innerHTML = 'test';

        table.createTFoot();
        let f = table.tFoot.insertRow(0);
        let fc = f.insertCell(0);
        fc.innerHTML = 'foot';

        let res = parseHtml(table, window);
        assert(res, 'Should have result');
        assert(res.head.length && res.head[0].cells.length, 'Should have head cell');
        assert.equal(res.body.length && res.body[0].cells.length, 2, 'Should have two body cells');
        assert(res.foot.length && res.foot[0].cells.length, 'Should have foot cell');

        delete global.window;
    });

    it('Table with hidden column', function () {
        let window = new MockBrowser().getWindow();
        global.window = window;
        var table = window.document.createElement('table');
        var row = table.insertRow(0);

        let cell = row.insertCell(0);
        cell.style.display = 'none';
        cell.innerHTML = 'Test';
        cell = row.insertCell(0);
        cell.innerHTML = 'Test2';

        let res = parseHtml(table, window);
        assert(res, 'Should have result');
        assert(res.head.length === 0, 'Should have no head cells');
        assert(res.body.length === 1, 'Should have one body cell');
        assert(res.foot.length === 0, 'Should have no foot cells');

        delete global.window;
    });

    it('Empty table', function () {
        let window = new MockBrowser().getWindow();
        global.window = window;
        var table = window.document.createElement('table');
        table.insertRow(0);
        table.createTHead();
        table.createTFoot();
        table.tHead.insertRow(0);
        table.tFoot.insertRow(0);

        let res = parseHtml(table, window);
        assert(res, 'Should have result');
        assert(res.head.length === 0, 'Should have no head cells');
        assert(res.body.length === 0, 'Should have no body cells');
        assert(res.foot.length === 0, 'Should have no foot cells');

        delete global.window;
    });

    it('Table styles', function () {
        let window = new MockBrowser().getWindow();
        window.document.querySelector = function () {
            let table = window.document.createElement('table');
            let row = table.insertRow(0);
            row.insertCell(0);
            return table;
        };
        
        window.getComputedStyle = function () {
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
                borderWidth: "2px",
            }
        };
        global.window = window;
        
        let res = parseHtml('', false, true);
        assert(res, 'Should have result');
        assert(!res.body[0].styles.lineColor, "Transparent color");
        assert(res.body[0].styles.fillColor, 'Parse color');
        assert(res.body[0].styles.halign === 'center', 'Horizontal align');
        assert(res.body[0].styles.valign === 'top', 'String value');
        assert(res.body[0].cells[0].styles.cellPadding === 5, 'Cell padding');
        assert(res.body[0].cells[0].styles.lineWidth === 2, 'Line width');

        window.getComputedStyle = function () {
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
        };

        res = parseHtml('', true, true);
        assert(res, 'Should have result');
        assert(!res.body[0].styles.fillColor, 'Transparent');
        assert(!res.body[0].styles.halign, 'Empty string halign');
        assert(!res.body[0].styles.valign, 'Empty tring valign');
        assert(!res.body[0].cells[0].styles.cellPadding, 'Empty string padding');
        assert(!res.body[0].cells[0].styles.fontStyle, 'No font style');
        assert(!res.body[0].cells[0].styles.fontSize, 'No font size');
        
        res = parseHtml('', true, false);
        assert(!Object.keys(res.body[0].styles).length, 'Should have no styles result');
        res = parseHtml('', false, false);
        assert(!res.body.length, 'Should have no body result');
        
        delete global.window;
    });
});