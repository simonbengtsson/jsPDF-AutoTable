// Below is an example using the jspdf nodejs dist files. But you can
// also use the default jsPDF by mocking out browser apis like in this example.
// https://stackoverflow.com/questions/30694428/jspdf-server-side-node-js-usage-using-node-jspdf

// Build issue requires a dummy window object at top level in jspdf 1.5.3
global.window = {}

const fs = require('fs')
const jsPDF = require('jspdf/dist/jspdf.node.debug')

// If you are not importing jsPDF with require('jspdf')
// you can apply the AutoTable plugin to any jsPDF with the
// applyPlugin function.
const { applyPlugin } = require('../../dist/jspdf.plugin.autotable')
applyPlugin(jsPDF)

const doc = new jsPDF()
doc.autoTable({
  head: [['ID', 'Name', 'Email', 'Country', 'IP-address']],
  body: [
    ['1', 'HelloäöüßÄÖÜ', 'dmoore0@furl.net', 'China', '211.56.242.221'],
    ['2', 'Janice', 'jhenry1@theatlantic.com', 'Ukraine', '38.36.7.199'],
    ['3', 'Ruth', 'rwells2@example.com', 'Trinidad', '19.162.133.184'],
    ['4', 'Jason', 'jray3@psu.edu', 'Brazil', '10.68.11.42'],
    ['5', 'Jane', 'jstephens4@go.com', 'United States', '47.32.129.71'],
    ['6', 'Adam', 'anichols5@com.com', 'Canada', '18.186.38.37'],
  ],
})

const data = doc.output()
fs.writeFileSync('./document.pdf', data, 'binary')
