import {Config} from "./config";
/**
 * Experimental html and css parser
 */
declare function require(path: string): any;
var assign = require('object-assign');

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

function parseTableSection(window, sectionElement, includeHidden, useCss) {
    let results = [];
    if (!sectionElement) {
        return results;
    }
    for(let i = 0; i < sectionElement.rows.length; i++) {
        let row = sectionElement.rows[i];
        let resultRow = [];
        let rowStyles = parseCss(row, ['cellPadding', 'lineWidth', 'lineColor']);
        for(let i = 0; i < row.cells.length; i++) {
            let cell = row.cells[i];
            let style = window.getComputedStyle(cell);
            if (includeHidden || style.display !== 'none') {
                let cellStyles = parseCss(cell);
                resultRow.push({
                    rowSpan: cell.rowSpan,
                    colSpan: cell.colSpan,
                    styles: useCss ? assign(rowStyles, cellStyles) : null,
                    content: cell
                });
            }
        }
        if (resultRow.length > 0 && (includeHidden || rowStyles.display !== 'none')) {
            results.push(resultRow);
        }
    }
    
    return results;
}

// Note that border spacing is currently ignored
function parseCss(element, ignored = []): any {
    let result: any = {};
    let style = window.getComputedStyle(element);
    
    function assign(name, value, accepted = []) {
        if ((accepted.length === 0 || accepted.indexOf(value) !== -1) && ignored.indexOf(name) === -1) {
            if (value === 0 || value) {
                result[name] = value;
            }
        }
    }
    
    let pxScaleFactor =  96 / 72;
    assign('fillColor', parseColor(element, 'backgroundColor'));
    assign('lineColor', parseColor(element, 'borderColor'));
    assign('fontStyle', parseFontStyle(style));
    assign('textColor', parseColor(element, 'color'));
    assign('halign', style.textAlign, ['left', 'right', 'center']);
    assign('valign', style.verticalAlign, ['middle', 'bottom', 'top']);
    assign('fontSize', parseInt(style.fontSize) / pxScaleFactor);
    assign('cellPadding', parsePadding(style.padding, style.fontSize, style.lineHeight));
    assign('lineWidth', parseInt(style.borderWidth) / pxScaleFactor / Config.tableInstance().scaleFactor);
    assign('font', (style.fontFamily || '').toLowerCase());
    
    return result;
}

function parseFontStyle(style) {
    let res = '';
    if (style.fontWeight === 'bold' || style.fontWeight === 'bolder' || parseInt(style.fontWeight) >= 700) {
        res += 'bold';
    }
    if (style.fontStyle === 'italic' || style.fontStyle === 'oblique') {
        res += 'italic';
    }
    return res;
}

function parseColor(element, colorProp) {
    let cssColor = realColor(element, colorProp);
    
    if (!cssColor) return null;
    
    var rgba = cssColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d*))?\)$/);
    if (!rgba || !Array.isArray(rgba)) {
        return null;
    }

    var color = [parseInt(rgba[1]), parseInt(rgba[2]), parseInt(rgba[3])];
    var alpha = parseInt(rgba[4]);

    if (alpha === 0 || isNaN(color[0]) || isNaN(color[1]) || isNaN(color[2])) {
        return null;
    }

    return color;
}

function realColor(elem, colorProp) {
    if (!elem) return 'rgb(255, 255, 255)';

    var bg = getComputedStyle(elem)[colorProp];
    if (bg === 'rgba(0, 0, 0, 0)') {
        return realColor(elem.parentElement, colorProp);
    } else {
        return bg;
    }
}

function parsePadding(val, fontSize, lineHeight) {
    let scaleFactor = (96 / (72 / Config.tableInstance().scaleFactor));
    let linePadding = (parseInt(lineHeight) - parseInt(fontSize)) / scaleFactor / 2;
    
    let padding = val.split(' ').map((n) => {
        return parseInt(n) / scaleFactor;
    });

    padding = Config.marginOrPadding(padding, 0);
    if (linePadding > padding.top) {
        padding.top = linePadding;
    }
    if (linePadding > padding.bottom) {
        padding.bottom = linePadding;
    }
    return padding;
}