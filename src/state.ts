import {Table} from "./models";

export var table: Table;
export var doc;
export var scaleFactor;
export var documentSettings = {};
export var globalSettings = {};

let defaultsDocument = null;

export function init(document) {
    doc = document;
    scaleFactor = doc.internal.scaleFactor;
    
    if (doc !== defaultsDocument) {
        documentSettings = {};
    }
}

// TODO Find way to not have table in state
export function setTable(tableInstance) {
    table = tableInstance;
}

export function clean() {
    table = null;
    doc = null;
    scaleFactor = null;
}

export function setDefaults(defaults, doc = null) {
    if (doc) {
        documentSettings = defaults || {};
        defaultsDocument = doc;
    } else {
        globalSettings = defaults || {};
    }
}