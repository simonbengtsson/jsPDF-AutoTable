import {parseCss} from "./cssParser";
import state from "./state";
import {assign} from './polyfills';

export function parseHtml(input: HTMLTableElement | string, includeHiddenHtml = false, useCss = false) {
    let tableElement;
    if (typeof input === 'string') {
        tableElement = <HTMLTableElement>window.document.querySelector(input);
    } else {
        tableElement = input;
    }

    if (!tableElement) {
        console.error("Html table could not be found with input: ", input);
        return;
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
    for (let i = 0; i < sectionElement.rows.length; i++) {
        let row = sectionElement.rows[i];
        let resultRow = [];
        let rowStyles = useCss ? parseCss(row, state().scaleFactor(), ['cellPadding', 'lineWidth', 'lineColor']) : {};
        for (let i = 0; i < row.cells.length; i++) {
            let cell = row.cells[i];
            let style = window.getComputedStyle(cell);
            if (includeHidden || style.display !== 'none') {
                let cellStyles = useCss ? parseCss(cell, state().scaleFactor()) : {};
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