import { DocHandler } from './documentHandler'
import { Table } from './models'
import { Color, MarginPaddingInput, Styles } from './config'

type Text = string | string[]
export function getStringWidth(text: Text, styles: Styles, doc: DocHandler) {
  doc.applyStyles(styles, true)
  const textArr: string[] = Array.isArray(text) ? text : [text]

  const widestLineWidth = textArr
    .map((text) => doc.getTextWidth(text))
    // Shave off a few digits for potential improvement in width calculation
    .map((val) => Math.floor(val * 10000) / 10000)
    .reduce((a, b) => Math.max(a, b), 0)

  return widestLineWidth
}

/**
 * Ellipsize the text to fit in the width
 */
export function ellipsize(
  text: string[],
  width: number,
  styles: Styles,
  doc: DocHandler,
  stre: string
): string[] {
  return text.map((str) =>
    ellipsizeStr(str, width, styles, doc, stre)
  )
}

function ellipsizeStr(
  text: string,
  width: number,
  styles: Styles,
  doc: DocHandler,
  str: string
): string {
  let precision = 10000 * doc.scaleFactor()
  width = Math.ceil(width * precision) / precision

  if (width >= getStringWidth(text, styles, doc)) {
    return text
  }
  while (width < getStringWidth(text + str, styles, doc)) {
    if (text.length <= 1) {
      break
    }
    text = text.substring(0, text.length - 1)
  }
  return text.trim() + str
}

export function addTableBorder(table: Table, doc: DocHandler) {
  let lineWidth = table.settings.tableLineWidth
  let lineColor = table.settings.tableLineColor
  doc.applyStyles({ lineWidth, lineColor })
  let fillStyle = getFillStyle(lineWidth, false)
  if (fillStyle) {
    doc.rect(
      table.pageStartX,
      table.pageStartY,
      table.width,
      table.cursor.y - table.pageStartY,
      fillStyle
    )
  }
}

export function getFillStyle(lineWidth: number, fillColor: Color) {
  let drawLine = lineWidth > 0
  let drawBackground = fillColor || fillColor === 0
  if (drawLine && drawBackground) {
    return 'DF' // Fill then stroke
  } else if (drawLine) {
    return 'S' // Only stroke (transparent background)
  } else if (drawBackground) {
    return 'F' // Only fill, no stroke
  } else {
    return null
  }
}

export type MarginPadding = {
  top: number
  right: number
  bottom: number
  left: number
}
export function marginOrPadding(
  value: MarginPaddingInput | undefined,
  defaultValue: number
): MarginPadding {
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
      bottom: value.bottom ?? defaultValue,
    }
  }

  if (typeof value !== 'number') {
    value = defaultValue
  }

  return { top: value, right: value, bottom: value, left: value }
}
