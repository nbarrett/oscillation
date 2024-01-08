import L from "leaflet";
import { useEffect } from "react";

export function Legend(props: { map: L.Map }) {

    const legend = new L.Control({position: "bottomleft"});

    useEffect(() => {
        if (props.map) {
            console.log("legend:onAdd", legend);
            legend.onAdd = () => {
                const div = L.DomUtil.create("div", "description");
                L.DomEvent.disableClickPropagation(div);
                const text = "<b>Lorem Ipsum</b> is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book...";
                div.innerHTML = text;
                return div;
            };
            legend.addTo(props.map);
        }

    }, [props.map]);

    return null;
}
