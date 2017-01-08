import {Table, Row, Column} from './models';
import {Config, getDefaults} from './config';
declare function require(path: string): any;
var assign = require('object-assign');

export function parseInput(doc, ...input: any[]): Table {
    let table = new Table(doc, input);
    table.callHook('inputParsed');
    return table;
}

/**
 * Create models from the user input
 */
export function createModel(doc, ...allSettings) {
    let settings = parseSettings(doc, allSettings);
    let table = new Table(doc, settings);
    parseContent(settings, table);
    
    table.columns.forEach(function (id, index) {
        let colStyles = settings.columnStyles[id] || {};
        let column = new Column(id, index, colStyles);
        table.columns.push(column);
    });
    
    section(table, settings, 'head');
    section(table, settings, 'body');
    section(table, settings, 'foot');
    
    settings.inputParsed(Config.hooksData(table));
    
    return table;
}

function section(table, settings, type) {
    settings[type].forEach(function(inputRow, i) {
        let row = new Row(inputRow, i, type);
        table.columns.forEach(function (column) {
            if (column.id in inputRow) {
                row.addCell(table, inputRow[column.id]);
            }
        });
        table[type].push(row);
    });
    delete settings[type];
}