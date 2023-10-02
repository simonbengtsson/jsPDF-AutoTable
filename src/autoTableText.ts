import { jsPDFDocument } from './documentHandler'

/**
 * Improved text function with halign and valign support
 * Inspiration from: http://stackoverflow.com/questions/28327510/align-text-right-using-jspdf/28433113#28433113
 */
export default function (
  text: string | string[],
  x: number,
  y: number,
  styles: TextStyles,
  doc: jsPDFDocument
) {
  styles = styles || {}
  const PHYSICAL_LINE_HEIGHT = 1.15

  const k = doc.internal.scaleFactor
  const fontSize = doc.internal.getFontSize() / k
  const lineHeightFactor = doc.getLineHeightFactor ? doc.getLineHeightFactor() : PHYSICAL_LINE_HEIGHT
  const lineHeight = fontSize * lineHeightFactor

  const splitRegex = /\r\n|\r|\n/g
  let splitText: string | string[] = ''
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
  y += fontSize * (2 - PHYSICAL_LINE_HEIGHT)

  if (styles.valign === 'middle')
    y -= (lineCount / 2) * lineHeight
  else if (styles.valign === 'bottom')
    y -= lineCount * lineHeight

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
        y += lineHeight
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

export interface TextStyles {
  valign?: 'middle' | 'bottom' | 'top'
  halign?: 'justify' | 'center' | 'right' | 'left'
  maxWidth?: number
}
