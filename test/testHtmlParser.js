"use strict";

let describe = global.describe;
let it = global.it;
let before = global.before;
let after = global.after;

var assert = require('assert');
let parseHtml = require('../src/htmlParser').parseHtml;

describe('html parser', function () {
    before(function() {
        global.window = {getComputedStyle: function() {return {display: 'visible'}}};
    });

    after(function() {
        delete global.window;
    });

    it('full table', function () {
        var table = {
            tHead: {rows: [{cells: [{innerText: 'test'}]}]},
            tBodies: [{rows: [{cells: [{innerText: 'test'}, {innerText: 'test'}]}]}],
            tFoot: {rows: [{cells: [{innerText: 'test'}]}]}
        };
        let res = parseHtml(table);
        assert(res, 'Should have result');
        assert(res.head[0].length, 'Should have head cell');
        assert.equal(res.body[0].length, 2, 'Should have two body cells');
        assert(res.foot[0].length, 'Should have foot cell');

    });

    it('hidden content', function () {
        var table = {
            tHead: {rows: [{cells: [{innerText: 'test'}]}]},
            tBodies: [{rows: [{cells: [{innerText: 'test'}]}]}],
            tFoot: {rows: [{cells: [{innerText: 'test'}]}]}
        };
        global.window = {getComputedStyle: function() {return {display: 'none'}}};
        let res = parseHtml(table);
        assert(res, 'Should have result');
        assert(res.head.length === 0, 'Should have no head cells');
        assert(res.body.length === 0, 'Should have no body cell');
        assert(res.foot.length === 0, 'Should have no foot cells');
    });

    it('empty table', function () {
        var table = {
            tHead: {rows: [{cells: []}]},
            tBodies: [{rows: [{cells: []}]}],
            tFoot: {rows: [{cells: []}]}
        };

        let res = parseHtml(table);
        assert(res, 'Should have result');
        assert(res.head.length === 0, 'Should have no head cells');
        assert(res.body.length === 0, 'Should have no body cells');
        assert(res.foot.length === 0, 'Should have no foot cells');
    });
});