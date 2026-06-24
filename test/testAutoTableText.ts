import autoTableText, { TextStyles } from '../src/autoTableText'
import { TextOptions } from '../src/config'

const textSpy = vi.fn()

// Mock jsPDFDocument
const mockDoc = () => ({
  internal: {
    scaleFactor: 1,
    getFontSize: () => 10,
  },
  getLineHeightFactor: () => 1.15,
  getStringUnitWidth: (text: string | string[]) =>
    (Array.isArray(text) ? text.join('').length : text.length) * 2,
  text: textSpy,
})

describe('autoTableText', () => {
  beforeEach(() => {
    textSpy.mockClear()
  })

  it('should pass textOptions to doc.text for simple text', () => {
    const doc = mockDoc()
    const text = 'Test Text'
    const textOptions: TextOptions = { isInputVisual: true }
    const styles: TextStyles = { textOptions }

    autoTableText(text, 10, 10, styles, doc)

    expect(textSpy).toHaveBeenCalledWith(
      text,
      10,
      expect.any(Number),
      textOptions,
    )
  })

  it('should pass textOptions to doc.text for justified text', () => {
    const doc = mockDoc()
    const text = 'Test Text'
    const textOptions: TextOptions = { isInputRtl: true }
    const styles: TextStyles = {
      halign: 'justify',
      maxWidth: 50,
      textOptions,
    }

    autoTableText(text, 10, 10, styles, doc)

    expect(textSpy).toHaveBeenCalledWith(text, 10, expect.any(Number), {
      maxWidth: 50,
      align: 'justify',
      ...textOptions,
    })
  })

  it('should pass textOptions to doc.text for multiline, aligned text', () => {
    const doc = mockDoc()
    const text = ['Erste Zeile', 'Zweite Zeile']
    const textOptions: TextOptions = { isOutputRtl: true }
    const styles: TextStyles = {
      halign: 'right',
      textOptions,
    }

    autoTableText(text, 100, 20, styles, doc)

    expect(textSpy).toHaveBeenNthCalledWith(1, text[0], expect.any(Number), expect.any(Number), textOptions)
    expect(textSpy).toHaveBeenNthCalledWith(2, text[1], expect.any(Number), expect.any(Number), textOptions)
  })
})
