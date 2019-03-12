export declare function getStringWidth(text: any, styles: any): number;
/**
 * Ellipsize the text to fit in the width
 */
export declare function ellipsize(text: any, width: any, styles: any, ellipsizeStr?: string): any;
export declare function addTableBorder(): void;
export declare function getFillStyle(styles: any): false | "DF" | "S" | "F";
export declare function applyUserStyles(): void;
export declare function applyStyles(styles: any): void;
export declare function marginOrPadding(value: any, defaultValue: number): any;
export declare function styles(styles: any): any;
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
export declare function parseCss(element: any, scaleFactor: any, ignored?: string[]): any;
export declare type HookHandler = (data: HookData) => void | boolean;
export declare type CellHookHandler = (data: CellHookData) => void | boolean;
declare class CellHooks {
	willParseCell: CellHookHandler[];
	didParseCell: CellHookHandler[];
	willDrawCell: CellHookHandler[];
	didDrawCell: CellHookHandler[];
	didDrawPage: HookHandler[];
}
export declare class Table {
	id?: any;
	cursor: {
		x: number;
		y: number;
	};
	doc: any;
	userStyles: {};
	settings: any;
	columns: Column[];
	head: Row[];
	body: Row[];
	foot: Row[];
	height: number;
	width: number;
	preferredWidth: number;
	wrappedWidth: number;
	minWidth: number;
	headHeight: number;
	footHeight: number;
	startPageNumber: number;
	pageNumber: number;
	pageStartX: number;
	pageStartY: number;
	finalY: number;
	readonly pageCount: number;
	styles: {
		styles: {};
		headStyles: {};
		bodyStyles: {};
		footStyles: {};
		alternateRowStyles: {};
		columnStyles: {};
	};
	cellHooks: CellHooks;
	allRows(): Row[];
	callCellHooks(handlers: HookHandler[], cell: Cell, row: Row, column: Column): boolean;
	callEndPageHooks(): void;
	margin(side: any): any;
}
export declare class Row {
	raw: HTMLTableRowElement | any;
	index: number;
	cells: {};
	section: 'head' | 'body' | 'foot';
	height: number;
	maxCellLineCount: number;
	maxCellHeight: number;
	x: number;
	y: number;
	pageNumber: number;
	spansMultiplePages: boolean;
	readonly pageCount: number;
	constructor(raw: any, index: any, section: any);
}
export declare class Cell {
	raw: HTMLTableCellElement | any;
	styles: any;
	text: string[];
	section: 'head' | 'body' | 'foot';
	contentWidth: number;
	wrappedWidth: number;
	minWidth: number;
	textPos: {};
	height: number;
	width: number;
	x: number;
	y: number;
	colSpan: number;
	rowSpan: number;
	constructor(raw: any, themeStyles: any, section: any);
	padding(name: any): any;
}
export declare class Column {
	raw: any;
	dataKey: string | number;
	index: number;
	preferredWidth: number;
	minWidth: number;
	wrappedWidth: number;
	width: number;
	constructor(dataKey: any, raw: any, index: any);
}
export declare class HookData {
	table: Table;
	pageNumber: number;
	settings: {};
	doc: any;
	cursor: {
		x: number;
		y: number;
	};
	readonly pageCount: number;
	constructor();
}
export declare class CellHookData extends HookData {
	cell: Cell;
	row: Row;
	column: Column;
	section: 'head' | 'body' | 'foot';
	constructor(cell: Cell, row: Row, column: Column);
}
export declare function parseHtml(input: HTMLTableElement | string, includeHiddenHtml?: boolean, useCss?: boolean): {
	head: any[];
	body: any[];
	foot: any[];
};
/**
 * Create models from the user input
 */
export declare function parseInput(args: any): Table;
export interface ColumnOption {
	header?: string;
	title?: string;
	footer?: string;
	dataKey?: string | number;
}
/**
 * Properties
 */
export interface UserOptions {
}
export interface UserOptions {
	columns?: string[] | ColumnOption[];
	data?: any[][];
	html?: HTMLTableElement | string;
	includeHiddenHtml?: boolean;
	useCSS?: boolean;
	headerRows?: number;
	footerRows?: number;
	startY?: number;
	margin?: MarginPadding;
	pageBreak?: boolean;
	pageBreakRow?: boolean;
	tableWidth?: 'auto' | 'wrap' | number;
	showHead?: 'everyPage' | 'firstPage' | 'never';
	showFoot?: 'everyPage' | 'lastPage' | 'never';
	tableLineWidth?: number;
	tableLineColor?: Color;
	tableId?: any;
	theme?: 'striped' | 'plain' | 'grid' | 'css';
	styles?: Styles;
	headerStyles?: Styles;
	bodyStyles?: Styles;
	footerStyles?: Styles;
	alternateRowStyles?: Styles;
	columnStyles?: Styles;
	createdCell?: () => {};
	drawCell?: () => {};
	didDrawCell?: () => {};
	addPageContent?: () => {};
}
export declare type Color = [number, number, number] | number | 'transparent' | false;
export declare type MarginPadding = number | {
	top?: number;
	right?: number;
	bottom?: number;
	left?: number;
};
export interface Styles {
	font?: 'helvetica' | 'times' | 'courier';
	fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
	overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
	fillColor?: Color;
	textColor?: Color;
	halign?: 'left' | 'center' | 'right' | 'justify';
	valign?: 'top' | 'middle' | 'bottom';
	fontSize?: number;
	cellPadding?: number;
	lineColor?: Color;
	lineWidth?: number;
	cellWidth?: 'auto' | 'wrap' | number;
	minCellHeight?: number;
}
export interface CellDefinition {
	rowSpan?: number;
	colSpan?: number;
	styles?: Styles;
}
export declare type CellType = null | string | number | boolean | CellDefinition;
export declare type MultipleRowType = CellType[][] | {
	string: CellType;
}[];
export declare type SingleRowType = CellType[] | {
	string: CellType;
};
export interface BaseConfig {
	theme?: 'striped' | 'grid' | 'plain';
	startY?: number;
	margin?: MarginPadding;
	pageBreak?: 'auto' | 'avoid' | 'always';
	rowPageBreak: 'auto' | 'avoid';
	tableWidth?: 'auto' | 'wrap' | number;
	showHead?: 'everyPage' | 'firstPage' | 'never';
	showFoot?: 'everyPage' | 'lastPage' | 'never';
	tableLineWidth?: number;
	tableLineColor?: Color;
	tableId?: any;
	styles?: Styles;
	bodyStyles?: Styles;
	headStyles?: Styles;
	footStyles?: Styles;
	alternateRowStyles?: Styles;
	columnStyles?: Styles;
	didParseCell?: (data: CellHookData) => void;
	willDrawCell?: (data: CellHookData) => void;
	didDrawCell?: (data: CellHookData) => void;
	didDrawPage?: (data: CellHookData) => void;
}
export interface ContentConfig extends BaseConfig {
	head?: SingleRowType | MultipleRowType;
	foot?: SingleRowType | MultipleRowType;
	body: MultipleRowType;
}
export interface HTMLConfig extends BaseConfig {
	html: string | HTMLElement;
}
export declare function assign(target: any, ...varArgs: any[]): any;
export declare let globalDefaults: {};
export declare let documentDefaults: {};
export declare function getGlobalOptions(): {};
export declare function getDocumentOptions(): {};
export declare function setupState(doc: any): void;
export declare function resetState(): void;
export declare function setDefaults(defaults: any, doc?: any): void;
export declare function drawTable(table: Table): void;
export declare function addPage(): void;
/**
 * Calculate the column widths
 */
export declare function calculateWidths(table: Table): void;