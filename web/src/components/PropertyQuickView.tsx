import { Link } from "wouter";
import { Bed, Bath, Square, MapPin, Heart } from "lucide-react";
import { Property } from "@/data/properties";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PropertyBadge } from "./PropertyBadge";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useT } from "@/i18n/useT";

interface PropertyQuickViewProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyQuickView({ property, open, onOpenChange }: PropertyQuickViewProps) {
  const { t, tx, tEnum, tg } = useT();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(property.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[4/3] md:aspect-auto md:h-full bg-gray-100">
            <img
              src={property.images[0]}
              alt={tx(property.title)}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <PropertyBadge status={property.status} />
              {property.isFeatured && (
                <span className="px-3 py-1 text-xs font-medium tracking-widest uppercase rounded-sm bg-[#0B3A36] text-[#F3D8A5]">
                  {t("common.featured")}
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-sm font-medium text-gray-500">{tEnum("propertyType", property.type)}</p>
              <p className="text-xl font-serif font-bold text-[#0B3A36]">
                €{property.price.toLocaleString()}
                {property.status === "For Rent" && (
                  <span className="text-sm font-sans font-normal text-gray-500"> {t("common.perMonth")}</span>
                )}
              </p>
            </div>

            <DialogTitle className="font-serif text-2xl text-gray-900 font-semibold mb-2 pr-6">
              {tx(property.title)}
            </DialogTitle>

            <div className="flex items-center text-sm text-gray-600 mb-4">
              <MapPin className="w-4 h-4 mr-1 opacity-70" />
              <span>{property.neighborhood}, {property.city}</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600 border-y border-gray-100 py-3 mb-4">
              {property.bedrooms !== undefined && (
                <div className="flex items-center gap-1.5" title={t("common.bedrooms")}>
                  <Bed className="w-4 h-4 opacity-60" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms !== undefined && (
                <div className="flex items-center gap-1.5" title={t("common.bathrooms")}>
                  <Bath className="w-4 h-4 opacity-60" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5" title={t("common.area")}>
                <Square className="w-4 h-4 opacity-60" />
                <span>{property.area} m²</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
              {tx(property.description)}
            </p>

            {property.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {property.amenities.slice(0, 4).map((item) => (
                  <span key={item} className="bg-gray-50 text-gray-700 px-2 py-1 text-xs rounded-sm">
                    {tg(item)}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center gap-3">
              <Button
                asChild
                className="flex-1 bg-[#0B3A36] text-[#F3D8A5] hover:bg-[#072D2A] uppercase tracking-widest text-xs h-12 rounded-sm"
              >
                <Link href={`/properties/${property.id}`}>{t("quickView.viewFullDetails")}</Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleFavorite(property.id)}
                aria-pressed={favorite}
                className="h-12 w-12 border-gray-200 rounded-sm shrink-0"
              >
                <Heart className={`w-5 h-5 ${favorite ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
