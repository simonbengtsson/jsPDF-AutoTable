import { defaultStyles } from './config'
import state from './state'
import { assign } from './polyfills'
import { MarginPaddingInput } from './interfaces'

export function getStringWidth(text: string | string[], styles: any) {
  applyStyles(styles, true)
  const textArr: string[] = Array.isArray(text) ? text : [text]

  const widestLineWidth = textArr
    .map((text) => state().doc.getTextWidth(text))
    // Shave off a few digits for potential improvement in width calculation
    .map((val) => Math.floor(val * 10000) / 10000)
    .reduce((a, b) => Math.max(a, b), 0)

  return widestLineWidth
}

/**
 * Ellipsize the text to fit in the width
 */
export function ellipsize(
  text: string | string[],
  width: number,
  styles: any,
  ellipsizeStr = '...'
): string | string[] {
  if (Array.isArray(text)) {
    return text.map((str) =>
      ellipsize(str, width, styles, ellipsizeStr)
    ) as string[]
  }

  let precision = 10000 * state().scaleFactor()
  width = Math.ceil(width * precision) / precision

  if (width >= getStringWidth(text, styles)) {
    return text
  }
  while (width < getStringWidth(text + ellipsizeStr, styles)) {
    if (text.length <= 1) {
      break
    }
    text = text.substring(0, text.length - 1)
  }
  return text.trim() + ellipsizeStr
}

export function addTableBorder() {
  let table = state().table
  let styles = {
    lineWidth: table.settings.tableLineWidth,
    lineColor: table.settings.tableLineColor,
  }
  applyStyles(styles)
  let fs = getFillStyle(styles)
  if (fs) {
    state().doc.rect(
      table.pageStartX,
      table.pageStartY,
      table.width,
      table.cursor.y - table.pageStartY,
      fs
    )
  }
}

export function getFillStyle(styles: any) {
  let drawLine = styles.lineWidth > 0
  let drawBackground = styles.fillColor || styles.fillColor === 0
  if (drawLine && drawBackground) {
    return 'DF' // Fill then stroke
  } else if (drawLine) {
    return 'S' // Only stroke (transparent background)
  } else if (drawBackground) {
    return 'F' // Only fill, no stroke
  } else {
    return false
  }
}

export function applyUserStyles() {
  applyStyles(state().table.userStyles)
}

export function applyStyles(styles: any, fontOnly = false) {
  const doc = state().doc
  const nonFontModifiers = {
    fillColor: doc.setFillColor,
    textColor: doc.setTextColor,
    lineColor: doc.setDrawColor,
    lineWidth: doc.setLineWidth,
  }
  const styleModifiers: { [key: string]: any } = {
    // Font style needs to be applied before font
    // https://github.com/simonbengtsson/jsPDF-AutoTable/issues/632
    fontStyle: doc.setFontStyle,
    font: doc.setFont,
    fontSize: doc.setFontSize,
    ...(fontOnly ? {} : nonFontModifiers),
  }

  Object.keys(styleModifiers).forEach((name) => {
    const style = styles[name]
    const modifier = styleModifiers[name]
    if (typeof style !== 'undefined') {
      if (Array.isArray(style)) {
        modifier(...style)
      } else {
        modifier(style)
      }
    }
  })
}

export type MarginPadding = { top: number, right: number, bottom: number, left: number }
export function marginOrPadding(value: MarginPaddingInput|undefined, defaultValue: number): MarginPadding {
  value = value || defaultValue
  if (Array.isArray(value)) {
    if (value.length >= 4) {
      return {
        top: value[0],
        right: value[1],
        bottom: value[2],
        left: value[3],
      }
    } else if (value.length === 3) {
      return {
        top: value[0],
        right: value[1],
        bottom: value[2],
        left: value[1],
      }
    } else if (value.length === 2) {
      return {
        top: value[0],
        right: value[1],
        bottom: value[0],
        left: value[1],
      }
    } else if (value.length === 1) {
      value = value[0]
    } else {
      value = defaultValue
    }
  }

  if (typeof value === 'object') {
    if (typeof value.vertical === 'number') {
      value.top = value.vertical
      value.bottom = value.vertical
    }
    if (typeof value.horizontal === 'number') {
      value.right = value.horizontal
      value.left = value.horizontal
    }
    return {
      left: value.left ?? defaultValue,
      top: value.top ?? defaultValue,
      right: value.right ?? defaultValue,
      bottom: value.bottom ?? defaultValue
    }
  }

  if (typeof value !== 'number') {
    value = defaultValue
  }

  return { top: value, right: value, bottom: value, left: value }
}

export function styles(styles: any) {
  styles = Array.isArray(styles) ? styles : [styles]
  return assign(defaultStyles(), ...styles)
}
