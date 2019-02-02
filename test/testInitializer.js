"use strict";

let describe = global.describe;
let it = global.it;
let before = global.before;
let after = global.after;

var assert = require('assert');

describe('execution', function () {
    
    let jsPDF = null;
    
    before(function() {
        this.timeout(5000);
        global.window = {document: {createElementNS: function() {return {}}}};
        global.navigator = {};
        jsPDF = require('jspdf');
        require('../src/main');
    });
    
    after(function() {
        delete global.navigator;
        delete global.window;
    });

    it('init', function() {
        let doc = new jsPDF();
        assert.equal(typeof doc.autoTable, 'function');
    });

    it('state', function() {
        let state = require('../src/state');
        state.setupState({internal: {scaleFactor: 1.5}});
        assert.equal(state.default().scaleFactor(), 1.5);
        state.resetState();
        assert.equal(state.default(), null);
        
        state.setDefaults({margin: 10});
        assert.equal(state.getGlobalOptions().margin, 10);

        let firstDocument = {internal: {scaleFactor: 1.5}};
        state.setupState(firstDocument);
        state.setDefaults({margin: 15}, firstDocument);
        assert.equal(state.getDocumentOptions().margin, 15);
        state.resetState();
        
        let secondDocument = {internal: {scaleFactor: 2}};
        state.setupState(secondDocument);
        assert.equal(state.getDocumentOptions().margin, null);
    });
    
    it('concurrent tables', function() {
        let doc = new jsPDF('p', 'pt');
        doc.autoTable({
            tableId: 'first',
            margin: 10,
            body: [['Test first']],
            eventHandler: function(event) {
                if (event.name === 'addingCell') {
                    let d = new jsPDF();
                    d.autoTable({
                        body: [['Test second']],
                        tableId: 'second',
                        margin: 20,
                    });
                    assert.equal(d.previousAutoTable.id, 'second');
                    assert.equal(d.previousAutoTable.margin('top'), 20);
                }
                assert.equal(event.table.margin('top'), 10);
                assert.equal(event.table.id, 'first');
            }
        });
        assert.equal(doc.previousAutoTable.id, 'first');
        assert.equal(doc.previousAutoTable.margin('top'), 10);
    });

    it('add page in hook', function() {
        let doc = new jsPDF();
        
        doc.autoTable({
            head: [],
            body: [['test']],
            willDrawCell: function(data) {
                doc.addPage();
            }
        });
        
        assert.equal(doc.internal.getCurrentPageInfo().pageNumber, 2)
    });
    
});