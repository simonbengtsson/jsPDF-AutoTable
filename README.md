<a href='https://ko-fi.com/A535IR4' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://az743702.vo.msecnd.net/cdn/kofi4.png?v=f' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a> 
# AutoTable - Table plugin for jsPDF

**Generate PDF tables with Javascript**

This jsPDF plugin aims at making it easy to generate pdf tables either from HTML or directly from Javascript. Check out the [demo](https://simonbengtsson.github.io/jsPDF-AutoTable/) or [examples](https://github.com/simonbengtsson/jsPDF-AutoTable/tree/master/examples).

![sample javascript table pdf](samples.png)

### Installation
Get the library by doing one of these things:
- `npm install jspdf jspdf-autotable`
- Download [jspdf](https://raw.githubusercontent.com/MrRio/jsPDF/master/dist/jspdf.min.js) and [jspdf-autotable](https://raw.githubusercontent.com/simonbengtsson/jsPDF-AutoTable/master/dist/jspdf.plugin.autotable.js) from github
- Use a CDN, for example: [https://unpkg.com/jspdf](https://unpkg.com/jspdf) and [https://unpkg.com/jspdf-autotable](https://unpkg.com/jspdf-autotable)

Note! Do not use the bower or meteor's Atmospherejs packages of the library. Those are unsupported and outdated.

### Usage example

```html
<table id="my-table"><!-- ... --></table>

<script src="jspdf.min.js"></script>
<script src="jspdf.plugin.autotable.min.js"></script>

<script>
    var doc = new jsPDF();
    // You can use html:
    doc.autoTable({html: '#my-table'});
    
    // Or javascript:
    doc.autoTable({
        head: [['Name', 'Email', 'Country']]
        body: [
            ['David', 'david@example.com', 'Sweden'],
            ['Castille', 'castille@example.com', 'Norway'],
            // ...
        ]
    });
    
    doc.save('table.pdf');
</script>
```

Or if using javascript modules and es6:

```js
import jsPDF from 'jspdf';
doc.autoTable({html: '#my-table'});
import 'jspdf-autotable';

const doc = new jsPDF();
doc.autoTable({html: '#my-table'});
doc.save('table.pdf');
```

Checkout more examples in [examples.js](examples) which is also the source code for the [demo](https://simonbengtsson.github.io/jsPDF-AutoTable/) documents. 

### Options
Below is a list of all options supported in the plugin. All of them are used in the [examples](examples).

#### Content options
Either the body or html option is required and cannot be used at the same time. If you want more control over the columns you can specify the columns property. It is not needed however and if not set the columns will be automatically computed based on the content of the head, body and foot.

- `head: Cell[][]` For example [['ID', 'Name', 'Country']]
- `body: Cell[][]` For example [['1', 'Simon', 'Sweden'], ['2', 'Karl', 'Norway']]
- `foot: Cell[][]` For example [['ID', 'Name', 'Country']]
- `columns: Column[]` For example [{title: 'ID', dataKey: 'id'}, {header: 'Name', dataKey: 'name'}]
- `html: string|HTMLTableElement` An html table element or a css selector (for example "#table").
- `includeHiddenHTML: boolean = false`

#### Styling

- `theme: 'striped'|'grid'|'plain'|'css' = 'striped'` 
- `styles: StyleDefinition`
- `headStyles: StyleDefinition`
- `bodyStyles: StyleDefinition`
- `footStyles: StyleDefinition`
- `alternateRowStyles: StyleDefinition`
- `columnStyles: StyleDefinition`

### Others
- `startY: number = null`
- `margin: Margin = 40`
- `pageBreak: 'auto'|'avoid'|'always'`
- `rowPageBreak: 'auto'|'avoid' = 'auto'`
- `tableWidth: 'auto'|'wrap'|number = 'auto'`
- `showHead: 'everyPage'|'lastPage'|'never' = 'everyPage''`
- `showFoot: 'everyPage'|'lastPage'|'never' = 'everyPage''`
- `tableLineWidth: number = 0`
- `tableLineColor: Color = 200`

### StyleDefinition
Styles work similar to css and can be overridden by more specific styles. The overriding order is as follows: 
1. Theme styles
2. `styles`
3. `headStyles`, `bodyStyles` and `footStyles`
4. `alternateRowStyles`
5. `columnStyles`

## Reference

StyleDefinition:
- `font: 'helvetica'|'times'|'courier' = 'helvetica'`
- `fontStyle: 'normal'|'bold'|'italic'|'bolditalic' = 'normal'`
- `overflow: 'linebreak'|'ellipsize'|'visible'|'hidden' = 'normal'`
- `fillColor: Color? = null`
- `textColor: Color? = 20`
- `cellWidth: 'auto'|'wrap'|number = 'auto'`
- `minCellHeight: number = 0`
- `halign: 'left'|'center'|'right' = 'left'`
- `valign: 'top'|'middle'|'bottom' = 'top'`
- `fontSize: number = 10`
- `cellPadding: Padding = 10`
- `lineColor: Color = 10`
- `lineWidth: number = 0` // If 0, no border is drawn

Color: Either false for transparent, rbg array e.g. [255, 255, 255] or gray level e.g 200

Styles for specific cells can also be applied using either the `eventHandler` (see `Custom style` example) or the `styles` property on the cell definition object (see content section above).

Colors can be specified as a number (255 for white and 0 for black) or an array [red, green, blue] e.g. [255, 0, 0] for red.

### Properties
- `startY` Indicates where the table should start to be drawn on the first page (overriding the margin top value). It can be used for example to draw content before the table. Many examples use this option, but the above use case is presented in the `With content` example. This option can also be specified as a the first argument for autoTable: `doc.autoTable(40, {html: '#table'})`.
- `margin` Similar to margin in css it sets how much spacing it should be around the table on each page. The startY option can be used if the margin top value should be different on the first page. The margin option accepts both a number, an array [top, right, bottom, left] and an object {top: 40, right: 40, bottom: 40, left: 40}. If you want to use the default value and only change one side you can specify it like this: {top: 60}.
- `pageBreak` This option defines the behavior of the table when it will span more than one page. If set to 'avoid' it will start drawing table on a new page if not enough room exists to fit the entire table on the current page.
- `rowPageBreak` This option defines the behavior of a row when it doesn't fit on the current page (using the linebreak overflow method). If set to 'auto' it will start on a new page if not enough room exists to fit the entire row on the current page.
- `tableWidth` This option defines the fixed width of the table if set to a number. If set to 'auto' it will be 100% of width of the page and if set to 'wrap' it will only be as wide as its content is.  
- `showHeader` If set to `firstPage` a header is only drawn on the first page.
- `showFooter` If set to `firstPage` a footer is only drawn on the first page.
- `tableLineWidth` The thickness of the table line/border (0 means no line)
- `tableLineColor`, The table line/border color
- `tableId` Table id that can be set to differntiate between tables in the default option functions. Not used by the plugin itself.
- `eventHandler` Function that handles events. See event handling section.

### Hooks
You can customize the content and styling of the table by using the hooks.

See the custom styles example for usage of the hooks.

- `didParseCell` - Called when the plugin finished parsing cell content. Can be used to override content or styles for a specific cell.
- `willDrawCell` - Called before a cell or row is drawn. Can be used to call native jspdf styling functions such as `doc.setTextColor` or change position of text etc before it is drawn.
- `didDrawCell` - Called after a cell has been added to the page. Can be used to draw additional cell content such as images with `doc.addImage`, additional text with `doc.addText` or other jspdf shapes.
- `didDrawPage` - Called after the plugin has finished drawing everything on a page. Can be used to add headers and footers with page numbers or any other content that you want on each page there is an autotable.

Note that the hooks will only be called for body cells by default. Turn on the `allSectionHooks` option if you want it to be called for head and foot cells as well.

*OBS!* Only the `willDrawCell` hook can be used with native jspdf style changes such as `doc.setLineWidth`. Such styling changes will be overriden when used in any other hook.

### API
- `doc.autoTable({ /* ... */ })` Main 
- `doc.autoTable({ /* ... */ })`
- `doc.autoTableSetDefaults({ /* ... */ })` Use for setting default options for all tables on the specific document. Settings and styles will be overridden in the following order `global` < `document` < `table`. Hooks will be added and not overridden.
- `jsPDF.autoTableSetDefaults({ /* ... */ })` Use for setting global defaults which will be applied for all document and tabels.

If you want to know something about the last table that was drawn you can use `doc.previousAutoTable`. It has a `doc.previousAutoTable.finalY` property among other things that has the value of the last printed y coordinate on a page. This can be used to draw text, multiple tables or other content after a table.

### Other pdf libraries

- [pdfmake (javascript)](https://github.com/bpampuch/pdfmake) I much prefer the coding style of jspdf over pdfmake, however the tables features of pdfmake are great. And pdfmake have proper support for utf-8 which jspdf lacks. The minified version of pdfmake is about 1MB while jspdf is closer to 250KB.
- [Included jsPDF table plugin](https://github.com/MrRio/jsPDF/blob/master/jspdf.plugin.cell.js) No up to date documentation of how to use it (?) and has bugs.
- [fpdf (php)](http://www.fpdf.org/) and [pdfbox (java)](https://pdfbox.apache.org/) No included table features and have to be used server side.

### Contributions
Contributions are always welcome, especially on open issues. If you have something major you want to add or change, please post an issue about it first to discuss it further. The workflow for contributing would be something like this:

- Start watcher with `npm start`
- Make code changes
- Make sure all examples works
- Commit and submit pull request

### Release workflow (write access required)
- Test and commit code changes 
- `npm version <semver|major|minor|patch>`
- Verify examples
- `npm run deploy`

### Release prerelease
- `npm version prerelease`
- `git push && git push --tags && npm publish`
