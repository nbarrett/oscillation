import { StoredValue } from "../util/ui-stored-values";

export interface HttpResponseCodeHandling {
    returnNull: number[];
    logWarningReturnNull: number[];
}

export const HTTP_RESPONSE_CODE_HANDLING_DEFAULTS: HttpResponseCodeHandling = {returnNull: [], logWarningReturnNull: []};

export interface KeyValue<T> {
    key: string;
    value: T;
}

export interface ErrorResponseWithException {
    message: string;
    exception?: string;
    exceptionMessage?: any;
    stackTrace?: string;
    exceptionCause?: string;
    exceptionCauseMessage?: any;
}

export interface ApiGeneralResponse {
    error?: ErrorResponseWithException
}

export interface ApiStatusResponse extends ApiGeneralResponse {
    status?: string;
    type?: string;
    message?: string;
}

export interface NamedParameter {
    name: StoredValue | string;
    value: any;
}

export interface FieldValue {
    field: string;
    value: any;
}

export interface UrlChange {
    name?: StoredValue;
    value?: any;
    parameters?: NamedParameter[] | any;
    path?: string;
    push?: boolean;
    reload?: boolean;
    save?: boolean;
    dontNavigate?: boolean;
}

export interface NamedParameter {
    name: StoredValue | string;
    value: any;
}

export interface AuditUser {
    userName: string;
    firstName: string;
    lastName: string;
}

export interface CreateAudit {
    createdAt: number;
    createdBy: AuditUser;
}

export interface OptionalCreateAudit {
    createdAt?: number;
    createdBy?: AuditUser;
}

export interface UpdateAudit {
    updatedAt: number;
    updatedBy: AuditUser;
}

export interface OptionalUpdatedAt {
    updatedAt?: number;
}

export interface OptionalCreatedAt {
    createdAt?: number;
}

export interface ColourMap {
    [key: string]: string;
}

export interface ClientRequest<T> {
    clientRequestId: number;
    request: T
}

export function hasUid<T>(document: any): document is WithUid<T> {
    return (document as WithUid<T>).uid !== undefined;
}

export function hasUidWithValue<T>(document: any): document is WithUid<T> {
    return hasUid(document) && (document as WithUid<T>)?.uid?.length > 0;
}

export interface HasUid {
    uid?: string;
}

export interface WithUid<T> {
    uid: string;
    attributes?: any;
    data: T;
    markedForDelete?: boolean
    createWithId?: boolean;
}

export interface HasAuditTimestamps {
    updatedAt?: number;
    createdAt?: number;
}

export interface HasAuditUsers {
    updatedBy?: string;
    createdBy?: string;
}

export interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

export interface Property {
    name: string;
    value: string | number;
}

export interface CellAddress {
    field: string;
    rowIndex: number;
    numeric?: boolean;
}

export interface UniqueValues {
    [fieldName: string]: any[]
}
