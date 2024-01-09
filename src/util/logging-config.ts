import * as loglevel from "loglevel";
import { DateFormats, displayDatesIn } from "./dates";
loglevel.setLevel(loglevel.levels.INFO);

const logWithBenefits = {
    ...loglevel, infoWithDates: function (...data: any[]) {
        loglevel.info(...data.map(item => displayDatesIn(item, DateFormats.displayDateAndTime)))
    }
}
export const log = logWithBenefits;
