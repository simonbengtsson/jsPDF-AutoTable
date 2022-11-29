/*
This typescript example is written as a node script (use "npx ts-node index.ts" to execute)
but the same code can be used in any browser setup etc as long as it supports
node module resolution
*/
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const doc = new jsPDF()
autoTable(doc, {
  head: [['ID', 'Country', 'Index', 'Capital']],
  body: [
    [1, 'Finland', 7.632, 'Helsinki'],
    [2, 'Norway', 7.594, 'Oslo'],
    [3, 'Denmark', 7.555, 'Copenhagen'],
    [4, 'Iceland', 7.495, 'Reykjavík'],
    [5, 'Switzerland', 7.487, 'Bern'],
    [9, 'Sweden', 7.314, 'Stockholm'],
    [73, 'Belarus', 5.483, 'Minsk'],
  ],
})

doc.save('table.pdf')
console.log('./table.pdf generated')
