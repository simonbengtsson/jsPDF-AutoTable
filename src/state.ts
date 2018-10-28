import {Table} from "./models";

let defaultsDocument = null;
let previousTableState;

let tableState: TableState = null;
export let globalDefaults = {};
export let documentDefaults = {};

export default function() {
    return tableState;
}

export function getGlobalOptions() {
    return globalDefaults;
}

export function getDocumentOptions() {
    return documentDefaults;
}

class TableState {
    table: Table;
    doc;

    constructor(doc) {
        this.doc = doc;
    }

    pageHeight() {
        return this.pageSize().height;
    };

    pageWidth() {
        return this.pageSize().width;
    };

    pageSize() {
        let pageSize = this.doc.internal.pageSize;
        
        // JSPDF 1.4 uses get functions instead of properties on pageSize
        if (pageSize.width == null) {
            pageSize = {
                width: pageSize.getWidth(),
                height: pageSize.getHeight()
            }
        }
        
        return pageSize;
    };

    scaleFactor() {
        return this.doc.internal.scaleFactor
    };
    
    pageNumber() {
        return this.doc.internal.getNumberOfPages()
    }
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