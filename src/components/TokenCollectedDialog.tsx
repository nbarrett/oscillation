"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"

export interface TokenCollection {
  poiId: string
  poiName: string | null
  category: string
  colour: string
}

const TOKEN_HEX: Record<string, string> = {
  blue: "#2563eb",
  black: "#374151",
  pink: "#ec4899",
  yellow: "#ca8a04",
  green: "#16a34a",
}

const TOKEN_LABEL: Record<string, string> = {
  blue: "Blue",
  black: "Black",
  pink: "Pink",
  yellow: "Yellow",
  green: "Green",
}

interface TokenCollectedDialogProps {
  collection: TokenCollection | null
  onClose: () => void
}

export default function TokenCollectedDialog({ collection, onClose }: TokenCollectedDialogProps) {
  if (!collection) return null

  const hex = TOKEN_HEX[collection.colour] ?? "#374151"
  const colourLabel = TOKEN_LABEL[collection.colour] ?? collection.colour
  const categoryLabel = POI_CATEGORY_LABELS[collection.category as PoiCategory] ?? collection.category

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-xs text-center">
        <DialogHeader>
          <DialogTitle className="text-xl">Token Collected!</DialogTitle>
          <DialogDescription>{categoryLabel} staging post</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div
            className="relative flex items-center justify-center"
            style={{ width: 96, height: 96 }}
          >
            <div
              className="absolute inset-0 rounded-full opacity-20 blur-md"
              style={{ backgroundColor: hex, transform: "scale(1.2)" }}
            />
            <div
              className="relative rounded-full flex items-center justify-center shadow-lg"
              style={{
                width: 80,
                height: 80,
                background: `radial-gradient(circle at 35% 35%, ${hex}cc, ${hex})`,
                boxShadow: `0 6px 24px ${hex}66, inset 0 -4px 8px rgba(0,0,0,0.25), inset 0 4px 8px rgba(255,255,255,0.2)`,
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: 28,
                  height: 28,
                  background: "rgba(255,255,255,0.25)",
                  boxShadow: "inset 0 1px 3px rgba(255,255,255,0.4)",
                  position: "absolute",
                  top: 12,
                  left: 14,
                }}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold" style={{ color: hex }}>
              {colourLabel} Token
            </p>
            {collection.poiName && (
              <p className="text-xs text-muted-foreground mt-0.5">{collection.poiName}</p>
            )}
          </div>
        </div>

        <Button className="w-full" onClick={onClose}>
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  )
}
