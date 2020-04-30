// Limitations
// - No support for border spacing
// - No support for transparency
import { parseSpacing, MarginPadding } from './common'
import { Styles } from './config'

export function parseCss(
  supportedFonts: string[],
  element: Element,
  scaleFactor: number,
  style: CSSStyleDeclaration,
  window: Window
): Partial<Styles> {
  const result: Partial<Styles> = {}

  const pxScaleFactor = 96 / 72

  let color = parseColor(element, (elem) => {
    return window.getComputedStyle(elem)['backgroundColor']
  })
  if (color != null) result.fillColor = color
  color = parseColor(element, (elem) => {
    return window.getComputedStyle(elem)['color']
  })
  if (color != null) result.textColor = color
  color = parseColor(element, (elem) => {
    return window.getComputedStyle(elem)['borderTopColor']
  })
  if (color != null) result.lineColor = color

  const padding = parsePadding(style, scaleFactor)
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
  const res = parseInt(style.fontSize || '')
  if (!isNaN(res)) result.fontSize = res / pxScaleFactor
  const fontStyle = parseFontStyle(style)
  if (fontStyle) result.fontStyle = fontStyle

  const font = (style.fontFamily || '').toLowerCase()
  if (supportedFonts.indexOf(font) !== -1) {
    result.font = font
  }

  return result
}

function parseFontStyle(
  style: CSSStyleDeclaration
): '' | 'bold' | 'italic' | 'bolditalic' {
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
function parseColor(
  element: Element,
  styleGetter: (elem: Element) => string
): RgbColor | null {
  const cssColor = realColor(element, styleGetter)
  if (!cssColor) return null

  const rgba = cssColor.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d*))?\)$/
  )
  if (!rgba || !Array.isArray(rgba)) {
    return null
  }

  const color: RgbColor = [
    parseInt(rgba[1]),
    parseInt(rgba[2]),
    parseInt(rgba[3]),
  ]
  const alpha = parseInt(rgba[4])

  if (alpha === 0 || isNaN(color[0]) || isNaN(color[1]) || isNaN(color[2])) {
    return null
  }

  return color
}

function realColor(
  elem: Element,
  styleGetter: (elem: Element) => string
): string | null {
  const bg = styleGetter(elem)
  if (
    bg === 'rgba(0, 0, 0, 0)' ||
    bg === 'transparent' ||
    bg === 'initial' ||
    bg === 'inherit'
  ) {
    if (elem.parentElement == null) {
      return null
    }
    return realColor(elem.parentElement, styleGetter)
  } else {
    return bg
  }
}

function parsePadding(
  style: CSSStyleDeclaration,
  scaleFactor: number
): null | MarginPadding {
  const val = [
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
  const padding = parseSpacing(inputPadding, 0)
  if (linePadding > padding.top) {
    padding.top = linePadding
  }
  if (linePadding > padding.bottom) {
    padding.bottom = linePadding
  }
  return padding
}
