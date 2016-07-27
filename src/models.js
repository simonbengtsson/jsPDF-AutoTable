export var table = {};

export class Table {
    constructor() {
        this.height = 0;
        this.width = 0;
        this.contentWidth = 0;
        this.rows = [];
        this.columns = [];
        this.headerRow = null;
        this.settings = {};
        this.pageCount = 1;
    }
}

export class Row {
    constructor(raw) {
        this.raw = raw || {};
        this.index = 0;
        this.styles = {};
        this.cells = {};
        this.height = 0;
        this.y = 0;
    }
}

export class Cell {
    constructor(raw) {
        this.raw = raw;
        this.styles = {};
        this.text = '';
        this.contentWidth = 0;
        this.textPos = {};
        this.height = 0;
        this.width = 0;
        this.x = 0;
        this.y = 0;
    }
}

export class Column {
    constructor(dataKey, index) {
        this.dataKey = dataKey;
        this.index = index;
        this.options = {};
        this.styles = {};
        this.contentWidth = 0;
        this.width = 0;
        this.x = 0;
    }
}