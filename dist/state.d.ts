import { Table } from "./models";
export declare let globalDefaults: {};
export declare let documentDefaults: {};
export default function (): TableState;
export declare function getGlobalOptions(): {};
export declare function getDocumentOptions(): {};
declare class TableState {
    table: Table;
    doc: any;
    constructor(doc: any);
    pageHeight(): any;
    pageWidth(): any;
    pageSize(): any;
    scaleFactor(): any;
    pageNumber(): any;
}
export declare function setupState(doc: any): void;
export declare function resetState(): void;
export declare function setDefaults(defaults: any, doc?: any): void;
export {};
