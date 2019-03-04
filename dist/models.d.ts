import { CellHookData, HookData } from "./HookData";
declare type HookHandler = (data: HookData) => void | boolean;
declare type CellHookHandler = (data: CellHookData) => void | boolean;
declare class CellHooks {
    willParseCell: CellHookHandler[];
    didParseCell: CellHookHandler[];
    willDrawCell: CellHookHandler[];
    didDrawCell: CellHookHandler[];
    didDrawPage: HookHandler[];
}
export declare class Table {
    id?: any;
    cursor: {
        x: number;
        y: number;
    };
    doc: any;
    userStyles: {};
    settings: any;
    columns: Column[];
    head: Row[];
    body: Row[];
    foot: Row[];
    height: number;
    width: number;
    preferredWidth: number;
    wrappedWidth: number;
    minWidth: number;
    headHeight: number;
    footHeight: number;
    startPageNumber: number;
    pageNumber: number;
    pageStartX: number;
    pageStartY: number;
    finalY: number;
    readonly pageCount: number;
    styles: {
        styles: {};
        headStyles: {};
        bodyStyles: {};
        footStyles: {};
        alternateRowStyles: {};
        columnStyles: {};
    };
    cellHooks: CellHooks;
    allRows(): Row[];
    callCellHooks(handlers: HookHandler[], cell: Cell, row: Row, column: Column): boolean;
    callEndPageHooks(): void;
    margin(side: any): any;
}
export declare class Row {
    raw: HTMLTableRowElement | any;
    index: number;
    cells: {};
    section: 'head' | 'body' | 'foot';
    height: number;
    maxCellLineCount: number;
    maxCellHeight: number;
    x: number;
    y: number;
    pageNumber: number;
    spansMultiplePages: boolean;
    readonly pageCount: number;
    constructor(raw: any, index: any, section: any);
}
export declare class Cell {
    raw: HTMLTableCellElement | any;
    styles: any;
    text: string[];
    section: 'head' | 'body' | 'foot';
    contentWidth: number;
    wrappedWidth: number;
    minWidth: number;
    textPos: {};
    height: number;
    width: number;
    x: number;
    y: number;
    colSpan: number;
    rowSpan: number;
    constructor(raw: any, themeStyles: any, section: any);
    padding(name: any): any;
}
export declare class Column {
    raw: any;
    dataKey: string | number;
    index: number;
    preferredWidth: number;
    minWidth: number;
    wrappedWidth: number;
    width: number;
    constructor(dataKey: any, raw: any, index: any);
}
export {};
