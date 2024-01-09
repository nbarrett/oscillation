import isNaN from "lodash-es/isNaN";

export function enumForKey<E>(enumValue: E, string: string): E[keyof E] {
    const resolvedEnum = Object.entries(enumValue)?.find((value) => string?.toUpperCase() === value[1]?.toUpperCase());
    return resolvedEnum && resolvedEnum[1];
}

export function enumKeys<E>(enumValue: E): string[] {
    return enumKeyValues(enumValue)?.map(item => item.key);
}

export function enumValues<E>(enumValue: E): string[] {
    return enumKeyValues(enumValue)?.map(item => item.value);
}

export function enumKeyForValue<E>(enumValue: E, string: any): string {
    return enumKeyValues(enumValue)?.find(item => item.value.toLowerCase() === string.toString().toLowerCase()).key;
}

export function enumKeyValues<E>(enumValue: E): KeyValue[] {
    return Object.entries(enumValue)?.map((value) => ({key: value[0], value: value[1]})).filter(item => isNaN(+item.key));
}

export function enumArray<E>(enumValue: E): any[] {
    return Object.entries(enumValue);
}

export interface KeyValue {
    key: string;
    value: string;
}
