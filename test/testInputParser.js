"use strict";

let MockBrowser = require('mock-browser').mocks.MockBrowser;
let describe = global.describe;
let it = global.it;

var assert = require('assert');

describe('input parser', function () {
    
    describe('html input', function() {
        it.skip('from html', function () {
            let window = new MockBrowser().getWindow();
            window.document.querySelector = function () { return null; };
            window.getComputedStyle = function () {return {} };
            global.window = window;
            
            var parseInput = require('../src/inputParser').parseInput;
            var table = parseInput({}, {fromHtml: 'none-existing'});
            assert(!table, 'None existing table');

            var htmlTable = window.document.createElement('table');
            var row = table.insertRow(0);
            let cell = row.insertCell(0);
            cell.innerHTML = 'html';

            table = parseInput({}, {fromHtml: htmlTable});
            assert(table && table.body[0].cells[0].content === 'html', 'fromHtml');

            table = parseInput({}, {head: [], body: [['js']], foot: [], fromHtml: htmlTable});
            assert(table.body[0].cells[0].content === 'js', 'Prefer specified content to parsed html');
            
            delete global.window;
        });
    });
    
    it.skip('Limited input', function () {
        let parseInput = require('../src/inputParser').parseInput;
        
        var table = parseInput({});
        assert(!table, 'No content provided');

        table = parseInput(doc, {columns: [], head: [], body: [], foot: [], fromHtml: null});
        assert(!table, 'No columns');

        table = parseInput(doc, {head: [], body: [], foot: []});
        assert(!table, 'No content');

        table = parseInput(doc, {columns: ['test']});
        assert(!table, 'Column without content');

        table = parseInput(doc, {head: [], body: [['test']], foot: []});
        assert(table.columns.length === 1, 'Single column');
        assert(table.body.length && table.body[0].cells.length === 1, 'Single cell');

        table = parseInput({head: ['test'], foot: ['test']});
        assert(table.columns.length === 1, 'Single column');
        assert(table.head.length && table.body[0].cells.length === 1, 'Single head cell');
        assert(table.foot.length && table.foot[0].cells.length === 1, 'Single foot cell');
    });

});