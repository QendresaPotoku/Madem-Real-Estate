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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/i18n/useT";
import { submitLead, type LeadPayload } from "@/lib/api";

const REQUEST_TYPE_MAP: Record<string, LeadPayload["propertyType"]> = {
  apartment: "APARTMENT",
  house: "HOUSE",
  villa: "VILLA",
  commercial: "SHOP",
  land: "LAND",
};

export function CreateRequestForm() {
  const { toast } = useToast();
  const { t, tEnum } = useT();

  const formSchema = z.object({
    name: z.string().min(2, t("contactForm.nameRequired")),
    email: z.string().email(t("contactForm.invalidEmail")),
    phone: z.string().min(6, t("contactForm.phoneRequired")),
    intent: z.string().min(1, t("requestForm.intentRequired")),
    propertyType: z.string().min(1, t("offerForm.typeRequired")),
    location: z.string().min(2, t("requestForm.locationRequired")),
    budgetMin: z.string().optional(),
    budgetMax: z.string().min(1, t("requestForm.budgetRequired")),
    bedrooms: z.string().optional(),
    notes: z.string().optional(),
  }).refine(
    (v) => !v.budgetMin || !v.budgetMax || Number(v.budgetMax) >= Number(v.budgetMin),
    { message: t("requestForm.budgetRangeInvalid"), path: ["budgetMax"] },
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      intent: "",
      propertyType: "",
      location: "",
      budgetMin: "",
      budgetMax: "",
      bedrooms: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const minNum = values.budgetMin ? Number(values.budgetMin) : NaN;
    const maxNum = values.budgetMax ? Number(values.budgetMax) : NaN;
    const budgetMin = Number.isFinite(minNum) && minNum > 0 ? minNum : undefined;
    const budgetMax = Number.isFinite(maxNum) && maxNum > 0 ? maxNum : undefined;
    const budgetText =
      budgetMin != null && budgetMax != null
        ? `€${budgetMin.toLocaleString()} - €${budgetMax.toLocaleString()}`
        : budgetMax != null
          ? `up to €${budgetMax.toLocaleString()}`
          : budgetMin != null
            ? `from €${budgetMin.toLocaleString()}`
            : "";
    const parts = [
      `Looking to ${values.intent}.`,
      values.bedrooms && values.bedrooms !== "any" ? `Bedrooms: ${values.bedrooms}+.` : "",
      budgetText ? `Budget: ${budgetText}.` : "",
      values.notes,
    ].filter(Boolean);
    try {
      await submitLead({
        fullName: values.name,
        email: values.email,
        phone: values.phone,
        // Renters are TENANTs, buyers are BUYERs — keep the contact type aligned to intent.
        contactType: values.intent === "rent" ? "TENANT" : "BUYER",
        listingType: values.intent === "rent" ? "RENT" : "SALE",
        propertyType: REQUEST_TYPE_MAP[values.propertyType],
        city: values.location,
        budgetMin,
        budgetMax,
        message: parts.join(" "),
      });
      toast({
        title: t("requestForm.toastTitle"),
        description: t("requestForm.toastDesc"),
      });
      form.reset();
    } catch {
      toast({ title: t("requestForm.toastTitle"), description: "Could not send. Please try again.", variant: "destructive" });
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
                  <Input placeholder={t("contactForm.fullNamePlaceholder")} {...field} className="bg-white border-gray-200 h-12" />
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
                    className="bg-white border-gray-200 h-12"
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
                <Input placeholder="john@example.com" {...field} className="bg-white border-gray-200 h-12" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="intent"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("requestForm.lookingTo")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white border-gray-200 h-12">
                      <SelectValue placeholder={t("requestForm.select")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="buy">{t("searchFilters.buy")}</SelectItem>
                    <SelectItem value="rent">{t("searchFilters.rent")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("searchFilters.propertyType")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white border-gray-200 h-12">
                      <SelectValue placeholder={t("offerForm.selectType")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="apartment">{tEnum("propertyType", "Apartment")}</SelectItem>
                    <SelectItem value="house">{tEnum("propertyType", "House")}</SelectItem>
                    <SelectItem value="villa">{tEnum("propertyType", "Villa")}</SelectItem>
                    <SelectItem value="commercial">{t("offerForm.commercialSpace")}</SelectItem>
                    <SelectItem value="land">{tEnum("propertyType", "Land")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="md:col-span-1">
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("requestForm.preferredLocation")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("requestForm.locationPlaceholder")} {...field} className="bg-white border-gray-200 h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem className="md:col-span-1">
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("searchFilters.bedrooms")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white border-gray-200 h-12">
                      <SelectValue placeholder={t("searchFilters.any")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="any">{t("searchFilters.any")}</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="budgetMin"
            render={({ field }) => (
              <FormItem className="md:col-span-1">
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("requestForm.budgetMinLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("requestForm.budgetMinPlaceholder")}
                    inputMode="numeric"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
                    className="bg-white border-gray-200 h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budgetMax"
            render={({ field }) => (
              <FormItem className="md:col-span-1">
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("requestForm.budgetMaxLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("requestForm.budgetMaxPlaceholder")}
                    inputMode="numeric"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
                    className="bg-white border-gray-200 h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("requestForm.additionalReq")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("requestForm.notesPlaceholder")}
                  className="bg-white border-gray-200 min-h-[100px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-[#0B3A36] text-[#F3D8A5] hover:bg-[#072D2A] uppercase tracking-widest text-sm h-14 rounded-sm mt-4">
          {t("requestForm.submit")}
        </Button>
      </form>
    </Form>
  );
}
