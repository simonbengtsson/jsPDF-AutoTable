/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocHandler } from './documentHandler'
import { HookData } from './HookData'
import { UserOptions } from './config'

export default function (
  doc: DocHandler,
  global: UserOptions,
  document: UserOptions,
  current: UserOptions
) {
  for (const options of [global, document, current] as any) {
    if (options && typeof options !== 'object') {
      console.error(
        'The options parameter should be of type object, is: ' + typeof options
      )
    }
    if (typeof options.extendWidth !== 'undefined') {
      options.tableWidth = options.extendWidth ? 'auto' : 'wrap'
      console.error(
        'Use of deprecated option: extendWidth, use tableWidth instead.'
      )
    }
    if (typeof options.margins !== 'undefined') {
      if (typeof options.margin === 'undefined')
        options.margin = options.margins
      console.error('Use of deprecated option: margins, use margin instead.')
    }
    if (options.startY && typeof options.startY !== 'number') {
      console.error('Invalid value for startY option', options.startY)
      delete options.startY
    }

    if (
      !options.didDrawPage &&
      (options.afterPageContent ||
        options.beforePageContent ||
        options.afterPageAdd)
    ) {
      console.error(
        'The afterPageContent, beforePageContent and afterPageAdd hooks are deprecated. Use didDrawPage instead'
      )
      options.didDrawPage = function (data: HookData) {
        doc.applyStyles(doc.userStyles)
        if (options.beforePageContent) options.beforePageContent(data)
        doc.applyStyles(doc.userStyles)
        if (options.afterPageContent) options.afterPageContent(data)
        doc.applyStyles(doc.userStyles)

        if (options.afterPageAdd && data.pageNumber > 1) {
          ;(data as any).afterPageAdd(data)
        }
        doc.applyStyles(doc.userStyles)
      }
    }

    ;[
      'createdHeaderCell',
      'drawHeaderRow',
      'drawRow',
      'drawHeaderCell',
    ].forEach((name) => {
      if (options[name]) {
        console.error(
          `The "${name}" hook has changed in version 3.0, check the changelog for how to migrate.`
        )
      }
    })
    ;[
      ['showFoot', 'showFooter'],
      ['showHead', 'showHeader'],
      ['didDrawPage', 'addPageContent'],
      ['didParseCell', 'createdCell'],
      ['headStyles', 'headerStyles'],
    ].forEach(([current, deprecated]) => {
      if (options[deprecated]) {
        console.error(
          `Use of deprecated option ${deprecated}. Use ${current} instead`
        )
        options[current] = options[deprecated]
      }
    })
    ;[
      ['padding', 'cellPadding'],
      ['lineHeight', 'rowHeight'],
      'fontSize',
      'overflow',
    ].forEach(function (o) {
      const deprecatedOption = typeof o === 'string' ? o : o[0]
      const style = typeof o === 'string' ? o : o[1]
      if (typeof options[deprecatedOption] !== 'undefined') {
        if (typeof options.styles[style] === 'undefined') {
          options.styles[style] = options[deprecatedOption]
        }
        console.error(
          'Use of deprecated option: ' +
            deprecatedOption +
            ', use the style ' +
            style +
            ' instead.'
        )
      }
    })

    for (const styleProp of [
      'styles',
      'bodyStyles',
      'headStyles',
      'footStyles',
    ]) {
      checkStyles(options[styleProp] || {})
    }

    const columnStyles = options['columnStyles'] || {}
    for (const key of Object.keys(columnStyles)) {
      checkStyles(columnStyles[key] || {})
    }
  }
}

function checkStyles(styles: any) {
  if (styles.rowHeight) {
    console.error(
      'Use of deprecated style rowHeight. It is renamed to minCellHeight.'
    )
    if (!styles.minCellHeight) {
      styles.minCellHeight = styles.rowHeight
    }
  } else if (styles.columnWidth) {
    console.error(
      'Use of deprecated style columnWidth. It is renamed to cellWidth.'
    )
    if (!styles.cellWidth) {
      styles.cellWidth = styles.columnWidth
    }
  }
}
