// Limitations
// - No support for border spacing
// - No support for transparency
import {marginOrPadding} from "./common";

export function parseCss(element, scaleFactor, ignored: string[] = []) {
    let result: any = {};
    let style = window.getComputedStyle(element);

    function assign(name, value, accepted: string[] = []) {
        if ((accepted.length === 0 || accepted.indexOf(value) !== -1) && ignored.indexOf(name) === -1) {
            if (value === 0 || value) {
                result[name] = value;
            }
        }
    }

    let pxScaleFactor = 96 / 72;
    assign('fillColor', parseColor(element, 'backgroundColor') || 255);
    assign('lineColor', parseColor(element, 'borderColor'));
    assign('fontStyle', parseFontStyle(style));
    assign('textColor', parseColor(element, 'color'));
    assign('halign', style.textAlign, ['left', 'right', 'center']);
    assign('valign', style.verticalAlign, ['middle', 'bottom', 'top']);
    assign('fontSize', parseInt(style.fontSize || '') / pxScaleFactor);
    assign('cellPadding', parsePadding(style.padding, style.fontSize, style.lineHeight, scaleFactor));
    assign('lineWidth', parseInt(style.borderWidth || '') / pxScaleFactor / scaleFactor);
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
    if (!elem) return null;

    var bg = window.getComputedStyle(elem)[colorProp];
    if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || bg === 'initial' || bg === 'inherit') {
        return realColor(elem.parentElement, colorProp);
    } else {
        return bg;
    }
}

function parsePadding(val, fontSize, lineHeight, scaleFactor) {
    if (!val) return null;
    let pxScaleFactor = (96 / (72 / scaleFactor));
    let linePadding = (parseInt(lineHeight) - parseInt(fontSize)) / scaleFactor / 2;

    let padding = val.split(' ').map((n) => {
        return parseInt(n) / pxScaleFactor;
    });

    padding = marginOrPadding(padding, 0);
    if (linePadding > padding.top) {
        padding.top = linePadding;
    }
    if (linePadding > padding.bottom) {
        padding.bottom = linePadding;
    }
    return padding;
}