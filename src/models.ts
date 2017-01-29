import {Config, getDefaults} from "./config";
import {ATEvent} from "./ATEvent";   
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

    columns: Column[] = [];
    
    head: Row[] = [];
    body: Row[] = [];
    foot: Row[] = [];
    
    height = 0;
    width = 0;
    contentWidth = 0;
    preferredWidth = 0;
    headHeight = 0;
    footHeight = 0;
    
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

    eventHandlers: ((event: ATEvent) => void|boolean)[] = [];

    constructor(doc) {
        this.doc = doc;
        this.scaleFactor = doc.internal.scaleFactor;

        this.userStyles = {
            textColor: 30, // Setting text color to dark gray as it can't be obtained from jsPDF
            fontSize: doc.internal.getFontSize(),
            fontStyle: doc.internal.getFont().fontStyle
        };
    }
    
    allRows() {
        return this.head.concat(this.body).concat(this.foot);
    }
    
    emitEvent(event: ATEvent): void|boolean {
        for (let handler of this.eventHandlers) {
            if (handler(event) === false) {
                return false;
            }
        }
    }
    
    margin(side) {
        return Config.marginOrPadding(this.settings.margin, getDefaults().margin)[side];
    }
}

export class Row {
    raw: HTMLTableRowElement|any;
    index: number;
    cells = {};
    section: 'head'|'body'|'foot';
    
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
    raw: HTMLTableCellElement|any;
    styles: any;
    text: string[];
    section: 'head'|'body'|'foot';
    
    contentWidth = 0;
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
    
    preferredWidth = 0;
    contentWidth = 0;
    width = 0;
    
    constructor(dataKey) {
        this.dataKey = dataKey;
    }
}