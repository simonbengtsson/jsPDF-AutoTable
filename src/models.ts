export let table = {};

export class Table {
    settings;
    cursor;
    
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
    
    
    constructor(settings) {
        this.settings = settings;
        
        this.cursor = {
            x: this.margin('left'),
            y: settings.startY === false ? this.margin('top') : settings.startY
        };
    }
    
    margin(side) {
        return this.settings.margin[side];
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
    styles = {};
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
}

export class Column {
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