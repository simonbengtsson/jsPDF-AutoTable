# AutoTable - Table plugin for jsPDF

[![Join the chat at https://gitter.im/someatoms/jsPDF-AutoTable](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/someatoms/jsPDF-AutoTable?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Generate PDF tables with javascript**

Check out the [demo](https://someatoms.github.io/jsPDF-AutoTable/) to get an overview of what can be done with this plugin. Example uses include participant tables, start lists, result lists etc.

![sample javascript table pdf](samples.png)

### Install
Download and include [jspdf.plugin.autotable.js](https://someatoms.github.io/jsPDF-AutoTable/) and [jspdf.min.js](https://raw.githubusercontent.com/MrRio/jsPDF/master/dist/jspdf.min.js).

```html
<script src="bower_components/jspdf/dist/jspdf.min.js"></script>
<script src="bower_components/jspdf-autotable/jspdf.plugin.autotable.js"></script>
```

You can also get the plugin with bower `bower install jspdf-autotable` and meteor `meteor add jspdf:autotable`.

### Usage

```javascript
var columns = ["ID", "Name", "Country"];
var rows = [
    [1, "Shaw", "Tanzania", ...],
    [2, "Nelson", "Kazakhstan", ...],
    [3, "Garcia", "Madagascar", ...],
    ...
];

var doc = new jsPDF('p', 'pt');
doc.autoTable(columns, rows);
doc.save('table.pdf');
```

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
    beforePageContent: function(data) {
    	doc.text("Header", 40, 30);
    }
});
doc.save('table.pdf');
```

See other examples in `/examples/examples.js` which is also the source code for the [demo](https://someatoms.github.io/jsPDF-AutoTable/) documents.

### All options and their default values
There are three kinds of options: styling, properties and hooks. You can override the default specified hooks if you want to change data or styles dynamically. For example 

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
    startY: false, // false indicates the margin top value
    margin: 40,
    pageBreak: 'auto', // 'auto', 'avoid' or 'always'
    tableWidth: 'auto', // a number, 'auto' or 'wrap'

    // Hooks
    createdHeaderCell: function (cell, data) {},
    createdCell: function (cell, data) {},
    drawHeaderRow: function (row, data) {},
    drawRow: function (row, data) {},
    drawHeaderCell: function (cell, data) {},
    drawCell: function (cell, data) {},
    beforePageContent: function (data) {},
    afterPageContent: function (data) {}
 };
```

### Default styles
 

```javascript
{
	cellPadding: 5,
    fontSize: 10,
    font: "helvetica", // helvetica, times, courier
    lineColor: 200,
    lineWidth: 0.1,
    fontStyle: 'normal', // normal, bold, italic, bolditalic
    overflow: 'ellipsize', // visible, hidden, ellipsize or linebreak
    fillColor: 255,
    textColor: 20,
    halign: 'left', // left, center, right
    valign: 'middle', // top, middle, bottom
    fillStyle: 'F', // 'S', 'F' or 'DF' (stroke, fill or fill then stroke)
    rowHeight: 20,
    columnWidth: 'auto'
}
```

### CDN (for testing only!)
- Experimental: https://rawgit.com/someatoms/jsPDF-AutoTable/v2/jspdf.plugin.autotable.js
- Stable: https://rawgit.com/someatoms/jsPDF-AutoTable/master/jspdf.plugin.autotable.js

### Upgrade to Version 2.0
- Use the hooks (or  styles and themes) instead of `renderCell`, `renderHeaderCell`, `renderFooter`and `renderHeader`
- Custom column width now specified with the style columnWidth
- Use `tableWidth` instead of `extendWidth`
- Use `columnWidth: 'wrap'` instead of `overflowColumns` 
- Use `pageBreak` instead of `avoidPageSplit`
- Use `margin` instead of `margins`
- `autoTableHtmlToJson` now always returns an object
- Use `API.autoTableEndPosY()` instead of `API.autoTableEndPos()`

### Other pdf libraries

#### [pdfmake (javascript)](https://github.com/bpampuch/pdfmake)
I much prefer the coding style of jspdf over pdfmake, however the tables features of pdfmake are great.

#### [Included jsPDF table plugin](https://github.com/MrRio/jsPDF/blob/master/jspdf.plugin.cell.js)
No up to date documentation of how to use it (?) and has bugs. You might find it useful however.
 
#### [fpdf (php)](http://www.fpdf.org/) and [pdfbox (java)](https://pdfbox.apache.org/) 
No included table features and have to be used server side.

### Questions and issues
If you have questions regarding how to use this plugin, please post on stackoverflow with the `jspdf-autotable` tag and I will try to answer them. If you think you have found a problem with the plugin feel free to create an issue on Github. However, try to replicate the issue on `codepen` or some similar service first. Here is a [codepen](http://codepen.io/someatoms/pen/EjwPEb) with `jspdf` and `jspdf-autotable` included that you can fork.

### Contributions
Contributions are always welcome, especially on open issues. If have something major you want to add or change, please post an issue about it first.
