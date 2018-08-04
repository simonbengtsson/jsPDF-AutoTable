"use strict";

let describe = global.describe;
let it = global.it;
let before = global.before;
let after = global.after;

var assert = require('assert');
let validateInput = require('../src/inputValidator');

describe('input parser', function () {
    
    before(() => {
        
    });

    after(() => {
    });

    it('empty input', () => {
        validateInput({});
    });

});