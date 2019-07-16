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
        let resultRow: any = [];
        let rowStyles = useCss ? parseCss(row, state().scaleFactor(), ['cellPadding', 'lineWidth', 'lineColor']) : {};
        for (let i = 0; i < row.cells.length; i++) {
            let cell = row.cells[i];
            if (includeHidden || !elementIsHidden(cell)) {
                let cellStyles = useCss ? parseCss(cell, state().scaleFactor()) : {};

                //filter any hidden elements from the contents!
                if (!includeHidden) {
                    const cellHiddenTotal = tagAllHiddenElements(cell, 0);

                    if (cellHiddenTotal > 0) {
                        //clone cell so we dont destroy the dom
                        cell = cell.cloneNode(true);

                        //remove all tagged elements!
                        for (const element of cell.querySelectorAll('.jspdf-autotable-tag-hidden')) {
                            element.parentElement.removeChild(element);
                        }
                    }
                }

                resultRow.push({
                    rowSpan: cell.rowSpan,
                    colSpan: cell.colSpan,
                    styles: useCss ? cellStyles : null,
                    content: cell
                });
            }
        }
        if (resultRow.length > 0 && (includeHidden || rowStyles.display !== 'none')) {
            resultRow._element = row;
            results.push(resultRow);
        }
    }

    return results;
}

function elementIsHidden(element) {
    const style = window.getComputedStyle(element);
    return element.getAttribute('aria-hidden') || style.display === 'none' || style.visibility === 'hidden';
}

function tagAllHiddenElements(parent, count) {
    //recursively look for hidden elements!
    for(const child of parent.childNodes){
        if (child.nodeType === Node.TEXT_NODE) {
            continue;
        }

        //is it hidden?
        if (elementIsHidden(child)) {
            //hidden, so tag the element!
            //we tag it like this because style computation in elementIsHidden() does not work when working on a clone of the cell that isnt currently in the dom.
            //instead we just tag all hidden objects live in the dom and then the tag gets copied into the clone.
            //from there we can just remove all matching elements with the tag!
            child.className+=' jspdf-autotable-tag-hidden';
            count++;
        } else {
            //not hidden so recurse further!
            count = tagAllHiddenElements(child, count);
        }
    }

    //chain
    return count;
}