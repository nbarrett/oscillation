import { type PoiIconOption } from "./poi-types";

export const POI_COLOURS = {
  pub: "#2563eb",
  spire: "#711894",
  tower: "#ec4899",
  phone: "#ca8a04",
  school: "#16a34a",
} as const;

export enum PubIconStyle {
  BEER_MUG = "BEER_MUG",
  PINT_GLASS = "PINT_GLASS",
  BEER_PUMP = "BEER_PUMP",
  TANKARD = "TANKARD",
  MAP_PIN = "MAP_PIN",
}

export const PUB_ICON_OPTIONS: PoiIconOption<PubIconStyle>[] = [
  {
    style: PubIconStyle.BEER_MUG,
    label: "Beer Mug",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="10" y="18" width="34" height="40" rx="3" fill="#c8850a" opacity="0.15"/><rect x="12" y="20" width="30" height="36" rx="2" fill="#f5deb3" stroke="#8B6914" stroke-width="1.5"/><rect x="14" y="22" width="26" height="10" rx="1" fill="#fff" opacity="0.9"/><ellipse cx="17" cy="25" rx="2" ry="2.5" fill="#fff" opacity="0.6"/><ellipse cx="22" cy="23" rx="1.5" ry="2" fill="#fff" opacity="0.5"/><ellipse cx="27" cy="26" rx="2.5" ry="2" fill="#fff" opacity="0.6"/><ellipse cx="33" cy="24" rx="1.5" ry="1.8" fill="#fff" opacity="0.5"/><ellipse cx="37" cy="26" rx="1" ry="1.5" fill="#fff" opacity="0.4"/><rect x="14" y="31" width="26" height="23" rx="1" fill="#d4920a"/><rect x="14" y="31" width="26" height="8" fill="#e8a317" opacity="0.7"/><rect x="16" y="34" width="4" height="18" rx="0.5" fill="#fff" opacity="0.1"/><rect x="24" y="34" width="4" height="18" rx="0.5" fill="#fff" opacity="0.1"/><rect x="32" y="34" width="4" height="18" rx="0.5" fill="#fff" opacity="0.1"/><path d="M42 28h6a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6h-6" fill="none" stroke="#8B6914" stroke-width="3" stroke-linecap="round"/><path d="M42 30h5a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-5" fill="#f5deb3" stroke="#8B6914" stroke-width="1"/><rect x="12" y="54" width="30" height="3" rx="1" fill="#8B6914"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="14" height="18" rx="2"/><rect x="5" y="4" width="10" height="5" rx="1" fill="#fff" opacity="0.7"/><path d="M17 8h2.5A2.5 2.5 0 0 1 22 10.5v3a2.5 2.5 0 0 1-2.5 2.5H17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    style: PubIconStyle.PINT_GLASS,
    label: "Pint Glass",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M18 6h28l-4 50a4 4 0 0 1-4 3.5H26a4 4 0 0 1-4-3.5L18 6z" fill="#f5deb3" stroke="#8B6914" stroke-width="1.5"/><path d="M20 10h24l-3.3 42a3 3 0 0 1-3 2.8H26.3a3 3 0 0 1-3-2.8L20 10z" fill="#d4920a"/><path d="M20 10h24v8H20z" fill="#e8a317" opacity="0.6"/><path d="M18 6h28v6H18z" fill="#fff" opacity="0.85"/><ellipse cx="24" cy="9" rx="2" ry="1.5" fill="#fff" opacity="0.5"/><ellipse cx="30" cy="8" rx="1.8" ry="1.3" fill="#fff" opacity="0.4"/><ellipse cx="36" cy="9.5" rx="1.5" ry="1.2" fill="#fff" opacity="0.5"/><path d="M22 20v30" stroke="#fff" stroke-width="1.5" opacity="0.12"/><path d="M28 18v34" stroke="#fff" stroke-width="1.5" opacity="0.12"/><path d="M34 18v34" stroke="#fff" stroke-width="1.5" opacity="0.12"/><path d="M40 20v30" stroke="#fff" stroke-width="1.5" opacity="0.12"/><path d="M18 6h28" stroke="#8B6914" stroke-width="2" stroke-linecap="round"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10l-1.5 17a2 2 0 0 1-2 1.8h-3A2 2 0 0 1 8.5 19L7 2z"/><path d="M7 2h10v3H7z" opacity="0.4"/></svg>`,
  },
  {
    style: PubIconStyle.BEER_PUMP,
    label: "Beer Pump",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="22" y="48" width="20" height="12" rx="2" fill="#8B6914"/><rect x="24" y="50" width="16" height="8" rx="1" fill="#a07818"/><rect x="28" y="16" width="8" height="34" rx="1" fill="#d4a020" stroke="#8B6914" stroke-width="1"/><rect x="26" y="14" width="12" height="6" rx="2" fill="#c8960e" stroke="#8B6914" stroke-width="1"/><rect x="30" y="4" width="4" height="12" rx="1" fill="#8B6914"/><ellipse cx="32" cy="4" rx="5" ry="3" fill="#8B6914"/><ellipse cx="32" cy="4" rx="4" ry="2" fill="#a07818"/><rect x="25" y="40" width="14" height="2" rx="0.5" fill="#8B6914"/><rect x="25" y="36" width="14" height="2" rx="0.5" fill="#8B6914"/><circle cx="32" cy="28" r="3" fill="#fff" opacity="0.2"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="10" y="8" width="4" height="12" rx="0.5"/><rect x="9" y="7" width="6" height="2" rx="1"/><rect x="11" y="2" width="2" height="6"/><ellipse cx="12" cy="2" rx="2.5" ry="1.5"/><rect x="8" y="19" width="8" height="3" rx="1"/></svg>`,
  },
  {
    style: PubIconStyle.TANKARD,
    label: "Tankard",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="12" y="12" width="32" height="44" rx="3" fill="#8a7045" stroke="#5c4a2a" stroke-width="1.5"/><rect x="14" y="14" width="28" height="40" rx="2" fill="#a08050"/><rect x="14" y="14" width="28" height="8" fill="#c8b080" rx="2"/><rect x="16" y="16" width="24" height="4" fill="#d4c090" opacity="0.6" rx="1"/><rect x="12" y="24" width="32" height="3" fill="#5c4a2a" opacity="0.4"/><rect x="12" y="36" width="32" height="3" fill="#5c4a2a" opacity="0.4"/><rect x="12" y="48" width="32" height="3" fill="#5c4a2a" opacity="0.4"/><path d="M44 20h6a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5h-6" fill="#a08050" stroke="#5c4a2a" stroke-width="2"/><rect x="12" y="10" width="32" height="4" rx="2" fill="#5c4a2a"/><rect x="14" y="54" width="28" height="3" rx="1" fill="#5c4a2a"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="3" width="13" height="18" rx="2"/><rect x="4" y="7" width="13" height="2" opacity="0.3"/><rect x="4" y="13" width="13" height="2" opacity="0.3"/><path d="M17 7h2.5A2.5 2.5 0 0 1 22 9.5v5a2.5 2.5 0 0 1-2.5 2.5H17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  {
    style: PubIconStyle.MAP_PIN,
    label: "Map Pin",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80"><path d="M32 0C18.7 0 8 10.7 8 24c0 17.8 24 40 24 40s24-22.2 24-40C56 10.7 45.3 0 32 0z" fill="#2563eb"/><rect x="20" y="12" width="16" height="22" rx="2" fill="#f5deb3" stroke="#8B6914" stroke-width="1"/><rect x="22" y="13" width="12" height="6" rx="1" fill="#fff" opacity="0.8"/><rect x="22" y="20" width="12" height="12" fill="#d4920a"/><path d="M36 18h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4" fill="none" stroke="#f5deb3" stroke-width="1.5"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30"><path d="M12 0C6.5 0 2 4.5 2 10c0 7.4 10 18 10 18s10-10.6 10-18C22 4.5 17.5 0 12 0z" fill="currentColor"/><rect x="8.5" y="5" width="7" height="11" rx="1" fill="#fff"/><rect x="9.5" y="5" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.3"/><path d="M15.5 7.5h1.2a1.3 1.3 0 0 1 1.3 1.3v1.4a1.3 1.3 0 0 1-1.3 1.3h-1.2" fill="none" stroke="#fff" stroke-width="1.2"/></svg>`,
  },
];

export enum SpireIconStyle {
  GOTHIC = "GOTHIC",
  CATHEDRAL = "CATHEDRAL",
  VILLAGE = "VILLAGE",
  CHAPEL = "CHAPEL",
  MAP_PIN = "MAP_PIN",
}

export const SPIRE_ICON_OPTIONS: PoiIconOption<SpireIconStyle>[] = [
  {
    style: SpireIconStyle.GOTHIC,
    label: "Gothic",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="32,2 36,22 28,22" fill="#6b5b4f"/><rect x="22" y="22" width="20" height="36" fill="#8c7b6b" stroke="#5a4a3a" stroke-width="1"/><rect x="18" y="56" width="28" height="6" fill="#6b5b4f" stroke="#5a4a3a" stroke-width="1"/><rect x="28" y="42" width="8" height="14" rx="4" fill="#4a3728"/><path d="M28 42a4 4 0 0 1 8 0" fill="#5a4a3a"/><rect x="24" y="26" width="5" height="8" rx="2.5" fill="#87ceeb" opacity="0.6"/><rect x="35" y="26" width="5" height="8" rx="2.5" fill="#87ceeb" opacity="0.6"/><rect x="24" y="36" width="5" height="5" rx="2.5" fill="#87ceeb" opacity="0.5"/><rect x="35" y="36" width="5" height="5" rx="2.5" fill="#87ceeb" opacity="0.5"/><line x1="26.5" y1="26" x2="26.5" y2="34" stroke="#5a4a3a" stroke-width="0.5"/><line x1="37.5" y1="26" x2="37.5" y2="34" stroke="#5a4a3a" stroke-width="0.5"/><rect x="30" y="0" width="4" height="4" fill="#5a4a3a"/><line x1="32" y1="0" x2="32" y2="4" stroke="#8c7b6b" stroke-width="0.5"/><line x1="30" y1="2" x2="34" y2="2" stroke="#8c7b6b" stroke-width="0.5"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="16" r="6"/><rect x="11" y="2" width="2" height="12"/><rect x="8" y="5" width="8" height="2"/></svg>`,
  },
  {
    style: SpireIconStyle.CATHEDRAL,
    label: "Cathedral",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="32,1 35,18 29,18" fill="#7a6a5a"/><rect x="24" y="18" width="16" height="10" fill="#9c8c7c"/><rect x="16" y="28" width="32" height="30" fill="#8c7c6c" stroke="#5a4a3a" stroke-width="1"/><rect x="12" y="56" width="40" height="6" fill="#7a6a5a" stroke="#5a4a3a" stroke-width="1"/><polygon points="16,28 24,18 24,28" fill="#9c8c7c"/><polygon points="48,28 40,18 40,28" fill="#9c8c7c"/><rect x="28" y="44" width="8" height="12" rx="4" fill="#4a3728"/><path d="M28 44a4 4 0 0 1 8 0" fill="#5a4a3a"/><circle cx="32" cy="34" r="5" fill="#87ceeb" opacity="0.5" stroke="#5a4a3a" stroke-width="0.7"/><line x1="32" y1="29" x2="32" y2="39" stroke="#5a4a3a" stroke-width="0.5"/><line x1="27" y1="34" x2="37" y2="34" stroke="#5a4a3a" stroke-width="0.5"/><rect x="18" y="32" width="4" height="6" rx="2" fill="#87ceeb" opacity="0.4"/><rect x="42" y="32" width="4" height="6" rx="2" fill="#87ceeb" opacity="0.4"/><rect x="18" y="42" width="4" height="6" rx="2" fill="#87ceeb" opacity="0.4"/><rect x="42" y="42" width="4" height="6" rx="2" fill="#87ceeb" opacity="0.4"/><polygon points="16,28 12,32 16,32" fill="#8c7c6c"/><polygon points="48,28 52,32 48,32" fill="#8c7c6c"/><rect x="30" y="0" width="4" height="3" fill="#5a4a3a"/><line x1="32" y1="0" x2="32" y2="3" stroke="#9c8c7c" stroke-width="0.5"/><line x1="30" y1="1.5" x2="34" y2="1.5" stroke="#9c8c7c" stroke-width="0.5"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="10" y="2" width="4" height="20" rx="1"/><rect x="4" y="6" width="16" height="4" rx="1"/></svg>`,
  },
  {
    style: SpireIconStyle.VILLAGE,
    label: "Village Church",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="14" y="30" width="28" height="28" fill="#c4a882" stroke="#8a7050" stroke-width="1"/><polygon points="14,30 28,16 42,30" fill="#8b4513"/><rect x="12" y="56" width="32" height="6" fill="#8a7050"/><rect x="24" y="44" width="8" height="12" rx="1" fill="#5c3d1e"/><rect x="16" y="34" width="5" height="7" fill="#87ceeb" opacity="0.5" stroke="#8a7050" stroke-width="0.5"/><rect x="35" y="34" width="5" height="7" fill="#87ceeb" opacity="0.5" stroke="#8a7050" stroke-width="0.5"/><rect x="16" y="45" width="5" height="7" fill="#87ceeb" opacity="0.5" stroke="#8a7050" stroke-width="0.5"/><rect x="35" y="45" width="5" height="7" fill="#87ceeb" opacity="0.5" stroke="#8a7050" stroke-width="0.5"/><rect x="42" y="34" width="10" height="24" fill="#c4a882" stroke="#8a7050" stroke-width="1"/><polygon points="42,34 47,8 52,34" fill="#9c8c7c" stroke="#8a7050" stroke-width="1"/><rect x="45" y="0" width="4" height="10" fill="#5a4a3a"/><line x1="47" y1="0" x2="47" y2="4" stroke="#c4a882" stroke-width="0.5"/><line x1="45" y1="2" x2="49" y2="2" stroke="#c4a882" stroke-width="0.5"/><rect x="44" y="40" width="6" height="8" rx="3" fill="#87ceeb" opacity="0.5"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,1 15,12 15,22 9,22 9,12"/><rect x="8" y="8" width="8" height="2"/><rect x="10" y="16" width="4" height="6" fill="#fff" opacity="0.4"/><path d="M10 14a2 2 0 0 1 4 0" fill="#fff" opacity="0.4"/></svg>`,
  },
  {
    style: SpireIconStyle.CHAPEL,
    label: "Chapel",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="16" y="28" width="32" height="30" fill="#d4c4a8" stroke="#8a7050" stroke-width="1"/><polygon points="16,28 32,14 48,28" fill="#a0522d"/><rect x="14" y="56" width="36" height="6" fill="#8a7050"/><rect x="28" y="44" width="8" height="12" rx="1" fill="#5c3d1e"/><polygon points="32,2 34,14 30,14" fill="#8a7050"/><rect x="30" y="0" width="4" height="4" fill="#5a4a3a"/><line x1="32" y1="0" x2="32" y2="4" stroke="#d4c4a8" stroke-width="0.5"/><line x1="30" y1="2" x2="34" y2="2" stroke="#d4c4a8" stroke-width="0.5"/><circle cx="32" cy="22" r="4" fill="#e8c840" opacity="0.6" stroke="#8a7050" stroke-width="0.5"/><line x1="32" y1="18" x2="32" y2="26" stroke="#8a7050" stroke-width="0.5"/><line x1="28" y1="22" x2="36" y2="22" stroke="#8a7050" stroke-width="0.5"/><rect x="19" y="32" width="5" height="7" rx="2.5" fill="#87ceeb" opacity="0.5"/><rect x="40" y="32" width="5" height="7" rx="2.5" fill="#87ceeb" opacity="0.5"/><rect x="19" y="44" width="5" height="7" rx="2.5" fill="#87ceeb" opacity="0.4"/><rect x="40" y="44" width="5" height="7" rx="2.5" fill="#87ceeb" opacity="0.4"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="12" width="12" height="10" rx="1"/><polygon points="6,12 12,5 18,12"/><polygon points="12,1 13,5 11,5"/><rect x="10" y="16" width="4" height="6" fill="#fff" opacity="0.4"/></svg>`,
  },
  {
    style: SpireIconStyle.MAP_PIN,
    label: "Map Pin",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80"><path d="M32 0C18.7 0 8 10.7 8 24c0 17.8 24 40 24 40s24-22.2 24-40C56 10.7 45.3 0 32 0z" fill="#711894"/><polygon points="32,8 35,20 29,20" fill="#d4c4a8"/><rect x="24" y="20" width="16" height="14" fill="#c4a882" stroke="#8a7050" stroke-width="0.7"/><rect x="28" y="28" width="8" height="6" rx="4" fill="#5c3d1e"/><rect x="30" y="6" width="4" height="4" fill="#d4c4a8"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30"><path d="M12 0C6.5 0 2 4.5 2 10c0 7.4 10 18 10 18s10-10.6 10-18C22 4.5 17.5 0 12 0z" fill="currentColor"/><rect x="11" y="4" width="2" height="9" fill="#fff"/><rect x="8.5" y="6" width="7" height="2" fill="#fff"/></svg>`,
  },
];

export enum TowerIconStyle {
  CASTLE = "CASTLE",
  CHURCH_TOWER = "CHURCH_TOWER",
  LIGHTHOUSE = "LIGHTHOUSE",
  CLOCK_TOWER = "CLOCK_TOWER",
  MAP_PIN = "MAP_PIN",
}

export const TOWER_ICON_OPTIONS: PoiIconOption<TowerIconStyle>[] = [
  {
    style: TowerIconStyle.CASTLE,
    label: "Castle Tower",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="16" y="20" width="32" height="38" fill="#9c8c7c" stroke="#5a4a3a" stroke-width="1"/><rect x="12" y="56" width="40" height="6" fill="#7a6a5a"/><rect x="14" y="14" width="6" height="8" fill="#9c8c7c"/><rect x="24" y="14" width="6" height="8" fill="#9c8c7c"/><rect x="34" y="14" width="6" height="8" fill="#9c8c7c"/><rect x="44" y="14" width="6" height="8" fill="#9c8c7c"/><rect x="12" y="12" width="10" height="4" fill="#7a6a5a"/><rect x="22" y="12" width="10" height="4" fill="#7a6a5a"/><rect x="32" y="12" width="10" height="4" fill="#7a6a5a"/><rect x="42" y="12" width="10" height="4" fill="#7a6a5a"/><rect x="26" y="40" width="12" height="16" rx="6" fill="#4a3728"/><path d="M26 40a6 6 0 0 1 12 0" fill="#5a4a3a"/><rect x="20" y="24" width="5" height="6" fill="#4a3728"/><rect x="39" y="24" width="5" height="6" fill="#4a3728"/><rect x="20" y="34" width="5" height="5" fill="#4a3728"/><rect x="39" y="34" width="5" height="5" fill="#4a3728"/><line x1="16" y1="20" x2="48" y2="20" stroke="#5a4a3a" stroke-width="1.5"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="10" width="12" height="12"/><rect x="11" y="2" width="2" height="12"/><rect x="8" y="5" width="8" height="2"/></svg>`,
  },
  {
    style: TowerIconStyle.CHURCH_TOWER,
    label: "Church Tower",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="20" y="16" width="16" height="42" fill="#c4a882" stroke="#8a7050" stroke-width="1"/><rect x="18" y="56" width="20" height="6" fill="#8a7050"/><rect x="18" y="14" width="20" height="4" fill="#8a7050"/><rect x="22" y="10" width="12" height="6" fill="#b09870"/><rect x="26" y="2" width="4" height="10" fill="#8a7050"/><line x1="28" y1="0" x2="28" y2="4" stroke="#c4a882" stroke-width="0.5"/><line x1="26" y1="2" x2="30" y2="2" stroke="#c4a882" stroke-width="0.5"/><rect x="22" y="20" width="5" height="7" rx="2.5" fill="#87ceeb" opacity="0.5"/><rect x="29" y="20" width="5" height="7" rx="2.5" fill="#87ceeb" opacity="0.5"/><rect x="22" y="32" width="5" height="7" rx="2.5" fill="#87ceeb" opacity="0.5"/><rect x="29" y="32" width="5" height="7" rx="2.5" fill="#87ceeb" opacity="0.5"/><rect x="24" y="44" width="8" height="12" rx="4" fill="#5c3d1e"/><rect x="38" y="30" width="18" height="28" fill="#c4a882" stroke="#8a7050" stroke-width="1"/><polygon points="38,30 47,20 56,30" fill="#8b4513"/><rect x="36" y="56" width="22" height="6" fill="#8a7050"/><rect x="40" y="36" width="4" height="6" fill="#87ceeb" opacity="0.5"/><rect x="48" y="36" width="4" height="6" fill="#87ceeb" opacity="0.5"/><rect x="43" y="46" width="6" height="10" rx="1" fill="#5c3d1e"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="16" rx="1"/><rect x="11" y="1" width="2" height="8"/><rect x="8" y="3" width="8" height="2"/><rect x="9" y="14" width="6" height="8" fill="#fff" opacity="0.4" rx="1"/><circle cx="12" cy="11" r="2" fill="#fff" opacity="0.4"/></svg>`,
  },
  {
    style: TowerIconStyle.LIGHTHOUSE,
    label: "Lighthouse",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="24,56 28,14 36,14 40,56" fill="#fff" stroke="#444" stroke-width="1"/><rect x="26" y="8" width="12" height="8" rx="1" fill="#333" stroke="#444" stroke-width="0.5"/><rect x="24" y="56" width="16" height="6" fill="#666"/><polygon points="27,20 37,20 39,28 25,28" fill="#cc2200"/><polygon points="26,32 38,32 39,40 25,40" fill="#cc2200"/><polygon points="25,44 39,44 40,52 24,52" fill="#cc2200"/><rect x="30" y="2" width="4" height="8" fill="#555"/><ellipse cx="32" cy="2" rx="3" ry="2" fill="#ff0" opacity="0.8"/><ellipse cx="32" cy="2" rx="5" ry="3" fill="#ff0" opacity="0.2"/><rect x="28" y="10" width="3" height="4" fill="#87ceeb" opacity="0.6"/><rect x="33" y="10" width="3" height="4" fill="#87ceeb" opacity="0.6"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="9,22 10,6 14,6 15,22"/><rect x="9" y="4" width="6" height="3" rx="0.5"/><rect x="11" y="1" width="2" height="4"/><rect x="10" y="10" width="4" height="2" opacity="0.4"/><rect x="10" y="15" width="4" height="2" opacity="0.4"/></svg>`,
  },
  {
    style: TowerIconStyle.CLOCK_TOWER,
    label: "Clock Tower",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="20" y="20" width="24" height="38" fill="#b8956a" stroke="#7a5c3a" stroke-width="1"/><rect x="16" y="56" width="32" height="6" fill="#7a5c3a"/><polygon points="20,20 32,6 44,20" fill="#8b4513"/><polygon points="32,0 34,6 30,6" fill="#7a5c3a"/><rect x="30" y="0" width="4" height="2" fill="#5a3c1a"/><circle cx="32" cy="30" r="7" fill="#fffff0" stroke="#7a5c3a" stroke-width="1.5"/><circle cx="32" cy="30" r="5.5" fill="#fff"/><line x1="32" y1="25" x2="32" y2="30" stroke="#333" stroke-width="1" stroke-linecap="round"/><line x1="32" y1="30" x2="35" y2="33" stroke="#333" stroke-width="0.8" stroke-linecap="round"/><circle cx="32" cy="30" r="0.8" fill="#333"/><rect x="24" y="42" width="5" height="7" fill="#87ceeb" opacity="0.5" stroke="#7a5c3a" stroke-width="0.5"/><rect x="35" y="42" width="5" height="7" fill="#87ceeb" opacity="0.5" stroke="#7a5c3a" stroke-width="0.5"/><rect x="28" y="50" width="8" height="6" rx="1" fill="#5c3d1e"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="8" width="10" height="14" rx="1"/><polygon points="7,8 12,2 17,8"/><circle cx="12" cy="13" r="3.5" fill="#fff" opacity="0.5"/><line x1="12" y1="10.5" x2="12" y2="13" stroke="currentColor" stroke-width="0.8"/><line x1="12" y1="13" x2="14" y2="14.5" stroke="currentColor" stroke-width="0.6"/></svg>`,
  },
  {
    style: TowerIconStyle.MAP_PIN,
    label: "Map Pin",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80"><path d="M32 0C18.7 0 8 10.7 8 24c0 17.8 24 40 24 40s24-22.2 24-40C56 10.7 45.3 0 32 0z" fill="#ec4899"/><rect x="22" y="10" width="20" height="22" fill="#c4a882" stroke="#8a7050" stroke-width="0.7"/><rect x="20" y="8" width="24" height="4" fill="#8a7050"/><rect x="24" y="4" width="16" height="6" fill="#b09870"/><rect x="30" y="0" width="4" height="6" fill="#8a7050"/><rect x="26" y="16" width="4" height="6" rx="2" fill="#87ceeb" opacity="0.5"/><rect x="34" y="16" width="4" height="6" rx="2" fill="#87ceeb" opacity="0.5"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30"><path d="M12 0C6.5 0 2 4.5 2 10c0 7.4 10 18 10 18s10-10.6 10-18C22 4.5 17.5 0 12 0z" fill="currentColor"/><rect x="8" y="5" width="8" height="8" fill="#fff"/><rect x="11" y="3" width="2" height="6" fill="#fff"/><rect x="9" y="4.5" width="6" height="1.5" fill="#fff"/></svg>`,
  },
];

export enum PhoneIconStyle {
  RED_BOX = "RED_BOX",
  PHONE_BOOTH = "PHONE_BOOTH",
  VINTAGE = "VINTAGE",
  PAYPHONE = "PAYPHONE",
  MAP_PIN = "MAP_PIN",
}

export const PHONE_ICON_OPTIONS: PoiIconOption<PhoneIconStyle>[] = [
  {
    style: PhoneIconStyle.RED_BOX,
    label: "Red Phone Box",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="14" y="8" width="36" height="50" rx="2" fill="#cc2200" stroke="#8b1500" stroke-width="1.5"/><rect x="14" y="56" width="36" height="6" fill="#8b1500"/><rect x="16" y="6" width="32" height="4" rx="2" fill="#dd3311"/><rect x="20" y="4" width="24" height="4" rx="2" fill="#ee4422"/><rect x="18" y="14" width="28" height="30" rx="1" fill="#87ceeb" opacity="0.3" stroke="#8b1500" stroke-width="0.7"/><line x1="25" y1="14" x2="25" y2="44" stroke="#8b1500" stroke-width="0.7"/><line x1="32" y1="14" x2="32" y2="44" stroke="#8b1500" stroke-width="0.7"/><line x1="39" y1="14" x2="39" y2="44" stroke="#8b1500" stroke-width="0.7"/><line x1="18" y1="24" x2="46" y2="24" stroke="#8b1500" stroke-width="0.7"/><line x1="18" y1="34" x2="46" y2="34" stroke="#8b1500" stroke-width="0.7"/><rect x="26" y="46" width="12" height="8" rx="1" fill="#8b1500"/><rect x="28" y="48" width="8" height="4" rx="0.5" fill="#666"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="2" width="10" height="20" rx="1"/><rect x="9" y="4" width="6" height="8" fill="#fff" opacity="0.4" rx="0.5"/><rect x="10" y="14" width="4" height="3" fill="#fff" opacity="0.3" rx="0.5"/><rect x="7" y="2" width="10" height="3" rx="1"/></svg>`,
  },
  {
    style: PhoneIconStyle.PHONE_BOOTH,
    label: "Phone Booth",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="16" y="6" width="32" height="52" rx="2" fill="#e8e8e8" stroke="#999" stroke-width="1.5"/><rect x="16" y="56" width="32" height="6" fill="#999"/><rect x="18" y="4" width="28" height="4" rx="2" fill="#ccc"/><rect x="20" y="12" width="24" height="32" rx="1" fill="#87ceeb" opacity="0.35" stroke="#999" stroke-width="0.7"/><line x1="32" y1="12" x2="32" y2="44" stroke="#999" stroke-width="0.5"/><line x1="20" y1="28" x2="44" y2="28" stroke="#999" stroke-width="0.5"/><rect x="26" y="46" width="12" height="8" rx="1" fill="#888"/><rect x="28" y="48" width="8" height="4" rx="0.5" fill="#555"/><circle cx="32" cy="50" r="1" fill="#ccc"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="2" width="10" height="20" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><rect x="9" y="4" width="6" height="10" fill="currentColor" opacity="0.2" rx="0.5"/><rect x="10" y="16" width="4" height="3" fill="currentColor" rx="0.5"/></svg>`,
  },
  {
    style: PhoneIconStyle.VINTAGE,
    label: "Vintage Phone",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="32" cy="48" rx="18" ry="6" fill="#222" stroke="#111" stroke-width="1"/><rect x="22" y="32" width="20" height="18" rx="3" fill="#1a1a1a" stroke="#333" stroke-width="1"/><ellipse cx="32" cy="38" rx="6" ry="6" fill="#333" stroke="#444" stroke-width="0.5"/><ellipse cx="32" cy="38" rx="4" ry="4" fill="#222"/><circle cx="29" cy="36" r="1" fill="#555"/><circle cx="32" cy="33.5" r="1" fill="#555"/><circle cx="35" cy="36" r="1" fill="#555"/><circle cx="29" cy="40" r="1" fill="#555"/><circle cx="32" cy="42.5" r="1" fill="#555"/><circle cx="35" cy="40" r="1" fill="#555"/><path d="M18 26c0-4 4-8 8-8h12c4 0 8 4 8 8" fill="none" stroke="#222" stroke-width="4" stroke-linecap="round"/><path d="M18 26c0-4 4-8 8-8h12c4 0 8 4 8 8" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="18" cy="26" rx="4" ry="3" fill="#222" stroke="#333" stroke-width="0.5"/><ellipse cx="46" cy="26" rx="4" ry="3" fill="#222" stroke="#333" stroke-width="0.5"/><ellipse cx="18" cy="26" rx="2.5" ry="2" fill="#333"/><ellipse cx="46" cy="26" rx="2.5" ry="2" fill="#333"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`,
  },
  {
    style: PhoneIconStyle.PAYPHONE,
    label: "Payphone",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="20" y="4" width="24" height="52" rx="3" fill="#444" stroke="#333" stroke-width="1.5"/><rect x="20" y="54" width="24" height="6" fill="#333"/><rect x="24" y="8" width="16" height="10" rx="1" fill="#87ceeb" opacity="0.3" stroke="#555" stroke-width="0.5"/><rect x="26" y="22" width="12" height="14" rx="1" fill="#555"/><circle cx="29" cy="26" r="1.5" fill="#777"/><circle cx="32" cy="26" r="1.5" fill="#777"/><circle cx="35" cy="26" r="1.5" fill="#777"/><circle cx="29" cy="30" r="1.5" fill="#777"/><circle cx="32" cy="30" r="1.5" fill="#777"/><circle cx="35" cy="30" r="1.5" fill="#777"/><circle cx="29" cy="34" r="1.5" fill="#777"/><circle cx="32" cy="34" r="1.5" fill="#777"/><circle cx="35" cy="34" r="1.5" fill="#777"/><rect x="26" y="40" width="12" height="4" rx="1" fill="#666"/><path d="M26 46h12" stroke="#555" stroke-width="1.5" stroke-linecap="round"/><rect x="28" y="48" width="8" height="3" rx="0.5" fill="#555"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="2" width="10" height="20" rx="2"/><rect x="9" y="4" width="6" height="4" fill="#fff" opacity="0.3" rx="0.5"/><circle cx="10" cy="11" r="0.8" fill="#fff" opacity="0.4"/><circle cx="12" cy="11" r="0.8" fill="#fff" opacity="0.4"/><circle cx="14" cy="11" r="0.8" fill="#fff" opacity="0.4"/><circle cx="10" cy="14" r="0.8" fill="#fff" opacity="0.4"/><circle cx="12" cy="14" r="0.8" fill="#fff" opacity="0.4"/><circle cx="14" cy="14" r="0.8" fill="#fff" opacity="0.4"/><rect x="9" y="17" width="6" height="2" fill="#fff" opacity="0.3" rx="0.5"/></svg>`,
  },
  {
    style: PhoneIconStyle.MAP_PIN,
    label: "Map Pin",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80"><path d="M32 0C18.7 0 8 10.7 8 24c0 17.8 24 40 24 40s24-22.2 24-40C56 10.7 45.3 0 32 0z" fill="#ca8a04"/><rect x="22" y="8" width="20" height="28" rx="2" fill="#cc2200" stroke="#8b1500" stroke-width="1"/><rect x="25" y="12" width="14" height="14" rx="0.5" fill="#87ceeb" opacity="0.3" stroke="#8b1500" stroke-width="0.5"/><line x1="29" y1="12" x2="29" y2="26" stroke="#8b1500" stroke-width="0.5"/><line x1="35" y1="12" x2="35" y2="26" stroke="#8b1500" stroke-width="0.5"/><rect x="27" y="28" width="10" height="5" rx="0.5" fill="#8b1500"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30"><path d="M12 0C6.5 0 2 4.5 2 10c0 7.4 10 18 10 18s10-10.6 10-18C22 4.5 17.5 0 12 0z" fill="currentColor"/><rect x="9" y="4" width="6" height="12" rx="1" fill="#fff"/><rect x="9" y="4" width="6" height="3" rx="1" fill="#fff"/><rect x="10.5" y="9" width="3" height="2" fill="currentColor" opacity="0.3" rx="0.5"/></svg>`,
  },
];

export enum SchoolIconStyle {
  BUILDING = "BUILDING",
  BOOKS = "BOOKS",
  GRADUATION = "GRADUATION",
  BLACKBOARD = "BLACKBOARD",
  MAP_PIN = "MAP_PIN",
}

export const SCHOOL_ICON_OPTIONS: PoiIconOption<SchoolIconStyle>[] = [
  {
    style: SchoolIconStyle.BUILDING,
    label: "School",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="28" width="48" height="30" fill="#cc7744" stroke="#8a4420" stroke-width="1"/><rect x="6" y="56" width="52" height="6" fill="#8a4420"/><polygon points="8,28 32,12 56,28" fill="#8b4513"/><rect x="26" y="42" width="12" height="14" rx="1" fill="#5c3d1e"/><rect x="30" y="44" width="1" height="10" fill="#8a4420"/><circle cx="36" cy="50" r="1" fill="#c8960e"/><rect x="12" y="32" width="8" height="8" fill="#87ceeb" opacity="0.5" stroke="#8a4420" stroke-width="0.5"/><rect x="44" y="32" width="8" height="8" fill="#87ceeb" opacity="0.5" stroke="#8a4420" stroke-width="0.5"/><rect x="12" y="44" width="8" height="8" fill="#87ceeb" opacity="0.5" stroke="#8a4420" stroke-width="0.5"/><rect x="44" y="44" width="8" height="8" fill="#87ceeb" opacity="0.5" stroke="#8a4420" stroke-width="0.5"/><line x1="16" y1="32" x2="16" y2="40" stroke="#8a4420" stroke-width="0.4"/><line x1="48" y1="32" x2="48" y2="40" stroke="#8a4420" stroke-width="0.4"/><line x1="12" y1="36" x2="20" y2="36" stroke="#8a4420" stroke-width="0.4"/><line x1="44" y1="36" x2="52" y2="36" stroke="#8a4420" stroke-width="0.4"/><rect x="28" y="10" width="8" height="4" rx="1" fill="#c8960e"/><line x1="32" y1="6" x2="32" y2="12" stroke="#8a4420" stroke-width="1"/><polygon points="30,6 34,6 32,2" fill="#cc2200"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>`,
  },
  {
    style: SchoolIconStyle.BOOKS,
    label: "Books",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="14" width="10" height="42" rx="1" fill="#cc2200" stroke="#8b1500" stroke-width="0.5"/><rect x="10" y="16" width="6" height="38" fill="#dd3311"/><line x1="13" y1="18" x2="13" y2="52" stroke="#8b1500" stroke-width="0.5"/><rect x="19" y="10" width="10" height="46" rx="1" fill="#2255aa" stroke="#1a3d7a" stroke-width="0.5"/><rect x="21" y="12" width="6" height="42" fill="#2563eb"/><line x1="24" y1="14" x2="24" y2="52" stroke="#1a3d7a" stroke-width="0.5"/><rect x="30" y="16" width="10" height="40" rx="1" fill="#16a34a" stroke="#0d7a30" stroke-width="0.5"/><rect x="32" y="18" width="6" height="36" fill="#22b855"/><line x1="35" y1="20" x2="35" y2="52" stroke="#0d7a30" stroke-width="0.5"/><rect x="41" y="12" width="10" height="44" rx="1" fill="#ca8a04" stroke="#8a6004" stroke-width="0.5"/><rect x="43" y="14" width="6" height="40" fill="#e8a317"/><line x1="46" y1="16" x2="46" y2="52" stroke="#8a6004" stroke-width="0.5"/><rect x="6" y="54" width="48" height="4" rx="1" fill="#8a7050"/><rect x="10" y="20" width="6" height="3" fill="#fff" opacity="0.3"/><rect x="21" y="16" width="6" height="3" fill="#fff" opacity="0.3"/><rect x="32" y="22" width="6" height="3" fill="#fff" opacity="0.3"/><rect x="43" y="18" width="6" height="3" fill="#fff" opacity="0.3"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="4" height="16" rx="0.5"/><rect x="8" y="3" width="4" height="17" rx="0.5"/><rect x="13" y="5" width="4" height="15" rx="0.5"/><rect x="18" y="3" width="4" height="17" rx="0.5"/><rect x="2" y="20" width="21" height="2" rx="0.5"/></svg>`,
  },
  {
    style: SchoolIconStyle.GRADUATION,
    label: "Graduation Cap",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="32,8 2,24 32,40 62,24" fill="#1a1a1a"/><polygon points="32,8 2,24 32,40 62,24" fill="#333" opacity="0.3"/><polygon points="32,40 2,24 2,26 32,42 62,26 62,24" fill="#111"/><polygon points="32,35 14,26 14,40 32,50 50,40 50,26" fill="#222"/><polygon points="32,35 14,26 14,28 32,38 50,28 50,26" fill="#333" opacity="0.5"/><line x1="32" y1="42" x2="32" y2="50" stroke="#c8960e" stroke-width="1.5"/><circle cx="32" cy="50" r="1.5" fill="#c8960e"/><rect x="56" y="24" width="2" height="22" fill="#c8960e"/><circle cx="57" cy="46" r="2" fill="#c8960e"/><polygon points="55,46 59,46 57,52" fill="#c8960e"/><rect x="30" y="6" width="4" height="4" fill="#333"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>`,
  },
  {
    style: SchoolIconStyle.BLACKBOARD,
    label: "Blackboard",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="6" y="10" width="52" height="38" rx="2" fill="#5c3d1e" stroke="#3a2510" stroke-width="1.5"/><rect x="10" y="14" width="44" height="30" rx="1" fill="#2d5a27"/><rect x="10" y="14" width="44" height="30" rx="1" fill="#1a4a14" opacity="0.5"/><text x="18" y="34" font-family="serif" font-size="16" fill="#e8e8c8" font-weight="bold">ABC</text><text x="18" y="42" font-family="serif" font-size="6" fill="#e8e8c8" opacity="0.6">123</text><rect x="24" y="48" width="16" height="3" rx="0.5" fill="#ccc"/><rect x="28" y="48" width="3" height="3" fill="#fff"/><rect x="33" y="48" width="3" height="3" fill="#ffe4b5"/><line x1="28" y1="56" x2="28" y2="62" stroke="#5c3d1e" stroke-width="2"/><line x1="36" y1="56" x2="36" y2="62" stroke="#5c3d1e" stroke-width="2"/><rect x="24" y="60" width="16" height="3" rx="0.5" fill="#5c3d1e"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="3" width="20" height="14" rx="1"/><rect x="4" y="5" width="16" height="10" fill="#fff" opacity="0.2" rx="0.5"/><text x="7" y="13" font-family="sans-serif" font-size="7" fill="#fff" opacity="0.7">AB</text><line x1="9" y1="20" x2="9" y2="22" stroke="currentColor" stroke-width="1.5"/><line x1="15" y1="20" x2="15" y2="22" stroke="currentColor" stroke-width="1.5"/><rect x="7" y="21" width="10" height="2" rx="0.5"/></svg>`,
  },
  {
    style: SchoolIconStyle.MAP_PIN,
    label: "Map Pin",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80"><path d="M32 0C18.7 0 8 10.7 8 24c0 17.8 24 40 24 40s24-22.2 24-40C56 10.7 45.3 0 32 0z" fill="#16a34a"/><rect x="18" y="12" width="28" height="20" fill="#cc7744" stroke="#8a4420" stroke-width="0.7"/><polygon points="18,12 32,4 46,12" fill="#8b4513"/><rect x="28" y="22" width="8" height="10" rx="1" fill="#5c3d1e"/><rect x="20" y="16" width="5" height="5" fill="#87ceeb" opacity="0.5"/><rect x="39" y="16" width="5" height="5" fill="#87ceeb" opacity="0.5"/></svg>`,
    simpleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30"><path d="M12 0C6.5 0 2 4.5 2 10c0 7.4 10 18 10 18s10-10.6 10-18C22 4.5 17.5 0 12 0z" fill="currentColor"/><path d="M12 5L7 8l2 1.1v3L12 14l3-1.9v-3l1-.55V11h1V8L12 5z" fill="#fff"/></svg>`,
  },
];
