"use client"

import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

export function QuantityStepper({
  quantity,
  decreaseLabel,
  increaseLabel,
  onChange,
}: {
  quantity: number
  decreaseLabel: string
  increaseLabel: string
  onChange: (quantity: number) => void
}) {
  return (
    <div className="bg-muted flex items-center gap-1 rounded-full p-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-full"
        aria-label={decreaseLabel}
        onClick={() => onChange(quantity - 1)}
      >
        <Minus />
      </Button>
      <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-full"
        aria-label={increaseLabel}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus />
      </Button>
    </div>
  )
}
