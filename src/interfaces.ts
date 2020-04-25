import { CellHookData } from './HookData'
import { MarginPadding } from './common'

export interface ColumnOption {
  header?: string
  title?: string // deprecated (same as header)
  footer?: string
  dataKey?: string | number
  key?: string | number // deprecated (same as dataKey)
}

type Color = [number, number, number] | number | 'transparent' | false
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

export interface Styles {
  font: 'helvetica' | 'times' | 'courier' | string
  fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic'
  overflow: 'linebreak' | 'ellipsize' | 'visible' | 'hidden' | Function
  fillColor: Color
  textColor: Color
  halign: 'left' | 'center' | 'right' | 'justify'
  valign: 'top' | 'middle' | 'bottom'
  fontSize: number
  cellPadding: number
  lineColor: Color
  lineWidth: number
  cellWidth: 'auto' | 'wrap' | number
  minCellHeight: number
  minCellWidth: number
}

export interface CellDefinition {
  rowSpan?: number
  colSpan?: number
  styles?: Styles
  content?: string | string[] | number
}

export type CellType = null | string | number | boolean | CellDefinition
export type RowInput = { [key: string]: CellType }

export interface Settings {
  includeHiddenHtml: boolean
  useCss: boolean
  theme: 'striped' | 'grid' | 'plain'
  startY: number
  margin: MarginPadding
  pageBreak: 'auto' | 'avoid' | 'always'
  rowPageBreak: 'auto' | 'avoid'
  tableWidth: 'auto' | 'wrap' | number
  showHead: 'everyPage' | 'firstPage' | 'never'
  showFoot: 'everyPage' | 'lastPage' | 'never'
  tableLineWidth: number
  tableLineColor: Color
}

export interface UserInput {
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
  columns?: ColumnOption[]

  // Styles
  styles?: Styles
  bodyStyles?: Styles
  headStyles?: Styles
  footStyles?: Styles
  alternateRowStyles?: Styles
  columnStyles?: {
    [key: string]: Styles
  }

  // Hooks
  didParseCell?: (data: CellHookData) => void
  willDrawCell?: (data: CellHookData) => void
  didDrawCell?: (data: CellHookData) => void
  didDrawPage?: (data: CellHookData) => void
}
