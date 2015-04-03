#AutoTable plugin to jsPDF

[![Join the chat at https://gitter.im/someatoms/jsPDF-AutoTable](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/someatoms/jsPDF-AutoTable?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Generate PDF tables or lists with jsPDF**

I couldn't find a way to create javascript tables that fit my needs. Therefore I built a table plugin on top of what I believe is the best web pdf library, jsPDF. 

Some other great pdf libraries/plugins with table support (which I have tried, but decided not to use):

- [Included jsPDF table plugin](https://github.com/MrRio/jsPDF/blob/master/jspdf.plugin.cell.js)
- [jsPdfTablePlugin](https://github.com/Prashanth-Nelli/jsPdfTablePlugin)
- [pdfmake](https://github.com/bpampuch/pdfmake)

### Install
- Download manually or run `bower install jspdf-autotable`
- Include jsPDF and the plugin

```html
<script src="bower_components/jspdf/dist/jspdf.debug.js"></script>
<script src="bower_components/jspdf-autotable/jspdf.plugin.autotable.js"></script>
```

### Features

- Auto width (100% of page width or only as much as required)
- Multiple pages
- Supports initializing with columns and rows as an array of objects or an array of strings
- An option to use a custom cell-renderer function

### Basic example
See the [sample.pdf](https://raw.githubusercontent.com/someatoms/jspdf-autotable/master/sample.pdf).

```javascript
var columns = [
    {title: "ID", key: "id"}, 
    {title: "Name", key: "name"}, 
    {title: "Country", key: "country"}, 
    {title: "IP-address", key: "ip_address"}, 
    {title: "Email", key: "email"}
];
var data = [
    {"id": 1, "name": "Shaw", "country": "Tanzania", "ip_address": "92.44.246.31", "email": "abrown@avamba.info"},
    {"id": 2, "name": "Nelson", "country": "Kazakhstan", "ip_address": "112.238.42.121", "email": "jjordan@agivu.com"},
    {"id": 3, "name": "Garcia", "country": "Madagascar", "ip_address": "39.211.252.103", "email": "jdean@skinte.biz"},
    {"id": 4, "name": "Richardson", "country": "Somalia", "ip_address": "27.214.238.100", "email": "nblack@midel.gov"},
    {"id": 5, "name": "Kennedy", "country": "Libya", "ip_address": "82.148.96.120", "email": "charrison@tambee.name"}
    ...
];
var doc = new jsPDF('p', 'pt');
doc.autoTable(columns, data, {});
doc.save('table.pdf');
```

![sample javascript table pdf](sample.png)

### Documentation

Default options (See the examples folder for instructions how to use)

```javascript
var options = {
    padding: 3, // Horizontal cell padding
    fontSize: 12,
    lineHeight: 20,
    renderHeader: function (doc, pageNumber, settings) {}, // Called before every page
    renderFooter: function (doc, lastCellPos, pageNumber, settings) {}, // Called on the end of every page
    renderCell: function (x, y, w, h, txt, fillColor, options) { // Will render every cell in the table
        doc.setFillColor.apply(this, fillColor);
        doc.rect(x, y, w, h, 'F');
        doc.text(txt, x + options.padding, y + doc.internal.getLineHeight());
    },
    margins: { horizontal: 40, top: 50, bottom: 40 }, // How much space around the table
    startY: 0 // The start Y position on the first page
    extendWidth: true // If true, the table will span 100% of page width minus horizontal margins.
 };
```
The source code is ~200 lines of code so check it out if in doubt.

### Contributions and feature requests
If you would like any new features, feel free to post issues or make pull request.

Features planned:

- Header and footers
- Custom row and header rendering functions
- Additional unit support (right now only pt)