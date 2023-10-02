import { Table } from './models'
import { Color, Styles, UserOptions } from './config'

let globalDefaults: UserOptions = {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type jsPDFConstructor = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type jsPDFDocument = any

type Opts = { [key: string]: string | number }

export class DocHandler {
  private readonly jsPDFDocument: jsPDFDocument
  readonly userStyles: Partial<Styles>

  constructor(jsPDFDocument: jsPDFDocument) {
    this.jsPDFDocument = jsPDFDocument
    this.userStyles = {
      // Black for versions of jspdf without getTextColor
      textColor: jsPDFDocument.getTextColor
        ? this.jsPDFDocument.getTextColor()
        : 0,
      fontSize: jsPDFDocument.internal.getFontSize(),
      fontStyle: jsPDFDocument.internal.getFont().fontStyle,
      font: jsPDFDocument.internal.getFont().fontName,
      // 0 for versions of jspdf without getLineWidth
      lineWidth: jsPDFDocument.getLineWidth
        ? this.jsPDFDocument.getLineWidth()
        : 0,
      // Black for versions of jspdf without getDrawColor
      lineColor: jsPDFDocument.getDrawColor
        ? this.jsPDFDocument.getDrawColor()
        : 0,
    }
  }

  static setDefaults(defaults: UserOptions, doc: jsPDFDocument | null = null) {
    if (doc) {
      doc.__autoTableDocumentDefaults = defaults
    } else {
      globalDefaults = defaults
    }
  }

  private static unifyColor(c: Color | undefined): number[] | string[] | null {
    if (Array.isArray(c)) {
      return c
    } else if (typeof c === 'number') {
      return [c, c, c]
    } else if (typeof c === 'string') {
      return [c]
    } else {
      return null
    }
  }

  applyStyles(styles: Partial<Styles>, fontOnly = false) {
    // Font style needs to be applied before font
    // https://github.com/simonbengtsson/jsPDF-AutoTable/issues/632

    if (styles.fontStyle)
      this.jsPDFDocument.setFontStyle &&
        this.jsPDFDocument.setFontStyle(styles.fontStyle)
    let { fontStyle, fontName } = this.jsPDFDocument.internal.getFont()
    if (styles.font) fontName = styles.font
    if (styles.fontStyle) {
      fontStyle = styles.fontStyle
      const availableFontStyles = this.getFontList()[fontName]
      if (
        availableFontStyles &&
        availableFontStyles.indexOf(fontStyle) === -1
      ) {
        // Common issue was that the default bold in headers
        // made custom fonts not work. For example:
        // https://github.com/simonbengtsson/jsPDF-AutoTable/issues/653
        this.jsPDFDocument.setFontStyle &&
          this.jsPDFDocument.setFontStyle(availableFontStyles[0])
        fontStyle = availableFontStyles[0]
      }
    }
    this.jsPDFDocument.setFont(fontName, fontStyle)

    if (styles.fontSize) this.jsPDFDocument.setFontSize(styles.fontSize)

    if (fontOnly) {
      return // Performance improvement
    }

    let color = DocHandler.unifyColor(styles.fillColor)
    if (color) this.jsPDFDocument.setFillColor(...color)

    color = DocHandler.unifyColor(styles.textColor)
    if (color) this.jsPDFDocument.setTextColor(...color)

    color = DocHandler.unifyColor(styles.lineColor)
    if (color) this.jsPDFDocument.setDrawColor(...color)

    if (typeof styles.lineWidth === 'number') {
      this.jsPDFDocument.setLineWidth(styles.lineWidth)
    }
  }

  splitTextToSize(text: string | string[], size: number, opts: Opts): string[] {
    return this.jsPDFDocument.splitTextToSize(text, size, opts)
  }

  /**
   * Adds a rectangle to the PDF
   * @param x Coordinate (in units declared at inception of PDF document) against left edge of the page
   * @param y Coordinate (in units declared at inception of PDF document) against upper edge of the page
   * @param width Width (in units declared at inception of PDF document)
   * @param height Height (in units declared at inception of PDF document)
   * @param fillStyle A string specifying the painting style or null. Valid styles include: 'S' [default] - stroke, 'F' - fill, and 'DF' (or 'FD') - fill then stroke. In "compat" API mode, a null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument. **In "advanced" API mode this parameter is deprecated.**
   */
  rect(x: number, y: number, width: number, height: number, fillStyle: 'S' | 'F' | 'DF' | 'FD' | null) {
    if (!['S', 'F', 'DF', 'FD', null].some((v) => v === fillStyle)) {
      throw new TypeError(
        `Invalid value '${fillStyle}' passed to rect. Allowed values are: 'S', 'F', 'DF', 'FD', null`
      )
    }
    return this.jsPDFDocument.rect(x, y, width, height, fillStyle)
  }

  getLastAutoTable(): Table | null {
    return this.jsPDFDocument.lastAutoTable || null
  }

  getTextWidth(text: string | string[]): number {
    return this.jsPDFDocument.getTextWidth(text)
  }

  getDocument() {
    return this.jsPDFDocument
  }

  setPage(page: number) {
    this.jsPDFDocument.setPage(page)
  }

  addPage() {
    return this.jsPDFDocument.addPage()
  }

  getFontList(): { [key: string]: string[] | undefined } {
    return this.jsPDFDocument.getFontList()
  }

  getGlobalOptions(): UserOptions {
    return globalDefaults || {}
  }

  getDocumentOptions(): UserOptions {
    return this.jsPDFDocument.__autoTableDocumentDefaults || {}
  }

  pageSize(): { width: number; height: number } {
    let pageSize = this.jsPDFDocument.internal.pageSize

    // JSPDF 1.4 uses get functions instead of properties on pageSize
    if (pageSize.width == null) {
      pageSize = {
        width: pageSize.getWidth(),
        height: pageSize.getHeight(),
      }
    }

    return pageSize
  }

  scaleFactor(): number {
    return this.jsPDFDocument.internal.scaleFactor
  }

  get lineHeightFactor(): number {
    const doc = this.jsPDFDocument
    return doc.getLineHeightFactor ? doc.getLineHeightFactor() : 1.15
  }

  getLineHeight(fontSize: number): number {
    return (fontSize / this.scaleFactor()) * this.lineHeightFactor
  }

  pageNumber(): number {
    const pageInfo = this.jsPDFDocument.internal.getCurrentPageInfo()
    if (!pageInfo) {
      // Only recent versions of jspdf has pageInfo
      return this.jsPDFDocument.internal.getNumberOfPages()
    }
    return pageInfo.pageNumber
  }
}
