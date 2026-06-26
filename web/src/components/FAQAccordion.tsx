import { FAQ } from "@/data/faqs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useT } from "@/i18n/useT";

interface FAQAccordionProps {
  faqs: FAQ[];
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  const { tx } = useT();
  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {faqs.map((faq) => (
        <AccordionItem 
          key={faq.id} 
          value={faq.id}
          className="border border-gray-100 bg-white px-6 rounded-lg data-[state=open]:shadow-md transition-all duration-300"
        >
          <AccordionTrigger className="text-left font-serif text-lg font-medium text-[#0B3A36] hover:text-[#0B3A36] hover:no-underline py-6">
            {tx(faq.question)}
          </AccordionTrigger>
          <AccordionContent className="text-gray-600 leading-relaxed pb-6 text-base">
            {tx(faq.answer)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
