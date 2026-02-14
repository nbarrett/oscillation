"use client"

import { usePoiSettingsStore, type IconDetailMode } from "@/stores/poi-settings-store"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/cn"

const OPTIONS: { mode: IconDetailMode; label: string }[] = [
  { mode: "detailed", label: "Detailed" },
  { mode: "simple", label: "Simple" },
]

export default function IconDetailToggle() {
  const { iconDetailMode, setIconDetailMode } = usePoiSettingsStore()

  return (
    <div className="space-y-2">
      <Label>Icon Style</Label>
      <div className="flex rounded-md border overflow-hidden">
        {OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            onClick={() => setIconDetailMode(opt.mode)}
            className={cn(
              "flex-1 px-3 py-1.5 text-xs font-medium transition-colors",
              iconDetailMode === opt.mode
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted text-muted-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
