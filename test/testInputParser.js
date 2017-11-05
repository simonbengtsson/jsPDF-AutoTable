"use strict";

var assert = require('assert');
var parseInput = require('../src/inputParser').parseInput;
var state = require('../src/state');

describe('input parser', function () {

    before(function() {
        this.timeout(5000);
        global.window = {document: {createElementNS: function() {return {}}}};
        global.navigator = {};
        let jsPDF = require('jspdf');
        require('../src/main');
        state.setupState(new jsPDF());
    });

    after(function() {
        state.resetState();
    });
    
    it('array input', function () {
        let table = parseInput([{head: [['test', 'test']], body: [['test', 'test'], ['test', 'test']]}]);
        assert(table, 'Has table');
        assert.equal(table.head.length, 1);
        assert.equal(table.body.length, 2);
        assert.equal(table.foot.length, 0);
        assert.equal(Object.keys(table.head[0].cells).length, 2);
        assert.equal(table.head[0].cells[0].text, 'test');
        assert(table.head[0].cells[0].minWidth > 0);
    });

    it('object input', function () {
        let table = parseInput([{head: [{id: 'ID', name: 'Name', email: 'Email', city: 'City', expenses: 'Expenses'}]}]);
        assert.equal(table.head[0].cells['id'].text, 'ID');
    });

    it('object input', function () {
        let table = parseInput([{head: [[{content: 'test'}, 'test 2']], body: [['body', 'test'], ['test', 'test']]}]);
        assert.equal(table.head[0].cells[0].text, 'test');
        assert.equal(table.head[0].cells[1].text, 'test 2');
        assert.equal(table.body[0].cells[0].text, 'body');
    });

    it('rowspan input', function () {
        
    });

    it('limited input', function () {
        
    });

    it('parse arguments', function () {

    });

});