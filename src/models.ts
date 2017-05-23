import {Config, getDefaults} from "./config";
export let table = {};

export class Table {
    settings;
    cursor;
    doc;
    userStyles;
    
    height = 0;
    width = 0;
    contentWidth = 0;
    preferredWidth = 0;
    rows = [];
    columns = [];
    headerRow = null;
    pageCount = 1;
    pageStartX: number;
    pageStartY: number;
    finalY: number;
    
    constructor(doc) {
        this.doc = doc;
        
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
    raw;
    index;
    cells = {};
    spansMultiplePages = false;
    pageCount = 1;
    height = 0;
    y = 0;
    maxLineCount = 1;
    
    constructor(raw, index) {
        this.raw = raw;
        this.index = index;
    }
}

export class Cell {
    raw;
    styles: any = {};
    text: string|string[] = '';
    contentWidth = 0;
    textPos = {};
    height = 0;
    width = 0;
    x = 0;
    y = 0;
    
    constructor(raw) {
        this.raw = raw;
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
    raw;
    dataKey; // string|number
    index; // number
    options = {};
    contentWidth = 0;
    preferredWidth = 0;
    widthStyle = 'auto';
    width = 0;
    x = 0;
    
    constructor(dataKey, index) {
        this.dataKey = dataKey;
        this.index = index;
    }
}