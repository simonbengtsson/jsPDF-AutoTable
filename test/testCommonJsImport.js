const assert = require('assert')
const { jsPDF } = require('jspdf')
const { applyPlugin } = require('jspdf-autotable')
const defaultAutoTableImport = require('jspdf-autotable')

describe('commonjs imports', () => {
    it('jspdf import checks', () => {
        assert.equal(typeof jsPDF, 'function')
        const doc = new jsPDF()
        assert.equal(typeof doc.text, 'function')
    })

    it('autotable prototype', () => {
        const doc = new jsPDF()
        assert.equal(typeof doc.autoTable, 'function')
    })

    it('applyPlugin', () => {
        jsPDF.API.autoTable = undefined

        assert.equal(typeof applyPlugin, 'function')

        const doc = new jsPDF()
        assert.equal(typeof doc.autoTable, 'undefined')
        applyPlugin(jsPDF)
        const doc2 = new jsPDF()
        assert.equal(typeof doc2.autoTable, 'function')
    })

    it('deprecated autoTable default import', () => {
        assert.equal(typeof defaultAutoTableImport.default, 'function')
    })
})