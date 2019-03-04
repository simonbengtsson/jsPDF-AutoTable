import { Table, Cell, Row, Column } from "./models";
export declare class HookData {
    table: Table;
    pageNumber: number;
    settings: {};
    doc: any;
    cursor: {
        x: number;
        y: number;
    };
    readonly pageCount: number;
    constructor();
}
export declare class CellHookData extends HookData {
    cell: Cell;
    row: Row;
    column: Column;
    section: 'head' | 'body' | 'foot';
    constructor(cell: Cell, row: Row, column: Column);
}
