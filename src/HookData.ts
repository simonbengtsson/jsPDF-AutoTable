import state from './state';
import {Table, Cell, Row, Column} from "./models";

export class HookData {
    table: Table;
    pageNumber: number;
    settings: {};
    doc: any;
    cursor: { x: number, y: number };

    get pageCount() {
        return this.pageNumber;
    }

    constructor() {
        let table = state().table;
        this.table = table;
        this.pageNumber = table.pageNumber;
        this.settings = table.settings;
        this.cursor = table.cursor;
        this.doc = state().doc;
    }
}

export class CellHookData extends HookData {
    cell: Cell;
    row: Row;
    column: Column;
    section: 'head' | 'body' | 'foot';

    constructor(cell: Cell, row: Row, column: Column) {
        super();

        this.cell = cell;
        this.row = row;
        this.column = column;
        this.section = row.section;
    }
}