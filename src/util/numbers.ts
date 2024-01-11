import { isNaN, isNumber } from "lodash-es";
import { log } from "./logging-config";

export function sumValues(items: any[], fieldName) {
    if (!items) {
        return 0;
    }
    return items.map(fieldName).reduce((memo: any, num) => {
        return memo + asNumber(num);
    }, 0);
}

export function asNumber(numberString?: any, decimalPlaces?: number): number {
    if (!numberString) {
        return 0;
    }
    const numberArgumentSupplied: boolean = isNumber(numberString);
    const decimalPlacesSupplied: boolean = isNumber(decimalPlaces);
    if (numberArgumentSupplied && !decimalPlacesSupplied) {
        return numberString;
    }
    const numberValue: string = numberArgumentSupplied ? numberString : parseFloat(numberString.replace(/[^\d.-]/g, ""));
    if (isNaN(+numberValue)) {
        return 0;
    }
    const returnValue: number = decimalPlacesSupplied ? +parseFloat(numberValue).toFixed(decimalPlaces) : parseFloat(numberValue);
    log.debug("asNumber:", numberString, decimalPlaces, "->", returnValue);
    return returnValue;
}
    
