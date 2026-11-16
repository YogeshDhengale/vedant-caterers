"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function WhatsappPreview({ label, message }: { label: string; message: string }) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="preview">
        <AccordionTrigger>{label}</AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground whitespace-pre-wrap text-sm">{message}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
