import { DocHandler } from './documentHandler'
import { Pos, Table } from './models'
import { Color, MarginPaddingInput, Styles } from './config'

type Text = string | string[]
export function getStringWidth(
  text: Text,
  styles: Partial<Styles>,
  doc: DocHandler
) {
  doc.applyStyles(styles, true)
  const textArr: string[] = Array.isArray(text) ? text : [text]

  const widestLineWidth = textArr
    .map((text) => doc.getTextWidth(text))
    .reduce((a, b) => Math.max(a, b), 0)

  return widestLineWidth
}

export function addTableBorder(
  doc: DocHandler,
  table: Table,
  startPos: Pos,
  cursor: Pos
) {
  const lineWidth = table.settings.tableLineWidth
  const lineColor = table.settings.tableLineColor
  doc.applyStyles({ lineWidth, lineColor })

  const fillStyle = getFillStyle(lineWidth, false)
  if (fillStyle) {
    doc.rect(
      startPos.x,
      startPos.y,
      table.getWidth(doc.pageSize().width),
      cursor.y - startPos.y,
      fillStyle
    )
  }
}

export function getFillStyle(lineWidth: number, fillColor: Color) {
  const drawLine = lineWidth > 0
  const drawBackground = fillColor || fillColor === 0
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

export function parseSpacing(
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
