import {Config, getDefaults} from "./config";
import {addPage} from "./painter";
export let table = {};

declare function require(path: string): any;
var assign = require('object-assign');

export class Table {
    id?: any;
    settings: any;
    cursor: {x: number, y: number};
    doc: any;
    scaleFactor: number;
    userStyles: {};

    rows: Row[] = [];
    columns: Column[] = [];
    headerRow: Row = null;
    
    height = 0;
    width = 0;
    contentWidth = 0;
    preferredWidth = 0;
    
    pageCount = 1;
    pageStartX: number;
    pageStartY: number;
    finalY: number;
    
    constructor(doc) {
        this.doc = doc;
        this.scaleFactor = doc.internal.scaleFactor;
        
        this.userStyles = {
            textColor: 30, // Setting text color to dark gray as it can't be obtained from jsPDF
            fontSize: doc.internal.getFontSize(),
            fontStyle: doc.internal.getFont().fontStyle
        };
    }

    hooks = {
        createdHeaderCell: [],
        createdCell: [],
        drawHeaderRow: [],
        drawRow: [],
        drawHeaderCell: [],
        drawCell: [],
        addPageContent: []
    };

    styles = {
        styles: {},
        headerStyles: {},
        bodyStyles: {},
        alternateRowStyles: {},
        columnStyles: {},
    };
    
    margin(side) {
        return Config.marginOrPadding(this.settings.margin, getDefaults().margin)[side];
    }
}

export class Row {
    raw: HTMLTableRowElement|any;
    index: number;
    cells = {};
    
    height = 0;
    maxCellLineCount = 1;
    maxCellHeight = 0;
    
    pageCount = 1;
    spansMultiplePages = false;
    
    constructor(raw, index) {
        this.raw = raw;
        this.index = index;
    }
}

export class Cell {
    raw: HTMLTableCellElement|any;
    styles: any;
    text: string[];
    
    contentWidth = 0;
    textPos = {};
    height = 0;
    width = 0;
    
    colSpan: number;
    rowSpan: number;
    
    constructor(raw, themeStyles) {
        this.raw = raw;
        this.rowSpan = raw && raw.rowSpan || 1;
        this.colSpan = raw && raw.colSpan || 1;
        this.styles = assign(themeStyles, raw && raw.styles || {});

        let text = '';
        let content = raw && typeof raw.content !== 'undefined' ? raw.content : raw;
        content = content && content.dataKey ? content.title : content;
        if (content && content instanceof (<any>window).HTMLElement) {
            text = (content.innerText || '').trim();
        } else {
            // Stringify 0 and false, but not undefined
            text = typeof content !== 'undefined' ? '' + content : '';
        }
        
        let splitRegex = /\r\n|\r|\n/g;
        this.text = text.split(splitRegex);
    }
    
    padding(name) {
        let padding = Config.marginOrPadding(this.styles.cellPadding, Config.styles([]).cellPadding);
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
    dataKey: string|number;
    index: number;
    options = {};
    widthStyle: 'auto'|'wrap'|number = 'auto';
    
    preferredWidth = 0;
    contentWidth = 0;
    width = 0;
    
    constructor(dataKey, index) {
        this.dataKey = dataKey;
        this.index = index;
    }
}

export class ATEvent {
    type: string;
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
    
    constructor(table: Table, row?: Row, column?: Column, cell?: Cell) {
        this.table = table;
        this.pageCount = table.pageCount;
        this.settings = table.settings;
        this.cursor = table.cursor;
        this.doc = table.doc;
        this.addPage = addPage;
        
        this.cell = cell;
        this.row = row;
        this.column = column;
    }
}