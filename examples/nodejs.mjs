import { jsPDF } from 'jspdf'
import { autoTable } from '../dist/jspdf.plugin.autotable.js'

const doc = new jsPDF()
autoTable(doc, {
  columns: ['Name', 'Email', 'Phone'],
  body: [
    ['John Doe', 'john@doe.com', '1234567890'],
    ['Jane Doe', 'jane@doe.com', '0987654321'],
  ],
})

doc.save('table.pdf')
