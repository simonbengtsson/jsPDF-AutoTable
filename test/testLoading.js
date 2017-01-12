"use strict";

let MockBrowser = require('mock-browser').mocks.MockBrowser;
let describe = global.describe;
let it = global.it;
let before = global.before;
let after = global.after;

var assert = require('assert');

describe('lib loading', function () {
    
    before(function() {
        global.window = new MockBrowser().getWindow();
        global.navigator = {};
    });
    
    after(function() {
        delete global.navigator;
        delete global.window;
    });
    
    it('init', function() {
        var jsPDF = require('jspdf');
        require('../src/main');
        let doc = new jsPDF();
        assert(jsPDF && doc && typeof doc.autoTable === 'function');
        assert(typeof doc.autoTable.previous.someundfprop === 'undefined');
        doc.autoTable([], []);
        assert.equal(Math.round(doc.autoTable.previous.finalY), Math.round(doc.autoTable.previous.settings.margin.top));
        doc.autoTable(['header'], [['cell']], {
            drawRow: function(row, data) {
                data.addPage();
            }
        });
        assert.equal(doc.internal.getCurrentPageInfo().pageNumber, 2)
    });
    
});