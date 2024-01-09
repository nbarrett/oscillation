import { removeItemFor, saveValueFor } from "./ui-stored-values";

export class SearchParamsBuilder {

    private saveSettings = false;

    constructor(public searchParams: URLSearchParams) {
    }

    static create(searchParams: URLSearchParams) {
        return new SearchParamsBuilder(searchParams);
    }

    withSave(): SearchParamsBuilder {
        this.saveSettings = true;
        return this;
    }

    saveToLocalStorage(boolean): SearchParamsBuilder {
        this.saveSettings = boolean;
        return this;
    }


    delete(name: string): SearchParamsBuilder {
        return this.set(name);
    }

    set(name: string, value?: any): SearchParamsBuilder {
        if (![undefined, null].includes(value)) {
            this.searchParams.set(name, value?.toString());
            if (this.saveSettings) {
                saveValueFor(name, value);
            }
        } else if (name || value === "undefined") {
            this.searchParams.delete(name);
            if (this.saveSettings) {
                removeItemFor(name);
            }
        }
        return this;
    }

}
