import {CellHookData} from "./HookData";

interface ColumnOption {
    header?: string;
    title?: string; // deprecated (same as header)
    footer?: string;
    dataKey?: string | number;
}

export type UserOptions = HTMLConfig | ContentConfig | ColumnDataConfig;

type Color = [number, number, number] | number | 'transparent' | false;
type MarginPadding = number | { top?: number, right?: number, bottom?: number, left?: number }

interface Styles {
    font?: 'helvetica' | 'times' | 'courier',
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic',
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden',
    fillColor?: Color,
    textColor?: Color,
    halign?: 'left'|'center'|'right'|'justify',
    valign?: 'top' | 'middle' | 'bottom',
    fontSize?: number,
    cellPadding?: number,
    lineColor?: Color,
    lineWidth?: number,
    cellWidth?: 'auto' | 'wrap' | number,
    minCellHeight?: number
}

interface CellDefinition {
    rowSpan?: number,
    colSpan?: number,
    styles?: Styles,
}

type CellType = null | string | number | boolean | CellDefinition
type MultipleRowType = CellType[][] | { string: CellType }[]
type SingleRowType = CellType[] | { string: CellType }

interface BaseConfig {
    // Properties
    theme?: 'striped' | 'grid' | 'plain',
    startY?: number,
    margin?: MarginPadding,
    pageBreak?: 'auto'|'avoid'|'always',
    rowPageBreak?: 'auto'|'avoid',
    tableWidth?: 'auto' | 'wrap' | number,
    showHead?: 'everyPage' | 'firstPage' | 'never',
    showFoot?: 'everyPage' | 'lastPage' | 'never',
    tableLineWidth?: number,
    tableLineColor?: Color,
    tableId?: any,

    // Styles
    styles?: Styles,
    bodyStyles?: Styles,
    headStyles?: Styles,
    footStyles?: Styles,
    alternateRowStyles?: Styles,
    columnStyles?: {
        [key: string]: Styles;
    };

    // Hooks
    didParseCell?: (data: CellHookData) => void;
    willDrawCell?: (data: CellHookData) => void;
    didDrawCell?: (data: CellHookData) => void;
    didDrawPage?: (data: CellHookData) => void;
}

interface ContentConfig extends BaseConfig {
    head?: SingleRowType | MultipleRowType
    foot?: SingleRowType | MultipleRowType
    body: MultipleRowType
}

interface ColumnDataConfig extends BaseConfig {
    columns?: ColumnOption[];
    body: object[];
}

interface HTMLConfig extends BaseConfig {
    html: string | HTMLElement;
}
