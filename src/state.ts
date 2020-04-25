import { Table } from './models'
import { UserOptions } from './interfaces'

let defaultsDocument: any = null
let previousTableState: any

let tableState: TableState | any = null
export let globalDefaults: Partial<UserOptions> = {}
export let documentDefaults: Partial<UserOptions> = {}

export default function (): TableState {
  return tableState
}

export function getGlobalOptions(): Partial<UserOptions> {
  return globalDefaults
}

export function getDocumentOptions(): Partial<UserOptions> {
  return documentDefaults
}

interface ITableState {
  table: Table
  doc: any
}

class TableState implements ITableState {
  table: Table
  doc: any

  constructor(doc: any, table: Table) {
    this.doc = doc
    this.table = table
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

  // Hack for lazy init of table property
  const table = {} as Table
  tableState = new TableState(doc, table)

  if (doc !== defaultsDocument) {
    defaultsDocument = doc
    documentDefaults = {}
    documentDefaults = {}
  }
}

export function resetState() {
  tableState = previousTableState
}

export function setDefaults(defaults: Partial<UserOptions>, doc = null) {
  if (doc) {
    documentDefaults = defaults || {}
    defaultsDocument = doc
  } else {
    globalDefaults = defaults || {}
  }
}
