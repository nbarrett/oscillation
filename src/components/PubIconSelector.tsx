"use client"

import { usePubStore, PUB_ICON_OPTIONS, PubIconStyle } from "@/stores/pub-store"
import { colours } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function iconSvgWithColour(svg: string, colour: string): string {
  return svg.replace(/currentColor/g, colour)
}

export default function PubIconSelector() {
  const { pubIconStyle, setPubIconStyle } = usePubStore()

  return (
    <div className="space-y-2">
      <Label>Pub Icon</Label>
      <div className="flex gap-1.5">
        {PUB_ICON_OPTIONS.map((option) => (
          <Tooltip key={option.style}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setPubIconStyle(option.style)}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-md border-2 transition-all hover:scale-110",
                  pubIconStyle === option.style
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-muted bg-background hover:border-muted-foreground/30"
                )}
                dangerouslySetInnerHTML={{
                  __html: iconSvgWithColour(option.svg, colours.osMapsPurple)
                    .replace(/<svg /, `<svg width="22" height="22" `)
                }}
              />
            </TooltipTrigger>
            <TooltipContent>{option.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
