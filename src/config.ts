import { CellHook, PageHook } from './models'

/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
export const FONT_ROW_RATIO = 1.15

export interface LineWidths {
  bottom: number
  top: number
  left: number
  right: number
}

export type FontStyle = 'normal' | 'bold' | 'italic' | 'bolditalic'
export type StandardFontType = 'helvetica' | 'times' | 'courier'
export type CustomFontType = string
export type FontType = StandardFontType | CustomFontType
export type HAlignType = 'left' | 'center' | 'right' | 'justify'
export type VAlignType = 'top' | 'middle' | 'bottom'
export type OverflowType =
  | 'linebreak'
  | 'ellipsize'
  | 'visible'
  | 'hidden'
  | ((text: string | string[], width: number) => string | string[])
export type CellWidthType = 'auto' | 'wrap' | number

export interface Styles {
  font: FontType
  fontStyle: FontStyle
  overflow: OverflowType
  fillColor: Color
  textColor: Color
  halign: HAlignType
  valign: VAlignType
  fontSize: number
  cellPadding: MarginPaddingInput
  lineColor: Color
  lineWidth: number | Partial<LineWidths>
  cellWidth: CellWidthType
  minCellHeight: number
  minCellWidth: number
}

export type ThemeType = 'striped' | 'grid' | 'plain' | null
export type PageBreakType = 'auto' | 'avoid' | 'always'
export type RowPageBreakType = 'auto' | 'avoid'
export type TableWidthType = 'auto' | 'wrap' | number
export type ShowHeadType = 'everyPage' | 'firstPage' | 'never' | boolean
export type ShowFootType = 'everyPage' | 'lastPage' | 'never' | boolean

export interface UserOptions {
  includeHiddenHtml?: boolean
  useCss?: boolean
  theme?: ThemeType
  startY?: number | false
  margin?: MarginPaddingInput
  pageBreak?: PageBreakType
  rowPageBreak?: RowPageBreakType
  tableWidth?: TableWidthType
  showHead?: ShowHeadType
  showFoot?: ShowFootType
  tableLineWidth?: number
  tableLineColor?: Color
  tableId?: string | number
  head?: RowInput[]
  body?: RowInput[]
  foot?: RowInput[]
  html?: string | HTMLTableElement
  columns?: ColumnInput[]
  horizontalPageBreak?: boolean
  // column data key to repeat if horizontalPageBreak = true
  horizontalPageBreakRepeat?: string | number

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
  /** Called when the plugin finished parsing cell content. Can be used to override content or styles for a specific cell. */
  didParseCell?: CellHook
  /** Called before a cell or row is drawn. Can be used to call native jspdf styling functions such as `doc.setTextColor` or change position of text etc before it is drawn. */
  willDrawCell?: CellHook
  /** Called after a cell has been added to the page. Can be used to draw additional cell content such as images with `doc.addImage`, additional text with `doc.addText` or other jspdf shapes. */
  didDrawCell?: CellHook
  /** Called before starting to draw on a page. Can be used to add headers or any other content that you want on each page there is an autotable. */
  willDrawPage?: PageHook
  /** Called after the plugin has finished drawing everything on a page. Can be used to add footers with page numbers or any other content that you want on each page there is an autotable. */
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
