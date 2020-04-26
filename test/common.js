
module.exports.loadJspdf = () => {
  global.window = {
    document: {
      createElementNS: function () {
        return {}
      },
    },
  }
  global.navigator = {}
  global.html2pdf = {}

  const jsPDF = require('jspdf')

  delete global.window
  delete global.navigator
  delete global.html2pdf

  return jsPDF
}