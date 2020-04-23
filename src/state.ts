import { Table } from './models'

let defaultsDocument: any = null
let previousTableState: any

let tableState: any = null
export let globalDefaults = {}
export let documentDefaults = {}

export default function (): TableState {
  return tableState
}

export function getGlobalOptions(): any {
  return globalDefaults
}

export function getDocumentOptions(): any {
  return documentDefaults
}

class TableState {
  table: Table | any
  doc: any

  constructor(doc: any) {
    this.doc = doc
  }

  pageHeight() {
    return this.pageSize().height
  }

  pageWidth() {
    return this.pageSize().width
  }

  pageSize() {
    let pageSize = this.doc.internal.pageSize

    // JSPDF 1.4 uses get functions instead of properties on pageSize
    if (pageSize.width == null) {
      pageSize = {
        width: pageSize.getWidth(),
        height: pageSize.getHeight(),
      }
    }

    return pageSize
  }

  scaleFactor() {
    return this.doc.internal.scaleFactor
  }

  pageNumber() {
    const pageInfo = this.doc.internal.getCurrentPageInfo()
    if (!pageInfo) {
      // Only recent versions of jspdf has pageInfo
      return this.doc.internal.getNumberOfPages()
    }
    return pageInfo.pageNumber
  }
}

export function setupState(doc: any) {
  previousTableState = tableState
  tableState = new TableState(doc)

  if (doc !== defaultsDocument) {
    defaultsDocument = doc
    documentDefaults = {}
  }
}

export function resetState() {
  tableState = previousTableState
}

export function setDefaults(defaults: any, doc = null) {
  if (doc) {
    documentDefaults = defaults || {}
    defaultsDocument = doc
  } else {
    globalDefaults = defaults || {}
  }
}
