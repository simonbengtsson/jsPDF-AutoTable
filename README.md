# AutoTable - Table plugin for jsPDF

[![Join the chat at https://gitter.im/someatoms/jsPDF-AutoTable](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/someatoms/jsPDF-AutoTable?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Generate PDF tables with javascript**

Check out the [demo](https://someatoms.github.io/jsPDF-AutoTable/) to get an overview of what can be done with this plugin. I have used it for a lot of projects. Everything from startlists and resultslists for various sports to participanttables of business meetings and events. The goal is to support all kinds of tables and lists.

![sample javascript table pdf](samples.png)

### Install
- Download `jspdf.plugin.autotable.js` or install with bower  `bower install jspdf-autotable`
- Include jsPDF and the plugin

```html
<script src="bower_components/jspdf/dist/jspdf.min.js"></script>
<script src="bower_components/jspdf-autotable/jspdf.plugin.autotable.js"></script>
```

Install within a [Meteor project](http://meteor.com)

[Review the documentation on Atmosphere for the most recent details on this
package](https://atmospherejs.com/jspdf/autotable).

    meteor add jspdf:autotable

### Usage
See more advanced examples in `/examples/examples.js` which is the source code for the [demo](https://someatoms.github.io/jsPDF-AutoTable/) documents.

```javascript
var columns = [
    {title: "ID", key: "id"},
    {title: "Name", key: "name"}, 
    {title: "Country", key: "country"}, 
    ...
];
var rows = [
    {"id": 1, "name": "Shaw", "country": "Tanzania", ...},
    {"id": 2, "name": "Nelson", "country": "Kazakhstan", ...},
    {"id": 3, "name": "Garcia", "country": "Madagascar", ...},
    ...
];

var doc = new jsPDF('p', 'pt');
var options = {}
doc.autoTable(columns, rows, options);
doc.save('table.pdf');
```

### Default options
All the options are used in one or more of the examples (`/examples/examples.js`) in the [demo](https://someatoms.github.io/jsPDF-AutoTable/) so be sure to check them out if in doubt.

```javascript
var options = {
    theme: 'striped', // striped, grid or plain
    styles: {},
    columnStyles: {},
    renderHeader: function (doc, pageNumber, settings) {}, // Called before every page
    renderFooter: function (doc, lastCellPos, pageNumber, settings) {}, // Called at the end of every page
    renderHeaderCell: function (x, y, width, height, key, value, settings) {
        doc.setFillColor(52, 73, 94); // Asphalt
        doc.setTextColor(255, 255, 255);
        doc.setFontStyle('bold');
        doc.rect(x, y, width, height, 'F');
        y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5;
        doc.text('' + value, x + settings.padding, y);
    },
    renderCell: function (x, y, width, height, key, value, row, settings) {
        doc.setFillColor(row % 2 === 0 ? 245 : 255);
        doc.rect(x, y, width, height, 'F');
        y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5;
        doc.text('' + value, x + settings.padding, y);
    },
    margins: { right: 40, left: 40, top: 50, bottom: 40 }, // How much space around the table
    startY: false // The start Y position on the first page. If set to false, top margin is used
    overflowColumns: false, // Specify which colums that gets subjected to the overflow method chosen. false indicates all
    avoidPageSplit: false, // Avoid splitting table over multiple pages (starts drawing table on fresh page instead). Only relevant if startY option is set.
    autoWidth: true // If true, the table will span 100% of page width minus horizontal margins.
 };
```

You can also specify fixed column widths by adding a width property on a column. Like so:

```javascript
var columns = [
    {title: "ID", key: "id", width: 100},
    {title: "Name", key: "name", width: 200},
    ...
];
```

### Other initialize formats

Object initialize is to be preferred for everything but trivial tables. 
It makes it easier to reference a specific column in the options and
also connects headers with its data which prevents headers and data to
get out of sync.

You can also initialize the table from only an object with headers as 
keys. This can be done something like this doc.autoTable(Object.keys(data), data);

### CDN (for testing only!)
- Experimental: https://rawgit.com/someatoms/jsPDF-AutoTable/v2/jspdf.plugin.autotable.js
- Stable: https://rawgit.com/someatoms/jsPDF-AutoTable/master/jspdf.plugin.autotable.js

### Upgrade to Version 2.0
- Use the hooks (or  styles and themes) instead of `renderCell`, `renderHeaderCell`, `renderFooter`and `renderHeader`
- Use `tableWidth` instead of `extendWidth`
- Use `columnOptions` instead of `overflowColumns` 
- Use `pageBreak` instead of `avoidPageSplit`
- Use `margin` instead of `margins`
- `autoTableHtmlToJson` now always returns an object
- Object only initialize removed
- Use `API.autoTableEndPosY()` instead of `API.autoTableEndPos()`

Pros with ids
- Easy to style a specific column
- Force ppl to 

Pros with data
- Don't need parse function
- More like dataTables, like pull request

### Other pdf libraries worth mentioning

#### [Included jsPDF table plugin](https://github.com/MrRio/jsPDF/blob/master/jspdf.plugin.cell.js)
No up to date documentation of how to use it (?) and has bugs. Might be useful for some simple tables however.

#### [pdfmake (javascript)](https://github.com/bpampuch/pdfmake)
I much prefer the coding style of jspdf over pdfmake, however the tables features of pdfmake are great.
 
#### [fpdf (php)](http://www.fpdf.org/) and [pdfbox (java)](https://pdfbox.apache.org/) 
No real table features and have to be used server side.


### Issues, feature requests, contributions
Feature requests, bug reports and pull requests are welcome as issues. Keep in mind that it is much easier to understand a problem with pdf and code attached. Best case scenario is to fork this [codepen](http://codepen.io/someatoms/pen/EjwPEb) and reproduce the issue there.

Planned features:
- Support more units (now only supports pt)
- Columnspan and rowspan
- A wiki describing the options and api methods
