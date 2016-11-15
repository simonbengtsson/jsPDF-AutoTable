# AutoTable - Table plugin for jsPDF

[![Join the chat at https://gitter.im/simonbengtsson/jsPDF-AutoTable](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/simonbengtsson/jsPDF-AutoTable?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Generate PDF tables with javascript**

Check out the [demo](https://simonbengtsson.github.io/jsPDF-AutoTable/) to get an overview of what can be done with this plugin. Example uses include participant tables, start lists, result lists etc.

![sample javascript table pdf](samples.png)

### Install
Download and include [jspdf.plugin.autotable.js](https://raw.githubusercontent.com/simonbengtsson/jsPDF-AutoTable/master/dist/jspdf.plugin.autotable.js) and [jspdf.min.js](https://raw.githubusercontent.com/MrRio/jsPDF/master/dist/jspdf.min.js).

```html
<script src="bower_components/jspdf/dist/jspdf.min.js"></script>
<script src="bower_components/jspdf-autotable/dist/jspdf.plugin.autotable.js"></script>
```

You can also get the plugin with a package manager:
- `bower install jspdf-autotable`
- `npm install jspdf-autotable` (only client side usage)

Note! If you are using meteor, use the npm release. Do not use the `jspdf:autotable` package on atmosphere as it is currently outdated.

It is also available on cdnjs:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/2.1.0/jspdf.plugin.autotable.js"></script>
```

### Browser support

Tested with IE10, IE11 and modern browsers (chrome, edge, firefox and safari). It will probably work with < IE10 as well but you might have to use an old version of jspdf and/or add polyfills.

### Usage

```javascript
var columns = ["ID", "Name", "Country"];
var rows = [
    [1, "Shaw", "Tanzania", ...],
    [2, "Nelson", "Kazakhstan", ...],
    [3, "Garcia", "Madagascar", ...],
    ...
];

// Only pt supported (not mm or in)
var doc = new jsPDF('p', 'pt');
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

// Only pt supported (not mm or in)
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

See other examples in `/examples/examples.js` which is also the source code for the [demo](https://simonbengtsson.github.io/jsPDF-AutoTable/) documents. 



### Usage with Angular 2 (angular cli v1.0.0-beta.14)

- In an angular cli project run `npm install jspdf-autotable --save`
- Add the `jspdf` and `jspdf-autotable` files to the scripts section in `angular-cli.json` (see below)
- Declare jsPDF as a global variable `declare var jsPDF: any;`, and use as normal in any component

```js
// angular-cli.json
"scripts": [
    "../node_modules/jspdf/dist/jspdf.min.js",
    "../node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.js"
],
```

```js
// app.component.ts or any other component
import { Component } from '@angular/core';

declare var jsPDF: any; // Important

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';
  
  constructor() {
    var doc = new jsPDF('p', 'pt');
    doc.autoTable(columns, data);
    doc.save("table.pdf");
  }
}
```

### Options
All options below are used in `examples.js` so be sure to check it out if in doubt.

```javascript
{
    // Styling
    theme: 'striped', // 'striped', 'grid' or 'plain'
    styles: {},
    headerStyles: {},
    bodyStyles: {},
    alternateRowStyles: {},
    columnStyles: {},

    // Properties
    startY: false, // false (indicates margin top value) or a number
    margin: 40, a number, array or object
    pageBreak: 'auto', // 'auto', 'avoid' or 'always'
    tableWidth: 'auto', // 'auto', 'wrap' or a number, 

    // Hooks
    createdHeaderCell: function (cell, data) {},
    createdCell: function (cell, data) {},
    drawHeaderRow: function (row, data) {},
    drawRow: function (row, data) {},
    drawHeaderCell: function (cell, data) {},
    drawCell: function (cell, data) {},
    addPageContent: function (data) {}
 };
```

### Note on units
Only pt are supported at this stage. The goal is to support all units supported by jspdf including mm and in but currently there is not timeplan for that.

### Styles
Styles work similar to css and can be overriden by more specific styles. The overriding order is as follows: Default styles <- theme styles <- `styles` <- `headerStyles` and `bodyStyles` <- `alternateRowStyles` and `columnStyles`. It is also possible to override specific cell or row styles using for example the `createdCell` hook. Checkout the `Custom style` example for more information.

```javascript
{
	cellPadding: 5,
    fontSize: 10,
    font: "helvetica", // helvetica, times, courier
    lineColor: 200,
    lineWidth: 0,
    fontStyle: 'normal', // normal, bold, italic, bolditalic
    overflow: 'ellipsize', // visible, hidden, ellipsize or linebreak
    fillColor: false, // false for transperant or a color as described below
    textColor: 20,
    halign: 'left', // left, center, right
    valign: 'middle', // top, middle, bottom
    rowHeight: 20,
    columnWidth: 'auto' // 'auto', 'wrap' or a number
}
```
All colors can either be specified as a number (255 white and 0 for black) or an array [red, green, blue] e.g. [255, 255, 255].

Every style above can be changed on a cell by cell basis. However to have different rowHeights for cells in the same row or different columnWidths for cells in the same column is unsupported.

Some of the styles has a matching jspdf set method. For example `lineWidth` corresponds to `doc.setLineWidth()`. More information about those can be found in the jspdf documentation.

### Properties
- `startY` Indicates where the table should start to be drawn on the first page (overriding the margin top value). It can be used for example to draw content before the table. Many examples use this option, but the above use case is presented in the `With content` example.
- `margin` Similar to margin in css it sets how much spacing it should be around the table on each page. The startY option can be used if the margin top value should be different on the first page. The margin option accepts both a number, an array [top, right, bottom, left] and an object {top: 40, right: 40, bottom: 40, left: 40}. If you want to use the default value and only change one side you can specify it like this: {top: 60}.
- `pageBreak` This option defines the behavior of the table when it will span more than one page. If set to 'always' each table will always start on a new page. If set to 'avoid' it will start on a new page if there is not enough room to fit the entire table on the current page. If set to 'auto' it will add a new page only when the next row doesn't fit.
- `tableWidth` This option defines the fixed width of the table if set to a number. If set to 'auto' it will be 100% of width of the pageand if set to 'wrap' it will only be as wide as its content is.  

### Hooks
There are 9 different hooks that gets called at various times during the drawing of the table. If applicable, information about the current cell, row or column are provided to the hook function. In addition to that the following general information is alaways provided in the `data` parameter:
- `pageCount` - The number of pages it currently spans
- `settings` - The user options merged with the default options
- `table` - Information about the table such as the rows, columns and dimensions
- `doc` - The current jspdf instance
- `cursor` - The position at which the next table cell will be drawn. This can be assigned new values to create column and row spans. Checkout the Colspan and Rowspan example for more information.

*OBS!* Only the `drawCell` hook can be used with the native style jspdf style changes such as `doc.setLineWidth`. If you use the other hooks for changing styles, they will be overriden.

### Helper functions
- `autoTableHtmlToJson(tableElem, includeHiddenElements)` Use it to generate the javascript objects required for this library from an html table (see `from html` example). If includeHiddenElements is set to true hidden rows and columns will be included otherwise excluded.
- `autoTableEndPosY()` Use it if you want to know where on the page the the last row were drawn (see `multiple tables` example)
- `autoTableAddPage()` Use in the hooks to continue the table on the next page. Adds a new header automatically.
- `autoTableAddPageContent(hook)` The passed function/hook will be called once for every page there is parts of a autotable on. Useful when having multiple tables spanning over multiple pages that should have the same header for example. The passed function will get the same data object as the hooks function (described above). Make sure this is called before any calls to autoTable.

### Other pdf libraries

- [pdfmake (javascript)](https://github.com/bpampuch/pdfmake) I much prefer the coding style of jspdf over pdfmake, however the tables features of pdfmake are great. And pdfmake have proper support for utf-8 which jspdf lacks.
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
