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

### Usage example

```html
<table id="my-table"><!-- ... --></table>

<script src="jspdf.min.js"></script>
<script src="jspdf.plugin.autotable.min.js"></script>

<script>
    var doc = new jsPDF();
    // You can use html:
    doc.autoTable({html: '#my-table'});
    
    // Or JavaScript:
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
import 'jspdf-autotable';

const doc = new jsPDF();
doc.autoTable({html: '#my-table'});
doc.save('table.pdf');
```

Checkout more examples in [examples.js](examples) which is also the source code for the [demo](https://simonbengtsson.github.io/jsPDF-AutoTable/) documents.

### API
- `doc.autoTable({ /* options */ })`
- `doc.autoTableSetDefaults({ /* ... */ })` Use for setting default options for all tables in the specific document. Settings and styles will be overridden in the following order `global` < `document` < `table`. Hooks will be added and not overridden.
- `jsPDF.autoTableSetDefaults({ /* ... */ })` Use for setting global defaults which will be applied for all document and tabels.

If you want to know something about the last table that was drawn you can use `doc.lastAutoTable`. It has a `doc.lastAutoTable.finalY` property among other things that has the value of the last printed y coordinate on a page. This can be used to draw text, multiple tables or other content after a table.

### Options
Below is a list of all options supported in the plugin. All of them are used in the [examples](examples).

##### Content options
The only thing required is either the html or body option. If you want more control over the columns you can specify the columns property. It is not needed however and if not set the columns will be automatically computed based on the content of the head, body and foot.

- `html: string|HTMLTableElement` An html table element or a css selector (for example "#table").
- `head: Cell[][]` For example [['ID', 'Name', 'Country']]
- `body: Cell[][]` For example [['1', 'Simon', 'Sweden'], ['2', 'Karl', 'Norway']]
- `foot: Cell[][]` For example [['ID', 'Name', 'Country']]
- `columns: Column[]` For example [{header: 'ID', dataKey: 'id'}, {header: 'Name', dataKey: 'name'}]
- `includeHiddenHTML: boolean = false` If hidden html with `display: none` should be included or not

##### Styling options

- `theme: 'striped'|'grid'|'plain'|'css' = 'striped'` 
- `styles: StyleDefinition`
- `headStyles: StyleDefinition`
- `bodyStyles: StyleDefinition`
- `footStyles: StyleDefinition`
- `alternateRowStyles: StyleDefinition`
- `columnStyles: {&columnDataKey: StyleDefinition}`

##### Other options

- `startY: number = null` Where the table should start to be printed (kind of like margin top first page)
- `margin: Margin = 40`
- `pageBreak: 'auto'|'avoid'|'always'`
- `rowPageBreak: 'auto'|'avoid' = 'auto'`
- `tableWidth: 'auto'|'wrap'|number = 'auto'`
- `showHead: 'everyPage'|'lastPage'|'never' = 'everyPage''`
- `showFoot: 'everyPage'|'lastPage'|'never' = 'everyPage''`
- `tableLineWidth: number = 0`
- `tableLineColor: Color = 200` The table line/border color

#### Hooks
You can customize the content and styling of the table by using the hooks. See the custom styles example for usage of the hooks.

Note that the hooks will only be called for body cells by default. Turn on the `allSectionHooks` option if you want it to be called for head and foot cells as well.

- `didParseCell` - Called when the plugin finished parsing cell content. Can be used to override content or styles for a specific cell.
- `willDrawCell` - Called before a cell or row is drawn. Can be used to call native jspdf styling functions such as `doc.setTextColor` or change position of text etc before it is drawn.
- `didDrawCell` - Called after a cell has been added to the page. Can be used to draw additional cell content such as images with `doc.addImage`, additional text with `doc.addText` or other jspdf shapes.
- `didDrawPage` - Called after the plugin has finished drawing everything on a page. Can be used to add headers and footers with page numbers or any other content that you want on each page there is an autotable.

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
