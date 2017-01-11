/**
 * Experimental html and css parser for plugin version 3.0
 */

interface RowResult {
    content: HTMLTableRowElement,
    cells: [{content: HTMLTableCellElement, styles: {}, rowSpan: number, colSpan: number}],
    styles: {}
}

export function parseHtml(input: HTMLTableElement|string, includeHiddenHtml = false, useCss = false) {
    let tableElement;
    if (typeof input === 'string') {
        tableElement = window.document.querySelector(input);
    } else {
        tableElement = input;
    }
    
    let head = parseTableSection(window, tableElement.tHead, includeHiddenHtml, useCss);
    let body = [];
    for (var i = 0; i < tableElement.tBodies.length; i++) {
        body = body.concat(parseTableSection(window, tableElement.tBodies[i], includeHiddenHtml, useCss));
    }
    let foot = parseTableSection(window, tableElement.tFoot, includeHiddenHtml, useCss);
    
    return {head, body, foot};
}

function parseTableSection(window, sectionElement, includeHidden, useCss): RowResult[] {
    let results = [];
    if (!sectionElement) {
        return results;
    }
    for(let i = 0; i < sectionElement.rows.length; i++) {
        let row = sectionElement.rows[i];
        let resultRow = {styles: {}, cells: []};
        for(let i = 0; i < row.cells.length; i++) {
            let cell = row.cells[i];
            let style = window.getComputedStyle(cell);
            if (includeHidden || style.display !== 'none') {
                let styles = useCss ? parseCss(style) : {};
                let content = (cell.innerText || '').trim();
                resultRow.cells.push({
                    content: content,
                    rowspan: cell.rowSpan,
                    colspan: cell.colSpan,
                    styles: styles,
                    element: cell
                });
            }
        }
        let style = window.getComputedStyle(row);
        if (resultRow.cells.length > 0 && (includeHidden || style.display !== 'none')) {
            resultRow.styles = useCss ? parseCss(style, ['cellPadding', 'lineWidth', 'lineColor']): {};
            results.push(resultRow);
        }
    }
    
    return results;
}

function parseCss(style, ignored = []): any {
    let result = {};
    
    function assign(name, value, accepted = []) {
        if ((accepted.length === 0 || accepted.indexOf(value) !== -1) && ignored.indexOf(name) === -1) {
            if (value === 0 || value) {
                result[name] = value;
            }
        }
    }
    
    assign('fillColor', parseColor(style.backgroundColor));
    assign('lineColor', parseColor(style.borderColor));
    assign('fontStyle', parseFontStyle(style));
    assign('textColor', parseColor(style.color));
    assign('halign', style.textAlign, ['left', 'right', 'center']);
    assign('valign', style.verticalAlign, ['middle', 'bottom', 'top']);
    assign('fontSize', parseInt(style.fontSize));
    assign('cellPadding', parsePadding(style.padding));
    assign('lineWidth', parseInt(style.borderWidth));
    assign('font', style.fontFamily.toLowerCase());
    
    return result;
}

function parseFontStyle(style) {
    let res = '';
    if (style.fontStyle === 'italic') {
        res += 'italic';
    } else if (style.fontWeight === 'bold') {
        res += 'bold';
    }
    return res;
}

function parseColor(cssColor) {
    var rgba = cssColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d*))?\)$/);

    var color = [parseInt(rgba[1]), parseInt(rgba[2]), parseInt(rgba[3])];
    var alpha = parseInt(rgba[4]);

    if (alpha === 0 || isNaN(color[0])) {
        return null;
    }

    return color;
}

function parsePadding(val) {
    return val.split(' ').map((n) => parseInt(n));
}