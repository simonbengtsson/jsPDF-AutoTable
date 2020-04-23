import { CellHookData } from './HookData'

export interface ColumnOption {
  header?: string
  title?: string // deprecated (same as header)
  footer?: string
  dataKey?: string | number
  key?: string | number // deprecated (same as dataKey)
}

export type UserOptions = BaseConfig

type Color = [number, number, number] | number | 'transparent' | false
type MarginPadding =
  | number
  | { top?: number; right?: number; bottom?: number; left?: number }

export interface Styles {
  font?: 'helvetica' | 'times' | 'courier' | string
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic'
  overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden'
  fillColor?: Color
  textColor?: Color
  halign?: 'left' | 'center' | 'right' | 'justify'
  valign?: 'top' | 'middle' | 'bottom'
  fontSize?: number
  cellPadding?: number
  lineColor?: Color
  lineWidth?: number
  cellWidth?: 'auto' | 'wrap' | number
  minCellHeight?: number
}

interface CellDefinition {
  rowSpan?: number
  colSpan?: number
  styles?: Styles
  content?: string | string[] | number
}

type CellType = null | string | number | boolean | CellDefinition
export type MultipleRowType = CellType[][] | { string: CellType }[]
type SingleRowType = CellType[] | { [key: string]: CellType }

export interface BaseConfig {
  head?: SingleRowType | MultipleRowType
  foot?: SingleRowType | MultipleRowType
  body?: MultipleRowType

  html?: string | HTMLElement,
  includeHiddenHtml: boolean,
  useCss: boolean

  columns?: ColumnOption[]

  // Properties
  theme: 'striped' | 'grid' | 'plain'
  startY?: number
  margin: MarginPadding
  pageBreak: 'auto' | 'avoid' | 'always'
  rowPageBreak: 'auto' | 'avoid'
  tableWidth: 'auto' | 'wrap' | number
  showHead: 'everyPage' | 'firstPage' | 'never'
  showFoot: 'everyPage' | 'lastPage' | 'never'
  tableLineWidth: number
  tableLineColor: Color
  tableId: any

  // Styles
  styles: Styles
  bodyStyles: Styles
  headStyles: Styles
  footStyles: Styles
  alternateRowStyles: Styles
  columnStyles: {
    [key: string]: Styles
  }

  // Hooks
  didParseCell: (data: CellHookData) => void
  willDrawCell: (data: CellHookData) => void
  didDrawCell: (data: CellHookData) => void
  didDrawPage: (data: CellHookData) => void
}
