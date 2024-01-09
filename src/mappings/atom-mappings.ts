import omit from "lodash/omit";
import {SerializableParam} from "recoil";
import {initialValueFor, itemExistsFor, removeItemFor, saveValueFor, StoredValue} from "../util/ui-stored-values";
import {log} from "../util/logging-config";

export function removeToJSONFrom<T>(request: SerializableParam): T {
    return omit(request as any, "toJSON");
}

export function setAndSave<T>(setSelf, data: T, storedValue: StoredValue) {
    if (data) {
        log.debug("setAndSave:saving storedValue:", storedValue, "data:", data);
        saveValueFor(storedValue, data)
        setSelf(data);
    } else if (itemExistsFor(storedValue)) {
        log.debug("setAndSave:deleting storedValue:", storedValue, "existing data:", initialValueFor(storedValue));
        removeItemFor(storedValue)
        setSelf(null);
    }
}
