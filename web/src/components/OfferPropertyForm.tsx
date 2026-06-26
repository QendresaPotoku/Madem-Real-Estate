import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";
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
import { submitPropertyOffer, uploadOfferImage, type UploadedImage } from "@/lib/api";

export function OfferPropertyForm() {
  const { toast } = useToast();
  const { t, tEnum } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const formSchema = z.object({
    name: z.string().min(2, t("contactForm.nameRequired")),
    email: z.string().email(t("contactForm.invalidEmail")),
    phone: z.string().min(6, t("contactForm.phoneRequired")),
    listingType: z.enum(["SALE", "RENT"]),
    propertyType: z.string().min(1, t("offerForm.typeRequired")),
    city: z.string().min(2, t("offerForm.cityRequired")),
    neighborhood: z.string().min(2, t("offerForm.neighborhoodRequired")),
    price: z.string().min(1, t("offerForm.priceRequired")),
    description: z.string().min(10, t("offerForm.descRequired")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      listingType: "SALE",
      propertyType: "",
      city: "",
      neighborhood: "",
      price: "",
      description: "",
    },
  });

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(uploadOfferImage));
      setImages((prev) => [...prev, ...uploaded].slice(0, 20));
    } catch {
      toast({ title: t("offerForm.toastTitle"), description: "Image upload failed. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const parsedPrice = Number(values.price.replace(/[^\d.]/g, ""));
    try {
      await submitPropertyOffer({
        fullName: values.name,
        email: values.email,
        phone: values.phone,
        listingType: values.listingType,
        propertyType: values.propertyType,
        city: values.city,
        area: values.neighborhood,
        price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : undefined,
        description: values.description,
        images,
      });
      toast({
        title: t("offerForm.toastTitle"),
        description: t("offerForm.toastDesc"),
      });
      form.reset();
      setImages([]);
    } catch {
      toast({ title: t("offerForm.toastTitle"), description: "Could not send. Please try again.", variant: "destructive" });
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
            name="listingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("offerForm.listingIntent")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white border-gray-200 h-12">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SALE">{t("offerForm.forSale")}</SelectItem>
                    <SelectItem value="RENT">{t("offerForm.forRent")}</SelectItem>
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
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("searchFilters.city")}</FormLabel>
                <FormControl>
                  <Input placeholder="Prishtine" {...field} className="bg-white border-gray-200 h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("offerForm.neighborhood")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("offerForm.neighborhoodPlaceholder")} {...field} className="bg-white border-gray-200 h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("offerForm.expectedPrice")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("offerForm.pricePlaceholder")}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase tracking-wider text-gray-500">{t("offerForm.propertyDescription")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("offerForm.descPlaceholder")}
                  className="bg-white border-gray-200 min-h-[120px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">{t("offerForm.uploadImages")}</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-md p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <p className="text-sm text-gray-500">{uploading ? `${t("offerForm.uploadImages")}…` : t("offerForm.uploadHint")}</p>
            <p className="text-xs text-gray-400 mt-1">{t("offerForm.uploadLimit")}</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />

          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
              {images.map((img, i) => (
                <div key={img.key} className="relative group">
                  <img src={img.url} alt="" className="h-24 w-full object-cover rounded-md border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={uploading || form.formState.isSubmitting}
          className="w-full bg-[#0B3A36] text-[#F3D8A5] hover:bg-[#072D2A] uppercase tracking-widest text-sm h-14 rounded-sm mt-8 disabled:opacity-60"
        >
          {t("offerForm.submit")}
        </Button>
      </form>
    </Form>
  );
}
