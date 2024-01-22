// src/server/api.ts

import { remultExpress } from "remult/remult-express"
import { NamedLocation } from "../shared/NamedLocation";

export const api = remultExpress({
    entities: [NamedLocation],
})
