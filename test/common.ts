export function loadJspdf() {
  ;(global as any).window = {
    document: {
      createElementNS: function () {
        return {}
      },
    },
  }
  ;(global as any).navigator = {}
  ;(global as any).html2pdf = {}

  const jsPDF = require('jspdf')

  delete (global as any).window
  delete (global as any).navigator
  delete (global as any).html2pdf

  return jsPDF
}
