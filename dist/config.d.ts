/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
export declare let FONT_ROW_RATIO: number;
export declare function defaultConfig(): {
    html: any;
    head: any;
    body: any;
    foot: any;
    includeHiddenHtml: boolean;
    startY: any;
    margin: number;
    pageBreak: string;
    rowPageBreak: string;
    tableWidth: string;
    showHead: string;
    showFoot: string;
    tableLineWidth: number;
    tableLineColor: number;
    tableId: any;
    theme: string;
    useCss: boolean;
    styles: {};
    headStyles: {};
    bodyStyles: {};
    footStyles: {};
    alternateRowStyles: {};
    columnStyles: {};
    didParseCell: (data: any) => void;
    willDrawCell: (data: any) => void;
    didDrawCell: (data: any) => void;
    didDrawPage: (data: any) => void;
};
export declare function defaultStyles(): {
    font: string;
    fontStyle: string;
    overflow: string;
    fillColor: boolean;
    textColor: number;
    halign: string;
    valign: string;
    fontSize: number;
    cellPadding: number;
    lineColor: number;
    lineWidth: number;
    cellWidth: string;
    minCellHeight: number;
};
/**
 * Styles for the themes (overriding the default styles)
 */
export declare function getTheme(name: any): any;
