import { Entity, Fields } from "remult";
import { LatLngTuple } from "leaflet";

@Entity("startingPoints", {
    allowApiCrud: true
})
export class NamedLocation {
    @Fields.cuid()
    id: string;
    @Fields.string()
    name: string;
    @Fields.json()
    location: LatLngTuple;
}
