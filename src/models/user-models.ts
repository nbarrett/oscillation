import { HasAuditTimestamps } from "./common-models";

export interface UserData extends HasAuditTimestamps {
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    mobile?: string;
    phone?: string;
}

export interface UserRoles extends HasAuditTimestamps {
    systemAccess?: boolean;
    accountSettings?: boolean;
}
