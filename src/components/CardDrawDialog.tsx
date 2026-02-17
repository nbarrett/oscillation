"use client"

import { Beer, Church, Castle, Phone, GraduationCap } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"

interface CardDrawDialogProps {
  card: { title: string; body: string; type: string } | null;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  pub: <Beer className="h-8 w-8 text-blue-600" />,
  spire: <Church className="h-8 w-8 text-purple-700" />,
  tower: <Castle className="h-8 w-8 text-pink-500" />,
  phone: <Phone className="h-8 w-8 text-yellow-600" />,
  school: <GraduationCap className="h-8 w-8 text-green-600" />,
}

export default function CardDrawDialog({ card, onClose }: CardDrawDialogProps) {
  if (!card) return null

  const icon = CATEGORY_ICONS[card.type]
  const categoryLabel = POI_CATEGORY_LABELS[card.type as PoiCategory] ?? card.type

  return (
    <Dialog open={!!card} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {card.title}
          </DialogTitle>
          <DialogDescription>
            {categoryLabel} card
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm leading-relaxed">{card.body}</p>
        </div>
        <Button className="w-full" onClick={onClose}>
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  )
}
