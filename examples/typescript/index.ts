import jsPDF = require('jspdf')
import autoTable from 'jspdf-autotable'

const head = [['ID', 'Country', 'Index', 'Capital']]
const data = [
  [1, 'Finland', 7.632, 'Helsinki'],
  [2, 'Norway', 7.594, 'Oslo'],
  [3, 'Denmark', 7.555, 'Copenhagen'],
  [4, 'Iceland', 7.495, 'Reykjavík'],
  [5, 'Switzerland', 7.487, 'Bern'],
  [9, 'Sweden', 7.314, 'Stockholm'],
  [73, 'Belarus', 5.483, 'Minsk'],
]

const doc = new jsPDF()
autoTable(doc, {
  head: head,
  body: data,
  didDrawCell: (data) => {
    console.log(data.column.index)
  },
})

doc.save('table.pdf')
