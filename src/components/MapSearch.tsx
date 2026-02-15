"use client"

import { useState, useRef, useCallback } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCurrentPlayer } from "@/stores/game-store"
import { log } from "@/lib/utils"

interface SearchResult {
  lat: number
  lng: number
  name: string
  distance: number
}

const UK_BOUNDS = {
  south: 49.5,
  north: 61.0,
  west: -8.5,
  east: 2.0,
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function MapSearch() {
  const map = useMap()
  const currentPlayer = useCurrentPlayer()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searching, setSearching] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const markerRef = useRef<L.Marker | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const clearMarker = useCallback(() => {
    if (markerRef.current && map) {
      map.removeLayer(markerRef.current)
      markerRef.current = null
    }
  }, [map])

  const showResult = useCallback((result: SearchResult) => {
    if (!map) return
    clearMarker()
    map.flyTo([result.lat, result.lng], 14)
    markerRef.current = L.marker([result.lat, result.lng])
      .addTo(map)
      .bindPopup(result.name)
      .openPopup()
  }, [map, clearMarker])

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !map) return

    setSearching(true)
    try {
      const { south, north, west, east } = UK_BOUNDS
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&bounded=1&viewbox=${west},${north},${east},${south}&limit=50&countrycodes=gb`
      const response = await fetch(url)
      const data = await response.json()

      const refLat = currentPlayer?.position[0] ?? map.getCenter().lat
      const refLng = currentPlayer?.position[1] ?? map.getCenter().lng

      const sorted: SearchResult[] = data
        .map((item: { lat: string; lon: string; display_name: string }) => {
          const lat = parseFloat(item.lat)
          const lng = parseFloat(item.lon)
          return {
            lat,
            lng,
            name: item.display_name,
            distance: haversineDistance(refLat, refLng, lat, lng),
          }
        })
        .sort((a: SearchResult, b: SearchResult) => a.distance - b.distance)

      setResults(sorted)
      setCurrentIndex(0)

      if (sorted.length > 0) {
        showResult(sorted[0])
      }

      log.debug("MapSearch: found", sorted.length, "results for", query)
    } catch (err) {
      log.error("MapSearch: search failed", err)
    } finally {
      setSearching(false)
    }
  }, [query, map, currentPlayer, showResult])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      void handleSearch()
    }
    if (e.key === "Escape") {
      handleClose()
    }
  }

  function handleNext() {
    if (results.length === 0) return
    const next = (currentIndex + 1) % results.length
    setCurrentIndex(next)
    showResult(results[next])
  }

  function handlePrev() {
    if (results.length === 0) return
    const prev = (currentIndex - 1 + results.length) % results.length
    setCurrentIndex(prev)
    showResult(results[prev])
  }

  function handleClose() {
    setExpanded(false)
    setQuery("")
    setResults([])
    setCurrentIndex(0)
    clearMarker()
  }

  function handleExpand() {
    setExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  if (!expanded) {
    return (
      <div className="absolute top-2 left-2 z-[1000]">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-md"
          onClick={handleExpand}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-1">
      <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-md shadow-md border p-1">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search map..."
          className="h-8 w-48 sm:w-64 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={searching}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => void handleSearch()}
          disabled={searching || !query.trim()}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {results.length > 0 && (
        <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-md shadow-md border px-2 py-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[4rem] text-center">
            {currentIndex + 1} of {results.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-xs truncate max-w-[180px]" title={results[currentIndex].name}>
            {results[currentIndex].name.split(",")[0]}
          </span>
        </div>
      )}

      {results.length === 0 && query && !searching && (
        <div className="bg-background/95 backdrop-blur-sm rounded-md shadow-md border px-2 py-1">
          <span className="text-xs text-muted-foreground">No results found</span>
        </div>
      )}
    </div>
  )
}
