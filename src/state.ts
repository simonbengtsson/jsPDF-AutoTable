import { UserInput } from './interfaces'

let previousDocumentHandler: any
let documentHandler: DocumentHandler | any = null
let globalDefaults: UserInput = {}

export default function (): DocumentHandler {
  return documentHandler
}

class DocumentHandler {
  doc: any

  constructor(doc: any) {
    this.doc = doc
  }

  getGlobalOptions(): UserInput {
    return globalDefaults || {}
  }

  getDocumentOptions(): UserInput {
    return this.doc.__autoTableDocumentDefaults || {}
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
  previousDocumentHandler = documentHandler
  documentHandler = new DocumentHandler(doc)
}

export function resetState() {
  documentHandler = previousDocumentHandler
}

export function setDefaults(defaults: UserInput, doc: any = null) {
  if (doc) {
    doc.__autoTableDocumentDefaults = defaults
  } else {
    globalDefaults = defaults
  }
}
