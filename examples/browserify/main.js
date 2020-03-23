var jsPDF = require('jspdf')
require('jspdf-autotable')

document.getElementById('pdf-button').onclick = function () {
  generatePdf()
}

function generatePdf() {
  var doc = new jsPDF()
  doc.autoTable({
    head: [['ID', 'Country', 'Rank', 'Capital']],
    body: [
      [1, 'Denmark', 7.526, 'Copenhagen'],
      [2, 'Switzerland', 7.509, 'Bern'],
      [3, 'Iceland', 7.501, 'Reykjavík'],
      [4, 'Norway', 7.498, 'Oslo'],
      [5, 'Finland', 7.413, 'Helsinki'],
    ],
  })
  doc.save('table.pdf')
}
