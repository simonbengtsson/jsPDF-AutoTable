import {addPage} from "./tableDrawer";
import state from './state';
import {Table, Cell, Row, Column} from "./models";

export class HookData {
    table: Table;
    pageCount: number;
    settings: {};
    doc: any;
    cursor: { x: number, y: number };
    addPage: () => void;

    constructor() {
        let table = state().table;
        this.table = table;
        this.pageCount = table.pageCount;
        this.settings = table.settings;
        this.cursor = table.cursor;
        this.doc = state().doc;
        this.addPage = addPage;
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