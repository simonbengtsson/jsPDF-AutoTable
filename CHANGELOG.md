# BEFORE RELEASE
- Only print head if first row of body fits on page
- Last row (long example) not getting cut off correctly
- In content example, bug with last row. Background over page number
- addPage and auto startY not working (as seen in defaults example)
- Spans example not working
- Consider columns option

### 3.1
- Additional and updates themes?
- Easier to add image to cells
- Update support for custom fonts (and utf-8)?
- Improved column width calculation (decrease wide columns more)

Deprecation warnings for:
cell.raw.className → data.cell.raw.content.className
data.row.raw[i].className → data.row.raw[i].content.className
data.row.raw[i].textContent → data.row.raw[i].content.textContent

### Content arguments
- There is simply no argument. Everybody seem to be using fromHTML option and head,body,foot is no new concept to learn. It might be some tradeoffs in for more experienced users and in terms of logic. But serisouly is worth it anyhow. Plus, can always add a columns feild which would be same as v2

# Changelog

### 3.0
- Changed initialization to `doc.autoTable({head: ..., body: ...})`
- Changed getting previous autoTable to `doc.previousAutoTable`
- Changed default overflow method to linebreak (previously it was ellipsize)
- Changed `rowHeight` style to `cellHeight`
- Changed `columnWidth` style to `cellWidth`
- Changed and simplified hooks to `didParseCell, willDrawCell, didDrawCell, didDrawPage
- Added native rowspan and colspan support
- Added html initialization with `html: string|HTMLTableElement`. If set to string it should be a css selector pointing to a table element.
- Added `useCss: boolean` option which decides if css styles should be used when parsing html.
- Added `includeHiddenHtml: boolean` option
- Added `showFooter` option (similar to showHeader)
- Added `footerStyles` option (similar to headerStyles)
- Added `rowPageBreak` option
- Added automatic startY when multiple tables are used

Deprecations:
- The old initialization `doc.autoTable(columns, data, options)` is now deprecated. 
- `doc.autoTableHtmlToJson()` in favour of html option
- Old way of getting previous autoTable: `doc.autoTable.previous`

Migrating to version 3.0 should be rather painless as most changes are backwards compatible. The lib was pretty much rewritten however so open an issue if you encounter any problems.

Note that the support for the deprecations listed above might removed in upcoming versions.