import {parseHtml} from "./htmlParser";
declare function require(path: string): any;
var entries = require('object.entries');
import assign from 'object-assign';

interface CellInput {
    
}

type ContentInput = string[]|string[][] | {columnId: string|CellInput}|[{columnId: string|CellInput}] | CellInput[]|CellInput[][]

interface HookData {

}

type InputMargin = number|[number, number]|[number, number, number]|[number, number, number, number];
type InputPadding = InputMargin;

type InputColor = number|[number, number, number];

class InputStyles {
    fillColor?: InputColor|'transparent' = 'transparent';
    font?: 'helvetica'|'times'|'courier'|string = 'helvetica';
    lineColor?: InputColor = 200;
    fontStyle?: 'normal'|'bold'|'italic'|'bolditalic' = 'normal';
    overflow?: 'linebreak'|'ellipsize'|'hidden'|'visible'|Function = 'linebreak'; 
    textColor?: InputColor = 20;
    halign?: 'left'|'center'|'right' = 'left';
    valign?: 'top'|'middle'|'bottom' = 'top';
    fontSize?: number = 10;
    cellPadding?: InputPadding = 5;
    lineWidth?: number = 0;
    rowHeight?: number;
    columnWidth?: 'auto'|'wrap'|number = 'auto';

    constructor(scaleFactor: number, ...input: InputStyles[]) {
        this.rowHeight = 20 / scaleFactor;
        assign(this, ...input);
    }
}

type Padding = Margin;
class Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
    vertical: number;
    horizontal: number;
    
    constructor(input: InputMargin) {
        if (Array.isArray(input) && input.length === 1) {
            input = input[0];
        }
        
        if (typeof input === 'number') {
            this.top = input;
            this.right = input;
            this.bottom = input;
            this.left = input;
        } else if (input.length === 2) {
            this.top = input[0];
            this.right = input[1];
            this.bottom = input[0];
            this.left = input[1];
        } else if (input.length === 3) {
            this.top = input[0];
            this.right = input[1];
            this.bottom = input[2];
            this.left = input[1];
        } else if (input.length === 4) {
            this.top = input[0];
            this.right = input[1];
            this.bottom = input[2];
            this.left = input[3];
        }
        
        this.vertical = this.bottom + this.top;
        this.horizontal = this.left + this.right;
    }
}

class InputOptions {
    // Content
    columns?: string[] = [];
    head?: ContentInput = [];
    body?: ContentInput = [];
    foot?: ContentInput = [];
    
    fromHtml?: string|HTMLTableElement;
    includeHiddenHtml?: boolean = false;
    useCssStyles?: boolean = false;
    
    // Properties
    margin?: InputMargin;
    tableWidth?: 'auto'|'wrap'|number = 'auto';
    tableAlign?: 'left'|'center'|'right' = 'left';
    startY?: false|number = false;
    showHead?: 'firstPage'|'everyPage'|'never' = 'firstPage';
    showFoot?: 'lastPage'|'everyPage'|'never' = 'lastPage';
    tableId?: any = '';

    // Styles
    theme?: 'striped'|'grid'|'plain' = 'striped';
    styles?: InputStyles = {};
    headStyles?: InputStyles = {};
    bodyStyles?: InputStyles = {};
    footStyles?: InputStyles = {};
    columnStyles?: {[key: string]: InputStyles} = {};
    alternateRowStyles?: InputStyles = {};

    // Hooks
    inputParsed?: (data: HookData) => void;
    onDrawCell?: (data: HookData) => void;
    onDrawRow?: (data: HookData) => void;
    addedCell?: (data: HookData) => void;
    addedRow?: (data: HookData) => void;
    addedPage?: (data: HookData) => void;

    constructor(scaleFactor: number, input: InputOptions[]) {
        this.margin = 40 / scaleFactor;
        assign(this, ...input);
        new InputStyles(scaleFactor, {fillColor: 0});
    }
}

export class Table {
    id: string;
    doc: any;
    scaleFactor: number;
    cursor: {x: number, y: number};
    
    columns: Column[];
    cols: Col[];
    body: Row[];
    head: Row[];
    foot: Row[];
    
    pageCount = 1;
    finalY: number;
    margin: Margin;
    tableWidth: string|number;

    hooks = {
        inputParsed: [],
        onDrawCell: [],
        onDrawRow: [],
        addedCell: [],
        addedRow: [],
        addedPage: []
    };
    
    rows() {
        return [].concat(this.head || []).concat(this.body || []).concat(this.foot || []);
    }
    
    constructor(document: any, ...input: InputOptions[]) {
        this.doc = document;
        this.scaleFactor = this.doc.internal.scaleFactor;

        // Extract styles
        let styles = {styles: [], headStyles: [], bodyStyles: [], footStyles: [], alternateRowStyles: [], columnStyles: []};
        for (let [prop, list] of entries(styles)) {
            for (let opts of input) {
                if (opts[prop]) {
                    list.push(opts[prop]);
                    delete opts[prop];
                }
            }
        }

        // Append event handlers instead of replacing them
        for (let [hookName, list] of entries(this.hooks)) {
            for (let opts of input) {
                if (opts[hookName]) {
                    list.push(opts[hookName]);
                    delete opts[hookName];
                }
            }
            var test = 1;
            test = null;
        }
        
        let merged = new InputOptions(this.scaleFactor, input);
        this.margin = new Margin(merged.margin);
        this.tableWidth = merged.tableWidth;

        let content = {};
        if (merged.fromHtml) {
            content = parseHtml(merged.fromHtml, merged.includeHiddenHtml, merged.useCssStyles);
        } 
        
        for (let prop of ['head', 'body', 'foot']) {
            let section = merged[prop] || content[prop] || [];
            let rows = [];
            section = Array.isArray(section) ? section : [section];
            for (var i = 0; i < section.length; i++) {
                var rawRow = section[i];
                let style = i % 2 === 0 ? styles.bodyStyles : assign(styles.bodyStyles, styles.alternateRowStyles);
                let row = new Row(rawRow, i, style);
                for (var j = 0; j < rawRow.length; j++) {
                    row.addCell(rawRow[j], j);
                }
            }
            content[prop] = rows;
        }
    }
    
    callHook(name, additional = {}) {
        this.hooks[name](assign({}, this, additional));
    }
}

export class Row {
    raw: any;
    index: number;
    styles = {};

    cells: {[columnId: string]: Cell} = {};
    spansMultiplePages = false;
    pageCount = 1;
    height = 0;
    y = 0;
    
    constructor(raw, index, styles) {
        this.raw = raw;
        this.index = index;
        this.styles = styles;
    }
    
    addCell(raw, columnId) {
        let cell = new Cell(raw);
        this.cells[columnId] = cell;
        return cell;
    }
}

export class Cell {
    raw: any;
    styles: {};
    rowspan = 1;
    colspan = 1;
    content: string;
    
    constructor(raw) {
        this.raw = raw;
        
        if (typeof raw !== 'object') {
            this.content = raw.content + '';
            this.rowspan = raw.rowspan || 1;
            this.colspan = raw.colspan || 1;
            this.styles = raw.styles || {};
        } else {
            this.content = raw + '';
        }
        
        // New lines should result in linebreak even if not the
        // linebreak overflow method is chosen
        this.content.split(/\r\n|\r|\n/g);
    }
}

interface Col {
    id: string|number;
    index: number;
    styles?: {};
    
    contentWidth?: number;
    preferredWidth?: number;
    calcWidth?: number;
}

export class Column {
    id: string|number;
    index: number;
    styles: {};
    widthStyle: number|string;

    contentWidth = 0;
    preferredWidth = 0;
    width = 0;
    
    constructor(id, index, styles) {
        this.id = id;
        this.index = index;
        this.styles = styles || {};
        this.widthStyle = styles.widthStyle;
    }
}