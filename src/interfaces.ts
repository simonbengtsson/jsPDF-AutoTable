import { CellHookData } from './HookData'

export interface ColumnOption {
  header?: string
  title?: string // deprecated (same as header)
  footer?: string
  dataKey?: string | number
  key?: string | number // deprecated (same as dataKey)
}

export type UserOptions = BaseConfig & Options

type Color = [number, number, number] | number | 'transparent' | false
type MarginPadding =
  | number
  | { top?: number; right?: number; bottom?: number; left?: number }

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
  minCellHeight: number,
  minCellWidth: number
}

interface CellDefinition {
  rowSpan?: number
  colSpan?: number
  styles?: Styles
  content?: string | string[] | number
}

export type CellType = null | string | number | boolean | CellDefinition
export type MultipleRowType = SingleRowType[]
export type SingleRowType = CellType[] | { [key: string]: CellType }

export interface BaseConfig {
  includeHiddenHtml: boolean,
  useCss: boolean
  theme: 'striped' | 'grid' | 'plain' | 'auto'
  startY?: number|false
  margin: MarginPadding
  pageBreak: 'auto' | 'avoid' | 'always'
  rowPageBreak: 'auto' | 'avoid'
  tableWidth: 'auto' | 'wrap' | number
  showHead: 'everyPage' | 'firstPage' | 'never' | boolean
  showFoot: 'everyPage' | 'lastPage' | 'never' | boolean
  tableLineWidth: number
  tableLineColor: Color
  tableId: string|number|null
}

interface Options {
  head?: SingleRowType | MultipleRowType
  foot?: SingleRowType | MultipleRowType
  body?: MultipleRowType
  html?: string | HTMLElement,
  columns?: ColumnOption[]

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

export interface OptionStyles {

}