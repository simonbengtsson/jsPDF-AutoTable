import { Styles, UserInput } from './interfaces'
import { Table } from './models'

let globalDefaults: UserInput = {}

export class DocHandler {
  private readonly doc: any

  constructor(doc: any) {
    this.doc = doc
  }

  static setDefaults(defaults: UserInput, doc: any = null) {
    if (doc) {
      doc.__autoTableDocumentDefaults = defaults
    } else {
      globalDefaults = defaults
    }
  }

  getUserStyles(): Partial<Styles> {
    return {
      // Black for versions of jspdf without getTextColor
      textColor: this.doc.getTextColor ? this.doc.getTextColor() : 0,
      fontSize: this.doc.internal.getFontSize(),
      fontStyle: this.doc.internal.getFont().fontStyle,
      font: this.doc.internal.getFont().fontName,
    }
  }

  applyStyles(styles: {[key: string]: any}, fontOnly = false) {
    const nonFontModifiers = {
      fillColor: this.doc.setFillColor,
      textColor: this.doc.setTextColor,
      lineColor: this.doc.setDrawColor,
      lineWidth: this.doc.setLineWidth,
    }
    const styleModifiers: { [key: string]: any } = {
      // Font style needs to be applied before font
      // https://github.com/simonbengtsson/jsPDF-AutoTable/issues/632
      fontStyle: this.doc.setFontStyle,
      font: this.doc.setFont,
      fontSize: this.doc.setFontSize,
      ...(fontOnly ? {} : nonFontModifiers),
    }

    Object.keys(styleModifiers).forEach((name) => {
      const style = styles[name]
      const modifier = styleModifiers[name]
      if (typeof style !== 'undefined') {
        if (Array.isArray(style)) {
          modifier(...style)
        } else {
          modifier(style)
        }
      }
    })
  }

  splitTextToSize(...args: any[]): string[] {
    return this.doc.splitTextToSize(...args)
  }

  rect(...args: any[]) {
    return this.doc.rect(...args)
  }

  getPreviousAutoTable(): Table {
    return this.doc.previousAutoTable
  }

  getTextWidth(text: string|string[]): number {
    return this.doc.getTextWidth(text)
  }

  getDocument() {
    return this.doc
  }

  setPage(page: number) {
    this.doc.setPage(page)
  }

  addPage() {
    return this.doc.addPage()
  }

  getFontList(...args: any[]) {
    return this.doc.getFontList(...args)
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
