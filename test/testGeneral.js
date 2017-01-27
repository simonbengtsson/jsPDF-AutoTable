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

    it('setting defaults', function() {
        let doc = new jsPDF('p', 'pt');
        
        jsPDF.autoTableSetDefaults({margin: 15});
        doc.autoTable({head: [], body: []});
        assert.equal(doc.previousAutoTable.finalY, 15);
        
        doc.autoTableSetDefaults({margin: 10});
        doc.autoTable({head: [], body: []});
        assert.equal(doc.previousAutoTable.finalY, 10);
        
        jsPDF.autoTableSetDefaults({margin: 20});
        doc.autoTable({head: [], body: [], margin: 5});
        assert.equal(doc.previousAutoTable.finalY, 5);
        
        jsPDF.autoTableSetDefaults(null);
    });

    it('previous autotable', function() {
        let doc = new jsPDF('p', 'pt');
        let defaultMargin = 40;

        doc.autoTable([], []);
        assert.equal(Math.floor(doc.previousAutoTable.finalY), defaultMargin);

        doc.autoTable([], [[]]);
        assert.equal(Math.floor(doc.previousAutoTable.finalY), defaultMargin);
        
        doc.autoTable({head: [[]], body: [[]], foot: [[]]});
        assert.equal(Math.floor(doc.previousAutoTable.finalY), defaultMargin);
        doc.autoTable({head: [['head']], body: [['body']], foot: [['foot']]});
        
        let doc2 = new jsPDF('p', 'pt');
        assert.strictEqual(doc2.previousAutoTable, false);
        assert.strictEqual(doc2.previousAutoTable.finalY, undefined);
        assert.strictEqual(doc2.previousAutoTable.undedinedprop, undefined);
    });

    it('add page in hook', function() {
        let doc = new jsPDF();
        
        doc.autoTable({
            head: [['test']],
            body: [['test']],
            drawRow: function(row, data) {
                data.addPage();
            }
        });
        
        assert.equal(doc.internal.getCurrentPageInfo().pageNumber, 2)
    });
    
});