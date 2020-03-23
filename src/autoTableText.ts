/**
 * Improved text function with halign and valign support
 * Inspiration from: http://stackoverflow.com/questions/28327510/align-text-right-using-jspdf/28433113#28433113
 */
export default function (text, x, y, styles, doc) {
  styles = styles || {}
  let FONT_ROW_RATIO = 1.15

  if (typeof x !== 'number' || typeof y !== 'number') {
    console.error(
      'The x and y parameters are required. Missing for text: ',
      text
    )
  }
  let k = doc.internal.scaleFactor
  let fontSize = doc.internal.getFontSize() / k

  let splitRegex = /\r\n|\r|\n/g
  let splitText = null
  let lineCount = 1
  if (
    styles.valign === 'middle' ||
    styles.valign === 'bottom' ||
    styles.halign === 'center' ||
    styles.halign === 'right'
  ) {
    splitText = typeof text === 'string' ? text.split(splitRegex) : text
    lineCount = splitText.length || 1
  }

  // Align the top
  y += fontSize * (2 - FONT_ROW_RATIO)

  if (styles.valign === 'middle')
    y -= (lineCount / 2) * fontSize * FONT_ROW_RATIO
  else if (styles.valign === 'bottom')
    y -= lineCount * fontSize * FONT_ROW_RATIO

  if (styles.halign === 'center' || styles.halign === 'right') {
    let alignSize = fontSize
    if (styles.halign === 'center') alignSize *= 0.5

    if (splitText && lineCount >= 1) {
      for (let iLine = 0; iLine < splitText.length; iLine++) {
        doc.text(
          splitText[iLine],
          x - doc.getStringUnitWidth(splitText[iLine]) * alignSize,
          y
        )
        y += fontSize * FONT_ROW_RATIO
      }
      return doc
    }
    x -= doc.getStringUnitWidth(text) * alignSize
  }

  if (styles.halign === 'justify') {
    doc.text(text, x, y, {
      maxWidth: styles.maxWidth || 100,
      align: 'justify',
    })
  } else {
    doc.text(text, x, y)
  }

  return doc
}
