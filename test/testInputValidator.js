"use strict";

let describe = global.describe;
let it = global.it;
let before = global.before;
let after = global.after;

var assert = require('assert');
global.html2pdf = {}
global.URL = {}
let validateInput = require('../src/inputValidator').default;

describe('input parser', function () {
    
    before(() => {
        
    });

    after(() => {
    });

    it('empty input', () => {
        validateInput({});
    });

});