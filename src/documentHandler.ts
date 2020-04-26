import { Color, Styles, UserInput } from './interfaces'
import { Table } from './models'

let globalDefaults: UserInput = {}

export class DocHandler {
  private readonly doc: any
  readonly userStyles: Partial<Styles>

  constructor(doc: any) {
    this.doc = doc
    this.userStyles = {
      // Black for versions of jspdf without getTextColor
      textColor: doc.getTextColor ? this.doc.getTextColor() : 0,
      fontSize: doc.internal.getFontSize(),
      fontStyle: doc.internal.getFont().fontStyle,
      font: doc.internal.getFont().fontName,
    }
  }

  static setDefaults(defaults: UserInput, doc: any = null) {
    if (doc) {
      doc.__autoTableDocumentDefaults = defaults
    } else {
      globalDefaults = defaults
    }
  }

  private static unifyColor(c: Color | undefined): [number, number, number] | null {
    if (Array.isArray(c)) {
      return c
    } else if (typeof c === 'number') {
      return [c, c, c]
    } else {
      return null
    }
  }

  applyStyles(styles: Partial<Styles>, fontOnly = false) {
    if (fontOnly) {
      // Font style needs to be applied before font
      // https://github.com/simonbengtsson/jsPDF-AutoTable/issues/632
      if (styles.fontStyle) this.doc.setFontStyle(styles.fontStyle)
      if (styles.font) this.doc.setFont(styles.font)
      if (styles.fontSize) this.doc.setFontSize(styles.fontSize)
      return
    }

    let color = DocHandler.unifyColor(styles.fillColor)
    if (color) this.doc.setFillColor(...color)

    color = DocHandler.unifyColor(styles.textColor)
    if (color) this.doc.setTextColor(...color)

    color = DocHandler.unifyColor(styles.lineColor)
    if (color) this.doc.setDrawColor(...color)

    if (typeof styles.lineWidth === 'number') {
      this.doc.setLineWidth(styles.lineWidth)
    }
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

  getTextWidth(text: string | string[]): number {
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
