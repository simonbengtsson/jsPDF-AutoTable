export declare type HookHandler = (data: HookData) => void | boolean;
export declare type CellHookHandler = (data: CellHookData) => void | boolean;
declare class CellHooks {
	didParseCell: CellHookHandler[];
	willDrawCell: CellHookHandler[];
	didDrawCell: CellHookHandler[];
	didDrawPage: HookHandler[];
}
declare class Table {
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
declare class Row {
	raw: HTMLTableRowElement | any;
	index: number;
	cells: {};
	section: 'head' | 'body' | 'foot';
	height: number;
	maxCellHeight: number;
	x: number;
	y: number;
	pageNumber: number;
	spansMultiplePages: boolean;
	readonly pageCount: number;
	constructor(raw: any, index: any, section: any);
	canEntireRowFit(height: any): boolean;
	getMinimumRowHeight(): any;
}
declare class Cell {
	raw: HTMLTableCellElement | any;
	styles: any;
	text: string[];
	section: 'head' | 'body' | 'foot';
	contentHeight: number;
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
	getContentHeight(): any;
	padding(name: any): any;
}
declare class Column {
	raw: any;
	dataKey: string | number;
	index: number;
	preferredWidth: number;
	minWidth: number;
	wrappedWidth: number;
	width: number;
	constructor(dataKey: any, raw: any, index: any);
}
declare class HookData {
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
declare class CellHookData extends HookData {
	cell: Cell;
	row: Row;
	column: Column;
	section: 'head' | 'body' | 'foot';
	constructor(cell: Cell, row: Row, column: Column);
}
export interface ColumnOption {
	header?: string;
	title?: string;
	footer?: string;
	dataKey?: string | number;
}
export declare type UserOptions = HTMLConfig | ContentConfig | ColumnDataConfig;
export declare type Color = [number, number, number] | number | 'transparent' | false;
export declare type MarginPadding = number | {
	top?: number;
	right?: number;
	bottom?: number;
	left?: number;
};
export interface Styles {
	font?: 'helvetica' | 'times' | 'courier' | string;
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
	content?: Styles;
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
	rowPageBreak?: 'auto' | 'avoid';
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
	columnStyles?: {
		[key: string]: Styles;
	};
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
export interface ColumnDataConfig extends BaseConfig {
	columns?: ColumnOption[];
	body: object[];
}
export interface HTMLConfig extends BaseConfig {
	html: string | HTMLElement;
}
export declare type autoTable = (options: UserOptions) => void;

export {};
