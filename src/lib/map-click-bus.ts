type ClickHandler = (lat: number, lng: number) => void

let handler: ClickHandler | null = null

export function registerMapClickHandler(h: ClickHandler) {
  handler = h
}

export function unregisterMapClickHandler() {
  handler = null
}

export function fireMapClick(lat: number, lng: number) {
  handler?.(lat, lng)
}
