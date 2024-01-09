import { enumForKey, enumKeyForValue, enumValues } from "./enums";

enum TestEnum {
    PROJECT_LEVEL = "project-level",
    TEST_LEVEL = "test-level",
    OPTIONS = "options"
}

export enum TestEnumNoValues {
    "undefined",
    "Request",
    "Backlog",
    "In Due Course",
    "On Hold",
    "To Do"
}

describe("when using enumForKey", () => {

    it("should return an enum for the supplied key", () => {
        expect(enumForKey(TestEnum, "project-level")).toEqual(TestEnum.PROJECT_LEVEL);
        expect(enumForKey(TestEnum, "test-level")).toEqual(TestEnum.TEST_LEVEL);
        expect(enumForKey(TestEnum, "options")).toEqual(TestEnum.OPTIONS);
    });

    it("should return undefined if key doesn't match", () => {
        expect(enumForKey(TestEnum, "wrong-level")).toBeUndefined();
    });

});

describe("when using enumKeyForValue", () => {

    it("should return an enum key as a string when supplied value", () => {
        expect(enumKeyForValue(TestEnum, "project-level")).toEqual("PROJECT_LEVEL");
        expect(enumKeyForValue(TestEnum, "test-level")).toEqual("TEST_LEVEL");
        expect(enumKeyForValue(TestEnum, "options")).toEqual("OPTIONS");
    });

    it("should return an enum key as a string when supplied enum", () => {
        expect(enumKeyForValue(TestEnum, TestEnum.TEST_LEVEL)).toEqual("TEST_LEVEL");
    });

});

describe("when using enumValues", () => {

    it("should return an array of strings given an enum with values", () => {
        expect(enumValues(TestEnum)).toEqual(["project-level", "test-level", "options"]);
    });

    it("should return an array of numbers given an enum with no values", () => {
        expect(enumValues(TestEnumNoValues)).toEqual([0, 1, 2, 3, 4, 5]);
    });

});
