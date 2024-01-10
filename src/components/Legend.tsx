import L from "leaflet";
import { useEffect } from "react";
import { log } from "../util/logging-config";

export function Legend(props: { map: L.Map }) {

    const legend = new L.Control({position: "bottomleft"});

    useEffect(() => {
        if (props.map) {
            log.debug("legend:onAdd", legend);
            legend.onAdd = () => {
                const div = L.DomUtil.create("div", "description");
                L.DomEvent.disableClickPropagation(div);
                const text = "<b>Map Instructions</b><div>We can put information in here to help players understand how to use the map or play the game.</div>";
                div.innerHTML = text;
                return div;
            };
            legend.addTo(props.map);
        }

    }, [props.map]);

    return null;
}
