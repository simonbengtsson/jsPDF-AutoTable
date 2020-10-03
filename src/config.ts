import { CellHook, PageHook } from './models'

/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
export const FONT_ROW_RATIO = 1.15

export interface LineWidths {
  'bottom': number;
  'top' : number;
  'left' : number;
  'right': number;
}

export interface Styles {
  font: 'helvetica' | 'times' | 'courier' | string
  fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic'
  overflow: 'linebreak' | 'ellipsize' | 'visible' | 'hidden' | Function
  fillColor: Color
  textColor: Color
  halign: 'left' | 'center' | 'right' | 'justify'
  valign: 'top' | 'middle' | 'bottom'
  fontSize: number
  cellPadding: MarginPaddingInput
  lineColor: Color
  lineWidth: number | Partial<LineWidths>
  cellWidth: 'auto' | 'wrap' | number
  minCellHeight: number
  minCellWidth: number
}

export interface UserOptions {
  includeHiddenHtml?: boolean
  useCss?: boolean
  theme?: 'striped' | 'grid' | 'plain' | null
  startY?: number | false
  margin?: MarginPaddingInput
  pageBreak?: 'auto' | 'avoid' | 'always'
  rowPageBreak?: 'auto' | 'avoid'
  tableWidth?: 'auto' | 'wrap' | number
  showHead?: 'everyPage' | 'firstPage' | 'never' | boolean
  showFoot?: 'everyPage' | 'lastPage' | 'never' | boolean
  tableLineWidth?: number
  tableLineColor?: Color
  tableId?: string | number

  head?: RowInput[]
  body?: RowInput[]
  foot?: RowInput[]
  html?: string | HTMLTableElement
  columns?: ColumnInput[]
  horizontalPageBreak?: boolean

  // Styles
  styles?: Partial<Styles>
  bodyStyles?: Partial<Styles>
  headStyles?: Partial<Styles>
  footStyles?: Partial<Styles>
  alternateRowStyles?: Partial<Styles>
  columnStyles?: {
    [key: string]: Partial<Styles>
  }

  // Hooks
  didParseCell?: CellHook
  willDrawCell?: CellHook
  didDrawCell?: CellHook
  didDrawPage?: PageHook
}

export type ColumnInput =
  | string
  | number
  | {
      header?: CellInput
      title?: CellInput // deprecated (same as header)
      footer?: CellInput
      dataKey?: string | number
      key?: string | number // deprecated (same as dataKey)
    }

export type Color = [number, number, number] | number | string | false
export type MarginPaddingInput =
  | number
  | number[]
  | {
      top?: number
      right?: number
      bottom?: number
      left?: number
      horizontal?: number
      vertical?: number
    }

export interface CellDef {
  rowSpan?: number
  colSpan?: number
  styles?: Partial<Styles>
  content?: string | string[] | number
  title?: string // Deprecated, same as content
  _element?: HTMLTableCellElement
}

export class HtmlRowInput extends Array<CellDef> {
  _element: HTMLTableRowElement

  constructor(element: HTMLTableRowElement) {
    super()
    this._element = element
  }
}

export type CellInput = null | string | string[] | number | boolean | CellDef
export type RowInput = { [key: string]: CellInput } | HtmlRowInput | CellInput[]

// Base style for all themes
export function defaultStyles(scaleFactor: number): Styles {
  return {
    font: 'helvetica', // helvetica, times, courier
    fontStyle: 'normal', // normal, bold, italic, bolditalic
    overflow: 'linebreak', // linebreak, ellipsize, visible or hidden
    fillColor: false, // Either false for transparent, rbg array e.g. [255, 255, 255] or gray level e.g 200
    textColor: 20,
    halign: 'left', // left, center, right, justify
    valign: 'top', // top, middle, bottom
    fontSize: 10,
    cellPadding: 5 / scaleFactor, // number or {top,left,right,left,vertical,horizontal}
    lineColor: 200,
    lineWidth: 0,
    cellWidth: 'auto', // 'auto'|'wrap'|number
    minCellHeight: 0,
    minCellWidth: 0,
  }
}

/**
 * Styles for the themes (overriding the default styles)
 */
export type ThemeName = 'striped' | 'grid' | 'plain'
export function getTheme(name: ThemeName): { [key: string]: Partial<Styles> } {
  const themes: { [key in ThemeName]: { [key: string]: Partial<Styles> } } = {
    striped: {
      table: { fillColor: 255, textColor: 80, fontStyle: 'normal' },
      head: { textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold' },
      body: {},
      foot: { textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold' },
      alternateRow: { fillColor: 245 },
    },
    grid: {
      table: {
        fillColor: 255,
        textColor: 80,
        fontStyle: 'normal',
        lineWidth: 0.1,
      },
      head: {
        textColor: 255,
        fillColor: [26, 188, 156],
        fontStyle: 'bold',
        lineWidth: 0,
      },
      body: {},
      foot: {
        textColor: 255,
        fillColor: [26, 188, 156],
        fontStyle: 'bold',
        lineWidth: 0,
      },
      alternateRow: {},
    },
    plain: {
      head: { fontStyle: 'bold' },
      foot: { fontStyle: 'bold' },
    },
  }
  return themes[name]
}
