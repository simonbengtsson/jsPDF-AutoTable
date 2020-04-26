// Limitations
// - No support for border spacing
// - No support for transparency
import { marginOrPadding, MarginPadding } from './common'
import { DocHandler } from './documentHandler'
import { Styles } from './config'

export function parseCss(
  doc: DocHandler,
  element: Element,
  scaleFactor: number
): Partial<Styles> {
  let result: Partial<Styles> = {}
  let style = window.getComputedStyle(element)

  let pxScaleFactor = 96 / 72

  let color = parseColor(element, 'backgroundColor')
  if (color != null) result.fillColor = color
  color = parseColor(element, 'color')
  if (color != null) result.textColor = color
  color = parseColor(element, 'borderTopColor')
  if (color != null) result.lineColor = color

  let padding = parsePadding(style, scaleFactor)
  if (padding) result.cellPadding = padding

  // style.borderWidth only works in chrome (borderTopWidth etc works in firefox and ie as well)
  let bw = parseInt(style.borderTopWidth || '')
  bw = bw / pxScaleFactor / scaleFactor
  if (bw) result.lineWidth = bw

  let accepted = ['left', 'right', 'center', 'justify']
  if (accepted.indexOf(style.textAlign) !== -1) {
    result.halign = style.textAlign as 'left' | 'right' | 'center' | 'justify'
  }
  accepted = ['middle', 'bottom', 'top']
  if (accepted.indexOf(style.verticalAlign) !== -1) {
    result.valign = style.verticalAlign as 'middle' | 'bottom' | 'top'
  }
  let res = parseInt(style.fontSize || '')
  if (!isNaN(res)) result.fontSize = res / pxScaleFactor
  let fontStyle = parseFontStyle(style)
  if (fontStyle) result.fontStyle = fontStyle

  const font = (style.fontFamily || '').toLowerCase()
  if (doc.getFontList()[font]) {
    result.font = font
  }

  return result
}

function parseFontStyle(style: any): '' | 'bold' | 'italic' | 'bolditalic' {
  let res = ''
  if (
    style.fontWeight === 'bold' ||
    style.fontWeight === 'bolder' ||
    parseInt(style.fontWeight) >= 700
  ) {
    res = 'bold'
  }
  if (style.fontStyle === 'italic' || style.fontStyle === 'oblique') {
    res += 'italic'
  }
  return res as '' | 'bold' | 'italic' | 'bolditalic'
}

type RgbColor = [number, number, number]
function parseColor(element: Element, colorProp: any): RgbColor | null {
  let cssColor = realColor(element, colorProp)

  if (!cssColor) return null

  var rgba = cssColor.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d*))?\)$/
  )
  if (!rgba || !Array.isArray(rgba)) {
    return null
  }

  var color: RgbColor = [
    parseInt(rgba[1]),
    parseInt(rgba[2]),
    parseInt(rgba[3]),
  ]
  var alpha = parseInt(rgba[4])

  if (alpha === 0 || isNaN(color[0]) || isNaN(color[1]) || isNaN(color[2])) {
    return null
  }

  return color
}

function realColor(elem: Element | null, colorProp: any): any {
  if (!elem) return null

  var bg = window.getComputedStyle(elem)[colorProp]
  if (
    bg === 'rgba(0, 0, 0, 0)' ||
    bg === 'transparent' ||
    bg === 'initial' ||
    bg === 'inherit'
  ) {
    return realColor(elem.parentElement, colorProp)
  } else {
    return bg
  }
}

function parsePadding(style: any, scaleFactor: number): null | MarginPadding {
  let val = [
    style.paddingTop,
    style.paddingRight,
    style.paddingBottom,
    style.paddingLeft,
  ]

  const pxScaleFactor = 96 / (72 / scaleFactor)
  const linePadding =
    (parseInt(style.lineHeight) - parseInt(style.fontSize)) / scaleFactor / 2

  const inputPadding = val.map((n) => {
    return parseInt(n) / pxScaleFactor
  })
  const padding = marginOrPadding(inputPadding, 0)
  if (linePadding > padding.top) {
    padding.top = linePadding
  }
  if (linePadding > padding.bottom) {
    padding.bottom = linePadding
  }
  return padding
}
