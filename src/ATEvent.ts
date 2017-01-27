import {addPage} from "./painter";
import {Table, Cell, Row, Column} from "./models";

export class ATEvent {
    name: string;
    table?: Table;
    pageCount: number;
    settings: {};
    doc: any;
    cursor: {x: number, y: number};
    addPage: () => void;

    // Depending on the type of event the following 
    // properties might be set
    cell?: Cell;
    row?: Row;
    column?: Column;
    section?: 'head'|'body'|'foot';

    constructor(name: string, table: Table, row?: Row, column?: Column, cell?: Cell) {
        this.name = name;
        this.table = table;
        this.pageCount = table.pageCount;
        this.settings = table.settings;
        this.cursor = table.cursor;
        this.doc = table.doc;
        this.addPage = addPage;

        this.cell = cell;
        this.row = row;
        this.column = column;

        if (row) {
            this.section = row.section;
        }
    }
}