// https://stackoverflow.com/questions/30694428/jspdf-server-side-node-js-usage-using-node-jspdf

global.window = {
  document: {
    createElementNS: () => {
      return {}
    },
  },
}
global.navigator = {}
global.html2pdf = {}
global.btoa = () => {}

const fs = require('fs')
const jsPDF = require('jspdf')
require('jspdf-autotable')

const doc = new jsPDF()
doc.autoTable({
  head: [['ID', 'Name', 'Email', 'Country', 'IP-address']],
  body: [
    ['1', 'HelloäöüßÄÖÜ', 'dmoore0@furl.net', 'China', '211.56.242.221'],
    ['2', 'Janice', 'jhenry1@theatlantic.com', 'Ukraine', '38.36.7.199'],
    [
      '3',
      'Ruth',
      'rwells2@constantcontact.com',
      'Trinidad and Tobago',
      '19.162.133.184',
    ],
    ['4', 'Jason', 'jray3@psu.edu', 'Brazil', '10.68.11.42'],
    ['5', 'Jane', 'jstephens4@go.com', 'United States', '47.32.129.71'],
    ['6', 'Adam', 'anichols5@com.com', 'Canada', '18.186.38.37'],
  ],
})

const data = doc.output()

fs.writeFileSync('./document.pdf', data, 'binary')

delete global.window
delete global.navigator
delete global.btoa
delete global.html2pdf
