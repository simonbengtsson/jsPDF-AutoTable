import jsPDF = require('jspdf');
import 'jspdf-autotable';

// This is a hack for typing this plugin. It should be possible to do
// with typescript augmentation feature, but the way jspdf's types are
// defined and the way jspdf is exported makes it hard to implement
// https://stackoverflow.com/q/55328516/827047

import { autoTable as AutoTable } from 'jspdf-autotable';

// stats from https://en.wikipedia.org/wiki/World_Happiness_Report (2018)
var head = [['ID', 'Country', 'Rank', 'Capital']];
var data = [
    [1, 'Finland', 7.632, 'Helsinki'],
    [2, 'Norway', 7.594, 'Oslo'],
    [3, 'Denmark', 7.555, 'Copenhagen'],
    [4, 'Iceland', 7.495, 'Reykjavík'],
    [5, 'Switzerland', 	7.487, 'Bern'],
    [9, 'Sweden', 7.314, 'Stockholm'],
    [73, 'Belarus', 5.483, 'Minsk']
];

const doc = new jsPDF();
((doc as any).autoTable as AutoTable)({
    head: head,
    body: data,
    didDrawCell: data => {
        console.log(data.column.index)
    }
});
doc.save('table.pdf');
