import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/i18n/useT";
import { submitLead } from "@/lib/api";

interface ContactFormProps {
  propertyRef?: string;
}

export function ContactForm({ propertyRef }: ContactFormProps) {
  const { toast } = useToast();
  const { t } = useT();

  const formSchema = z.object({
    name: z.string().min(2, t("contactForm.nameRequired")),
    email: z.string().email(t("contactForm.invalidEmail")),
    phone: z.string().min(6, t("contactForm.phoneRequired")),
    subject: z.string().optional(),
    message: z.string().min(10, t("contactForm.messageMin")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: propertyRef ? t("contactForm.inquiryRe", { ref: propertyRef }) : "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const subjectLine = values.subject || (propertyRef ? `Inquiry re ${propertyRef}` : "");
    try {
      await submitLead({
        fullName: values.name,
        email: values.email,
        phone: values.phone,
        message: subjectLine ? `${subjectLine}\n\n${values.message}` : values.message,
        ...(propertyRef ? { propertyCode: propertyRef } : {}),
      });
      toast({
        title: t("contactForm.toastTitle"),
        description: t("contactForm.toastDesc"),
      });
      form.reset();
    } catch {
      toast({ title: t("contactForm.toastTitle"), description: "Could not send. Please try again.", variant: "destructive" });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("contactForm.fullName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("contactForm.fullNamePlaceholder")} {...field} className="bg-gray-50 border-gray-200 focus-visible:ring-[#0B3A36] h-12 rounded-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("contactForm.phone")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+383 4X XXX XXX"
                    inputMode="tel"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.replace(/[^\d+\s]/g, ""))}
                    className="bg-gray-50 border-gray-200 focus-visible:ring-[#0B3A36] h-12 rounded-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("contactForm.email")}</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} className="bg-gray-50 border-gray-200 focus-visible:ring-[#0B3A36] h-12 rounded-sm" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!propertyRef && (
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("contactForm.subject")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("contactForm.subjectPlaceholder")} {...field} className="bg-gray-50 border-gray-200 focus-visible:ring-[#0B3A36] h-12 rounded-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("contactForm.message")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("contactForm.messagePlaceholder")}
                  className="bg-gray-50 border-gray-200 focus-visible:ring-[#0B3A36] min-h-[120px] rounded-sm resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-[#0B3A36] text-[#F3D8A5] hover:bg-[#072D2A] uppercase tracking-widest text-xs h-14 rounded-sm">
          {t("contactForm.send")}
        </Button>
      </form>
    </Form>
  );
}
