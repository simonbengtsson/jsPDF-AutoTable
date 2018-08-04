import {CellHookData, HookData} from "./HookData";

/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
export let FONT_ROW_RATIO = 1.15;
import state from './state';
import {assign} from './polyfills';
import {Table} from "./models";

interface ColumnOption {
    header?: string;
    title?: string; // deprecated (same as header)
    footer?: string;
    dataKey?: string | number;
}

/**
 * Properties
 */
export interface UserOptions {

}

export interface UserOptions {
    columns?: string[] | ColumnOption[];
    data?: any[][];

    html?: HTMLTableElement | string;
    includeHiddenHTML?: boolean;
    useCSS?: boolean;

    headerRows?: number;
    footerRows?: number;

    startY?: number;
    margin?: MarginPadding;
    pageBreak?: boolean;
    pageBreakRow?: boolean;
    tableWidth?: 'auto' | 'wrap' | number;
    showHeader?: 'everyPage' | 'firstPage' | 'never';
    showFooter?: 'everyPage' | 'lastPage' | 'never';
    tableLineWidth?: number;
    tableLineColor?: Color;
    allSectionHooks?: boolean;
    tableId?: any;

    theme?: 'striped' | 'plain' | 'grid' | 'css';
    styles?: Styles;
    headerStyles?: Styles;
    bodyStyles?: Styles;
    footerStyles?: Styles;
    alternateRowStyles?: Styles;
    columnStyles?: Styles; // Prefer using the parseCell hook instead of this

    createdCell?: () => {};
    drawCell?: () => {};
    didDrawCell?: () => {};
    addPageContent?: () => {};
}

export function parseSettings(table: Table, allOptions) {

}

type Color = [number, number, number] | number | 'transparent' | false;
type MarginPadding = number | { top?: number, right?: number, bottom?: number, left?: number }

interface Styles {
    font?: 'helvetica' | 'times' | 'courier',
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic',
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden',
    fillColor?: Color,
    textColor?: Color,
    halign?: 'left' | 'center' | 'right',
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

export interface BaseConfig {
    // Properties
    theme?: 'striped' | 'grid' | 'plain',
    startY?: number,
    margin?: MarginPadding,
    pageBreak?: 'auto'|'avoid'|'always',
    rowPageBreak: 'auto'|'avoid',
    tableWidth?: 'auto' | 'wrap' | number,
    showHeader?: 'everyPage' | 'firstPage' | 'never',
    showFooter?: 'everyPage' | 'lastPage' | 'never',
    tableLineWidth?: number,
    tableLineColor?: Color,
    allSectionHooks?: boolean; // default: false
    tableId?: any,

    // Styles
    styles?: Styles,
    bodyStyles?: Styles,
    headStyles?: Styles,
    footStyles?: Styles,
    alternateRowStyles?: Styles,
    columnStyles?: Styles,

    // Hooks
    didParseCell?: (data: CellHookData) => void;
    willDrawCell?: (data: CellHookData) => void;
    didDrawCell?: (data: CellHookData) => void;
    didDrawPage?: (data: CellHookData) => void;
}

export interface ContentConfig extends BaseConfig {
    head?: SingleRowType | MultipleRowType
    foot?: SingleRowType | MultipleRowType
    body: MultipleRowType
}

export interface HTMLConfig extends BaseConfig {
    html: string | HTMLElement;
}

export function defaultConfig() {
    return {
        // Html content
        html: null, // HTML table element or a CSS selector pointing towards one

        // Custom content
        head: null,
        body: null,
        foot: null,

        // Properties
        includeHiddenHTML: false,
        startY: null, // Defaults to margin top value if not set
        margin: 40 / state().scaleFactor(),
        pageBreak: 'auto',
        rowPageBreak: 'auto',
        tableWidth: 'auto', // 'auto'|'wrap'|number
        showHeader: 'everyPage', // 'everyPage', 'firstPage', 'never',
        showFooter: 'everyPage', // 'everyPage', 'lastPage', 'never',
        tableLineWidth: 0,
        tableLineColor: 200,
        tableId: null,

        // Styling
        theme: 'striped', // 'striped', 'grid', 'plain', 'css'
        useCss: false,
        styles: {},
        headStyles: {},
        bodyStyles: {},
        footStyles: {},
        alternateRowStyles: {},
        columnStyles: {},

        // Hooks
        // Use to change the content of the cell before width calculations etc are performed
        didParseCell: function(data) {
        },
        willDrawCell: function(data) {
        },
        // Use to draw additional content such as images in table cells
        didDrawCell: function(data) {
        },
        // Use to draw additional content to each page such as headers and footers
        didDrawPage: function(data) {
        },
        allSectionHooks: false, // Set to true if you want the cell hooks to be called for cells in the header and footer
    }
}

// Base style for all themes
export function defaultStyles() {
    return {
        font: "helvetica", // helvetica, times, courier
        fontStyle: 'normal', // normal, bold, italic, bolditalic
        overflow: 'linebreak', // linebreak, ellipsize, visible or hidden
        fillColor: false, // Either false for transparent, rbg array e.g. [255, 255, 255] or gray level e.g 200
        textColor: 20,
        halign: 'left', // left, center, right
        valign: 'top', // top, middle, bottom
        fontSize: 10,
        cellPadding: 5 / state().scaleFactor(), // number or {top,left,right,left,vertical,horizontal}
        lineColor: 200,
        lineWidth: 0 / state().scaleFactor(),
        cellWidth: 'auto', // 'auto'|'wrap'|number
        minCellHeight: 0
    }
}

/**
 * Styles for the themes (overriding the default styles)
 */
export function getTheme(name) {
    let themes = {
        'striped': {
            table: {fillColor: 255, textColor: 80, fontStyle: 'normal'},
            head: {textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold'},
            body: {},
            foot: {textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold'},
            alternateRow: {fillColor: 245}
        },
        'grid': {
            table: {fillColor: 255, textColor: 80, fontStyle: 'normal', lineWidth: 0.1},
            head: {textColor: 255, fillColor: [26, 188, 156], fontStyle: 'bold', lineWidth: 0},
            body: {},
            foot: {textColor: 255, fillColor: [26, 188, 156], fontStyle: 'bold', lineWidth: 0},
            alternateRow: {}
        },
        'plain': {
            head: {fontStyle: 'bold'},
            foot: {fontStyle: 'bold'}
        }
    };
    return themes[name];
}