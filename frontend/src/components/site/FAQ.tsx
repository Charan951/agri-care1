import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type FAQItem = { q: string; a: string };

export function FAQ({ items }: { items: FAQItem[] }) {
  return (
    <Accordion type="single" collapsible className="divide-y divide-border rounded-xl border border-border bg-card">
      {items.map((it, i) => (
        <AccordionItem key={i} value={`i-${i}`} className="border-b-0 px-5">
          <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">
            {it.q}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
            {it.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
