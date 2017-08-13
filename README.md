# AutoTable - Table plugin for jsPDF

[![Join the chat at https://gitter.im/simonbengtsson/jsPDF-AutoTable](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/simonbengtsson/jsPDF-AutoTable?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Generate PDF tables with javascript**

Check out the [demo](https://simonbengtsson.github.io/jsPDF-AutoTable/) or [examples](https://github.com/simonbengtsson/jsPDF-AutoTable/tree/master/examples).

![sample javascript table pdf](samples.png)

### Install
Download and include [jspdf.min.js](https://raw.githubusercontent.com/MrRio/jsPDF/master/dist/jspdf.min.js) and [jspdf.plugin.autotable.js](https://raw.githubusercontent.com/simonbengtsson/jsPDF-AutoTable/master/dist/jspdf.plugin.autotable.min.js).

```html
<script src="jspdf.min.js"></script>
<script src="jspdf.plugin.autotable.min.js"></script>
```

You can also get the plugin with a package manager:
- `bower install jspdf-autotable`
- `npm install jspdf-autotable` (only client side usage)

Or CDN:
```html
<script src="https://unpkg.com/jspdf-autotable"></script>
<script src="https://unpkg.com/jspdf"></script>
```

Note! If you are using meteor, use the npm release. Do not use the `jspdf:autotable` package on atmosphere (outdated and not supported).

### Usage

```javascript
var columns = ["ID", "Name", "Country"];
var rows = [
    [1, "Shaw", "Tanzania", ...],
    [2, "Nelson", "Kazakhstan", ...],
    [3, "Garcia", "Madagascar", ...],
    ...
];

var doc = new jsPDF();
doc.autoTable(columns, rows);
doc.save('table.pdf');
```

You can also use it with webpack, requirejs and other module bundlers ([examples](examples)).

### Usage with options

```javascript
var columns = [
    {title: "ID", dataKey: "id"},
    {title: "Name", dataKey: "name"}, 
    {title: "Country", dataKey: "country"}, 
    ...
];
var rows = [
    {"id": 1, "name": "Shaw", "country": "Tanzania", ...},
    {"id": 2, "name": "Nelson", "country": "Kazakhstan", ...},
    {"id": 3, "name": "Garcia", "country": "Madagascar", ...},
    ...
];

var doc = new jsPDF('p', 'pt');
doc.autoTable(columns, rows, {
    styles: {fillColor: [100, 255, 255]},
    columnStyles: {
    	id: {fillColor: 255}
    },
    margin: {top: 60},
    addPageContent: function(data) {
    	doc.text("Header", 40, 30);
    }
});
doc.save('table.pdf');
```

Checkout more examples in [examples.js](examples) which is also the source code for the [demo](https://simonbengtsson.github.io/jsPDF-AutoTable/) documents. 

### Options
Below is a list of all options supported in the plugin. All of them are used in the [examples](examples) so be sure to check them out if in doubt.

```javascript
{    
    // Content
    head: null,
    body: null,
    foot: null,
    html: null,
    includeHiddenHTML: false,
    useCss: false,
    
    // Styling
    theme: 'auto', // 'striped', 'grid' or 'plain'
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
    showHead: 'everyPage', // 'everyPage', 'firstPage', 'never',
    showFoot: 'everyPage', // 'everyPage', 'lastPage', 'never',
    tableLineWidth: 0,
    tableLineColor: 200, // number, array (see color section below)
    tableId: null,
    eventHandler: null, // function handling events
};
```

### Content
    head: null,
    body: null,
    foot: null,
    html: null,
    includeHiddenHTML: false,
    useCss: false,

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
- `startY` Indicates where the table should start to be drawn on the first page (overriding the margin top value). It can be used for example to draw content before the table. Many examples use this option, but the above use case is presented in the `With content` example. This option can also be specified as a the first argument for autoTable: `doc.autoTable(40, {head: ..., body: ...})`.
- `margin` Similar to margin in css it sets how much spacing it should be around the table on each page. The startY option can be used if the margin top value should be different on the first page. The margin option accepts both a number, an array [top, right, bottom, left] and an object {top: 40, right: 40, bottom: 40, left: 40}. If you want to use the default value and only change one side you can specify it like this: {top: 60}.
- `avoidTableSplit` This option defines the behavior of the table when it will span more than one page. If set to 'true' it will start on a new page if not enough room exists to fit the entire table on the current page.
- `avoidRowSplit` This option defines the behavior of a row when it will span more than one page (using the linebreak overflow method). If set to 'true' it will start on a new page if not enough room exists to fit the entire row on the current page.
- `tableWidth` This option defines the fixed width of the table if set to a number. If set to 'auto' it will be 100% of width of the page and if set to 'wrap' it will only be as wide as its content is.  
- `showHead` If set to `firstPage` a header is only drawn on the first page.
- `showFoot` If set to `firstPage` a footer is only drawn on the first page.
- `tableLineWidth` The thickness of the table line/border (0 means no line)
- `tableLineColor`, The table line/border color
- `tableId` Table id that can be set to differntiate between tables in the default option functions. Not used by the plugin itself.
- `eventHandler` Function that handles events. See event handling section.

### Event handling
You can customize the content and styling of the table by setting an `eventHandler` and modify the different properties of the event object.


- `pageCount` - The number of pages the table currently spans
- `settings` - The user options merged with the default options
- `table` - Information about the table such as the rows, columns and dimensions
- `doc` - The current jspdf instance
- `cursor` - 

Event objects have the following definition:
```javascript
{
    type: string; // The event types are listed below
    pageCount: number; // The number of pages the table currently spans
    settings: {}; // User options merged with default options
    doc: any; // The jspdf instance
    cursor: {x: number, y: number}; // The position at which the next table cell will be drawn. This can be assigned new values to create advanced tables.
    addPage: () => void; // A function that can be called to split the table at a current row. Use with the addingRow and addedRow events.

    // Depending on the type of event the following content properties might also be set.
    table?: Table;
    cell?: Cell;
    row?: Row;
    column?: Column;
    section?: 'head'|'body'|'foot';
}
```

See the custom styles example for further information.

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

- Make code changes
- Start watcher with `npm start` (will build files on file changes)
- Test that the examples works in `examples/index.html`
- Commit and submit pull request

### Release workflow (write access to repo required)
- Test and commit code changes 
- Run `npm version <semver|major|minor|patch> -m <optional-commit-message>`
- Manually verify files and look over the examples
- Deploy with `npm run deploy`
