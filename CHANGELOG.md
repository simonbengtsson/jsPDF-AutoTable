# Known issues 3.0 alpha (to be fixed before release)
- Go over popular stack overflow and codepens
- Proofread docs and config
- Consider pageCount with no getter
- Document cell definition (colspan, rowspan, styles)
- Try old browsers
- Check file size of dist

### 3.1
- Export API functions as well as adding them to jsPDF prototype
- Look into if tree shaking is possible
- Only print head if first row of body fits on page
- Additional and updated themes?
- Easier way to add image to cells
- Easier way to add links to cells
- Update support for custom fonts (and utf-8)?
- Support dividing wide tables horizontally on multiple pages
- Rewrite docs and examples
- Handle column widths less than 10 and larger than page width
- Improved column width calculation (decrease wide columns more)
- More advanced column props (e.g. with support for footer and header groups?)
- Refactor with typescript support and improved options etc

### Content arguments
- Most seem to be using html initiation and head,body,foot is no new concept to learn. It might be some trade-offs for more experienced users and in terms of logic. But a columns field can be used which would be same as v2

# Changelog

Migrating to version 3.0 should be rather painless as most changes are backwards compatible. The lib was pretty much rewritten however so open an issue if you encounter any problems.

BREAKING: The hooks API has been simplified. Note that colspans and rowspans now is supported so you can use that instead of the old drawCell hack.
- Removed hooks: createdCell, createdHeaderCell, drawHeaderCell, drawCell, drawRow, drawHeaderRow and addPageContent
- Added hooks: didParseCell, willDrawCell, didDrawCell and didDrawPage

All other changes should be backwards compatible, but it's a rewrite of the plugin so file an issue if you encounter something that did not work as expected after upgrading.

### 3.0
- Added native rowspan and colspan support
- Added multiple header rows support
- Added footer rows support
- Added html initialization with `html: string|HTMLTableElement`. If set to string it should be a css selector pointing to a table element.
- Added `useCss: boolean` for using some basic css styles when table initialized from html
- Added `includeHiddenHtml: boolean` option
- Added `showFooter` option (similar to showHeader)
- Added `footerStyles` option (similar to headerStyles)
- Added `rowPageBreak` option
- Added automatic startY when multiple tables are used
- Changed initialization to `doc.autoTable({head: ..., body: ... foot: ..., columns: ...})`
- Changed getting last autoTable instance from `doc.autoTable.previous` to `doc.lastAutoTable`
- Changed default overflow method to linebreak (previously it was ellipsize)
- Changed `rowHeight` style to `cellHeight`
- Changed `columnWidth` style to `cellWidth`
- Changed and simplified hooks to `didParseCell, willDrawCell, didDrawCell, didDrawPage
- Deprecated the old initialization `doc.autoTable(columns, data, options)`
- Deprecated `autoTableHtmlToJson()` in favour of new html option
- Deprecated old way of getting previous autoTable instance `doc.autoTable.previous`
- BREAKING: Old hooks with new ones (See above)
- BREAKING: No longer supports 0.9.x of jsPDF
