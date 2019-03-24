// jsPDF nodejs: setup not required but referenced globals (https://github.com/MrRio/jsPDF/issues/2248)
(global as any).window = {document: {createElementNS: () => {return {}} }};
(global as any).html2pdf = {};
(global as any).navigator = {};

import * as jsPDF from 'jspdf';
import * as autoTable from 'jspdf-autotable';
import { writeFileSync } from 'fs';
import { ContentConfig, CellHookData, Column } from 'jspdf-autotable';

// attach jsPDF-AutoTable plugin
(jsPDF as any).autoTable = autoTable;

export function generatePdf() {
    // stats from https://en.wikipedia.org/wiki/World_Happiness_Report (2018)
    var columns = ['ID', 'Country', 'Rank', 'Capital'];
    var data = [
        [1, 'Finland', 7.632, 'Helsinki'],
        [2, 'Norway', 7.594, 'Oslo'],
        [3, 'Denmark', 7.555, 'Copenhagen'],
        [4, 'Iceland', 7.495, 'Reykjavík'],
        [5, 'Switzerland', 	7.487, 'Bern'],
        [9, 'Sweden', 7.314, 'Stockholm'],
        [73, 'Belarus', 5.483, 'Minsk']
    ];

    const doc = new jsPDF({ unit: 'pt' });
    (doc as any).autoTable(<ContentConfig>{
        columns,
        body: data,
        rowPageBreak: 'auto',
        headStyles: {
          halign: 'left',
          valign: 'middle',
          fontStyle: 'bold',
          minCellHeight: 30
        },
        didParseCell: (data: CellHookData) => {
          const column: Column = data.column;
          if (data.section === 'body' && column.raw === 'Country') {
            const cell = data.cell;
            cell.styles.fontStyle = 'bold';
          }
        }
      });
    return doc.output();
}

writeFileSync('./output.pdf', generatePdf());

console.info(`check ${__dirname as any}/output.pdf for result`);
