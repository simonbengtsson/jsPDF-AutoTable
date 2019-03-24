export interface ColumnOption {
	header?: string;
	title?: string;
	footer?: string;
	dataKey?: string | number;
}
/**
 * Properties
 */
interface UserOptions {
	columns?: string[] | ColumnOption[];
	head?: any[][];
	body?: any[][];
	foot?: any[][];
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
type Color = [number, number, number] | number | 'transparent' | false;
type MarginPadding = number | {
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
export declare type autoTable = (options: UserOptions) => void;
