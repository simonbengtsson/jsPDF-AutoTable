"use strict";

var assert = require('assert');

// TODO
describe('input parser', function () {

    before(function() {
        global.window = {getComputedStyle: function() {return {display: 'visible'}}};
    });

    after(function() {
        delete global.window;
    });

    it('rowspan input', function () {
    });
    
    it('array input', function () {

    });

    it('limited input', function () {
        
    });

    it('object input', function () {

    });

    it('parse arguments', function () {

    });

});