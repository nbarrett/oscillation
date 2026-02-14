"use client"

import { type PoiIconOption } from "@/stores/poi-types"
import { usePoiSettingsStore } from "@/stores/poi-settings-store"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface PoiIconSelectorProps<T extends string> {
  label: string;
  colour: string;
  options: PoiIconOption<T>[];
  selected: T;
  onSelect: (style: T) => void;
}

export default function PoiIconSelector<T extends string>({
  label,
  colour,
  options,
  selected,
  onSelect,
}: PoiIconSelectorProps<T>) {
  const iconDetailMode = usePoiSettingsStore((s) => s.iconDetailMode)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1.5">
        {options.map((option) => {
          const svgSource = iconDetailMode === "simple" ? option.simpleSvg : option.svg
          return (
            <Tooltip key={option.style}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelect(option.style)}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-md border-2 transition-all hover:scale-110",
                    selected === option.style
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-muted bg-background hover:border-muted-foreground/30"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: svgSource
                      .replace(/currentColor/g, colour)
                      .replace(/<svg /, `<svg width="22" height="22" `)
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>{option.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
