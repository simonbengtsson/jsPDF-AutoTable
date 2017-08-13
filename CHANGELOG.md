# BEFORE RELEASE
- Refactor content api to columns, data and headerRows, footerRows
- Refactor to didParseCellText, willDrawCell, didDrawCell, didDrawPage
- Remove all deprecations and add old initialization warning?
- Fix column.raw as in v2.3.2
- Remove column styles, use columns.style instead
- cellPadding, minCellHeight, cellWidth -> minWidth, maxWidth, maxHeight, minHeight (styles becomes cell styles)
- avoidPageSplit -> pageBreak: 'auto'|'avoid'|'always'
- avoidRowSplit -> rowPageBreak: 'auto'|'avoid'|'always'

Deprecation warnings for:
cell.raw.className → cell.raw.content.className
data.row.raw[i].className → data.row.raw[i].content.className
data.row.raw[i].textContent → data.row.raw[i].content.textContent

# Changelog

### 3.0
- Changed initialization to `doc.autoTable({columns: ..., data: ...})`
- Changed getting previous autoTable to `doc.previousAutoTable`
- Changed default overflow method to linebreak (previously it was ellipsize)
- Changed `rowHeight` style to `cellHeight`
- Changed `columnWidth` style to `cellWidth`
- Added native rowspan and colspan support
- Added `html: string|HTMLTableElement`. If set to string it should be a css selector pointing to a table element.
- Added `useCss: boolean` option which decides if css styles should be used when parsing html.
- Added `includeHiddenHTML: boolean` option which enables including hidden html.
- Added `showFooter` option (similar to showHeader)
- Added `footerStyles` option (similar to headerStyles)
- Added `rowPageBreak` option

Deprecations:
- The old initialization `doc.autoTable(columns, data, options)` is now deprecated. 
- `doc.autoTableHtmlToJson()` in favour of html option
- Old way of getting previous autoTable: `doc.autoTable.previous`
- Add new page manually before calling autoTable instead of using pageBreak: always

Migrating to version 3.0 should be rather painless as most changes are backward compatible. 
The lib were pretty much rewritten however so open an issue if you encounter any problems.

Note that the support for the deprecations listed above might removed in upcoming versions.