import {Table} from "./models";

let defaultsDocument = null;
let previousTableState;

let tableState = null;
export let globalDefaults = {};
export let documentDefaults = {};

export default function() {
    return tableState;
}

export function globalSettings() {
    return globalDefaults;
}

export function documentSettings() {
    return documentDefaults;
}

class TableState {
    table: Table;
    doc;
    scaleFactor;
    
    constructor(doc) {
       this.doc = doc;
       this.scaleFactor = doc.internal.scaleFactor;
    }
    
    pageHeight() { return this.doc.internal.pageSize.height; };
    pageWidth() { return this.doc.internal.pageSize.width; }
}

export function setupState(doc) {
    previousTableState = tableState;
    tableState = new TableState(doc);

    if (doc !== defaultsDocument) {
        defaultsDocument = doc;
        documentDefaults = {};
    }
}

export function resetState() {
    tableState = previousTableState;
}

export function setDefaults(defaults, doc = null) {
    if (doc) {
        documentDefaults = defaults || {};
        defaultsDocument = doc;
    } else {
        globalDefaults = defaults || {};
    }
}