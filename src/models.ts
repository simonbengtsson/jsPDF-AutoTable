import {defaultConfig} from "./config";
import state from './state';
import {CellHookData, HookData} from "./HookData";
import {applyUserStyles, getStringWidth, marginOrPadding, styles} from "./common";

declare function require(path: string): any;

var assign = require('object-assign');

type HookHandler = (data: HookData) => void | boolean;
type CellHookHandler = (data: CellHookData) => void | boolean;

class CellHooks {
    willParseCell: CellHookHandler[] = [];
    didParseCell: CellHookHandler[] = [];
    willDrawCell: CellHookHandler[] = [];
    didDrawCell: CellHookHandler[] = [];
    didDrawPage: HookHandler[] = [];
}

type Color = [number, number, number] | number | 'transparent' | false;
type MarginPadding = number | [number, number] | [number, number, number, number]

interface Properties {
    theme: 'auto' | 'striped' | 'grid' | 'plain', // default: striped
    includeHiddenHTML: boolean,
    useCss: boolean,
    startY: null|number,
    margin: MarginPadding,
    pageBreak: 'auto'|'avoid'|'always',
    rowPageBreak: 'auto'|'avoid',
    tableWidth: 'auto' | 'wrap' | number,
    showHeader: 'everyPage' | 'firstPage' | 'never',
    showFooter: 'everyPage' | 'lastPage' | 'never',
    tableLineWidth: number,
    tableLineColor: Color,
    allSectionHooks: boolean;
    tableId: any,
}

export class Table {
    id?: any;
    cursor: { x: number, y: number };
    doc: any;
    userStyles: {};
    settings: any;

    columns: Column[] = [];

    head: Row[] = [];
    body: Row[] = [];
    foot: Row[] = [];

    height = 0;
    width = 0;
    preferredWidth = 0;
    wrappedWidth = 0;
    minWidth = 0;
    headHeight = 0;
    footHeight = 0;

    startPageNumber = 1;
    pageCount = 1;
    pageStartX: number;
    pageStartY: number;
    finalY: number;

    styles = {
        styles: {},
        headStyles: {},
        bodyStyles: {},
        footStyles: {},
        alternateRowStyles: {},
        columnStyles: {},
    };

    cellHooks: CellHooks = new CellHooks();

    allRows() {
        return this.head.concat(this.body).concat(this.foot);
    }

    callCellHooks(handlers: HookHandler[], cell: Cell, row: Row, column: Column): boolean {
        for (let handler of handlers) {
            if (handler(new CellHookData(cell, row, column)) === false) {
                return false;
            }
        }
        return true;
    }

    callEndPageHooks() {
        applyUserStyles();
        for (let handler of this.cellHooks.didDrawPage) {
            handler(new HookData());
        }
    }

    margin(side) {
        return marginOrPadding(this.settings.margin, defaultConfig().margin)[side];
    }
}

export class Row {
    raw: HTMLTableRowElement | any;
    index: number;
    cells = {};
    section: 'head' | 'body' | 'foot';

    height = 0;
    maxCellLineCount = 1;
    maxCellHeight = 0;
    x: number;
    y: number;

    pageCount = 1;
    spansMultiplePages = false;

    constructor(raw, index, section) {
        this.raw = raw;
        this.index = index;
        this.section = section;
    }
}

export class Cell {
    raw: HTMLTableCellElement | any;
    styles: any;
    text: string[];
    section: 'head' | 'body' | 'foot';

    contentWidth = 0;
    wrappedWidth = 0;
    minWidth = 0;
    textPos = {};
    height = 0;
    width = 0;
    x: number;
    y: number;

    colSpan: number;
    rowSpan: number;

    constructor(raw, themeStyles, section) {
        this.raw = raw;
        this.rowSpan = raw && raw.rowSpan || 1;
        this.colSpan = raw && raw.colSpan || 1;
        this.styles = assign(themeStyles, raw && raw.styles || {});
        this.section = section;

        let text = '';
        let content = raw && typeof raw.content !== 'undefined' ? raw.content : raw;
        content = content != undefined && content.dataKey != undefined ? content.title : content;
        if (content && typeof window === 'object' && (<any>window).HTMLElement && content instanceof (<any>window).HTMLElement) {
            text = (content.innerText || '').trim();
        } else {
            // Stringify 0 and false, but not undefined or null
            text = content != undefined ? '' + content : '';
        }

        let splitRegex = /\r\n|\r|\n/g;
        this.text = text.split(splitRegex);

        this.contentWidth = this.padding('horizontal') + getStringWidth(this.text, this.styles);
        if (typeof this.styles.cellWidth === 'number') {
            this.minWidth = this.styles.cellWidth;
            this.wrappedWidth = this.styles.cellWidth;
        } else if (this.styles.cellWidth === 'wrap') {
            this.minWidth = this.contentWidth;
            this.wrappedWidth = this.contentWidth;
        } else { // auto
            this.minWidth = 10 / state().scaleFactor();
            this.wrappedWidth = this.contentWidth;
        }
    }

    padding(name) {
        let padding = marginOrPadding(this.styles.cellPadding, styles([]).cellPadding);
        if (name === 'vertical') {
            return padding.top + padding.bottom;
        } else if (name === 'horizontal') {
            return padding.left + padding.right;
        } else {
            return padding[name];
        }
    }
}

export class Column {
    raw: any;
    dataKey: string | number;

    preferredWidth = 0;
    minWidth = 0;
    wrappedWidth = 0;
    width = 0;

    constructor(dataKey, raw) {
        this.dataKey = dataKey;
        this.raw = raw;
    }
}