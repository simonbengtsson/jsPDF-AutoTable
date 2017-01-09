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
                fontFamily: "Times", // helvetica, times, courier
                borderColor: "rgba(0, 0, 0, 0)",
                fontStyle: 'italic',
                fontWeight: 'bold',
                backgroundColor: "rgba(240, 255, 255, 1)",
                color: "rgb(50, 50, 50)",
                textAlign: 'not supported',
                verticalAlign: 'top',
                fontSize: "16px",
                padding: "5px",
                borderWidth: "2px",
                height: "20px"
            }
        };
        global.window = window;

        
        let res = parseHtml('', false, true);
        console.log(res.body[0].styles);
        assert(res, 'Should have result');
        assert(!res.body[0].styles.lineColor, "Transparent color");
        assert(res.body[0].styles.fillColor, 'Parse color');
        assert(!res.body[0].styles.halign, 'Not supported value');
        assert(res.body[0].styles.valign === 'top', 'String value');
        assert.equal(res.body[0].styles.rowHeight, 20, 'Number value');
        assert(!res.body[0].cells[0].styles.rowHeight, 'Unnecessary styles');
        assert(res.body[0].cells[0].styles.cellPadding === 5, 'Cell styles');
        
        delete global.window;
    });
});