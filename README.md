# AutoTable - Table plugin for jsPDF

[![Join the chat at https://gitter.im/simonbengtsson/jsPDF-AutoTable](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/simonbengtsson/jsPDF-AutoTable?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Generate PDF tables with javascript**

Check out the [demo](https://simonbengtsson.github.io/jsPDF-AutoTable/) or [examples](https://github.com/simonbengtsson/jsPDF-AutoTable/tree/master/examples).

![sample javascript table pdf](samples.png)

### Installation
Get the library by doing one of those things:
- `npm install jspdf jspdf-autotable`
- Download jspdf and jspdf-autotable from github
- Use a CDN, for example: [https://unpkg.com/jspdf-autotable](https://unpkg.com/jspdf-autotable)

Note! Do not use the bower or meteor's Atmospherejs packages of the library. Those are unsupported and outdated.

### Usage example

```html
<table id="table"><!-- ... --></table>

<script src="jspdf.min.js"></script>
<script src="jspdf.plugin.autotable.min.js"></script>

<script>
    var doc = new jsPDF();
    // You can use html:
    doc.autoTable({html: '#table'});
    
    // Or javascript:
    doc.autoTable({
        head: [['Name', 'Email', 'Country']]
        body: [
            ['David', 'david@example.com', 'Sweden'],
            ['Castille', 'castille@example.com', 'Norway'],
            // ...
        ]
    })
    
    doc.save('table.pdf');
</script>
```

Checkout more examples in [examples.js](examples) which is also the source code for the [demo](https://simonbengtsson.github.io/jsPDF-AutoTable/) documents. 

### Options
Below is a list of all options supported in the plugin. All of them are used in the [examples](examples).

#### Content options
- `html: string|HTMLTableElement` An html table element or a css selector (for example "#table") pointing to one.
- `includeHiddenHTML: boolean = false`
- `head: Cell[][]` For example [['ID', 'Name', 'Country']] [See more](htttp)
- `body: Cell[][]` For example [['1', 'Simon', 'Sweden'], ['2', 'Karl', 'Norway']] [See more](htttp)
- `foot: Cell[][]` For example [['ID', 'Name', 'Country']] [See more](htttp)

#### Styling

- `theme: 'striped'|'grid'|'plain'|'css'`
- `styles: ''`

```js
{
    styles: {},
    headStyles: {},
    bodyStyles: {},
    footStyles: {},
    alternateRowStyles: {},
    columnStyles: {},

    // Properties
    startY: false, // false or number (false indicates the margin top value)
    margin: 40, // a number, array or object
    avoidTableSplit: false,
    avoidRowSplit: false,
    tableWidth: 'auto', // 'auto'|'wrap'|number
    showHeader: 'everyPage', // 'everyPage', 'firstPage', 'never',
    showFooter: 'everyPage', // 'everyPage', 'lastPage', 'never',
    tableLineWidth: 0,
    tableLineColor: 200, // number, array (see color section below)
    tableId: null,
};
```

### Styles
Styles work similar to css and can be overridden by more specific styles. The overriding order is as follows: Default styles <- theme styles <- `styles` <- `headStyles`, `bodyStyles` and `footStyles` <- `alternateRowStyles` <- `columnStyles`.

```javascript
{
    font: "helvetica", // helvetica, times, courier
    fontStyle: 'normal', // normal, bold, italic, bolditalic
    overflow: 'linebreak', // linebreak, ellipsize, visible or hidden
    fillColor: false, // Either false for transparent, rbg array e.g. [255, 255, 255] or gray level e.g 200
    textColor: 20,
    halign: 'left', // left, center, right
    valign: 'top', // top, middle, bottom
    fontSize: 10,
    cellPadding: 5 / state().scaleFactor, // number or {top,left,right,left,vertical,horizontal}
    lineColor: 200, // cell line/border color
    lineWidth: 0 / state().scaleFactor, // cell line/border width
    cellWidth: 'auto', // 'auto'|'wrap'|number
    minCellHeight: 0
}
```

Styles for specific cells can also be applied using either the `eventHandler` (see `Custom style` example) or the `styles` property on the cell definition object (see content section above).

Colors can be specified as a number (255 for white and 0 for black) or an array [red, green, blue] e.g. [255, 0, 0] for red.

### Properties
- `startY` Indicates where the table should start to be drawn on the first page (overriding the margin top value). It can be used for example to draw content before the table. Many examples use this option, but the above use case is presented in the `With content` example. This option can also be specified as a the first argument for autoTable: `doc.autoTable(40, {html: '#table'})`.
- `margin` Similar to margin in css it sets how much spacing it should be around the table on each page. The startY option can be used if the margin top value should be different on the first page. The margin option accepts both a number, an array [top, right, bottom, left] and an object {top: 40, right: 40, bottom: 40, left: 40}. If you want to use the default value and only change one side you can specify it like this: {top: 60}.
- `avoidTableSplit` This option defines the behavior of the table when it will span more than one page. If set to 'true' it will start on a new page if not enough room exists to fit the entire table on the current page.
- `avoidRowSplit` This option defines the behavior of a row when it will span more than one page (using the linebreak overflow method). If set to 'true' it will start on a new page if not enough room exists to fit the entire row on the current page.
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

- `parsingCell` and `parsingRow` - Fired before any calculation has taken place. Can be used to change content for specific cells or rows.
- `addingCell` and `addingRow` - Fired before a cell or row is added on page. Can be used to specify custom styles.
- `addedCell` and `addedRow` - Fired after a cell or row has been added to the page. Can be used to draw content such as images or rectangles etc.
- `addingPage` - Fired each time the plugin adds a new page. Can be used to for example add headers and footers.

*OBS!* Only the `drawCell` event can be used with the native style jspdf style changes such as `doc.setLineWidth`. If you use the other hooks for changing styles, they will be overridden.

### Helper functions
- `doc.autoTableSetDefaults({ ... })`. Use for setting default options for all tables on the specific document. Settings and styles will be overridden in the following order `global` < `document` < `table`. Hooks will be added and not overridden.
- `jsPDF.autoTableSetDefaults({ ... })` Use for setting global defaults which will be applied for all document and tabels.

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
