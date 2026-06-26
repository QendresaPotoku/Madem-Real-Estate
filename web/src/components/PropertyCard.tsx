import { useState } from "react";
import { Property } from "@/data/properties";
import { useFavorites } from "@/hooks/useFavorites";
import { Link } from "wouter";
import { PropertyBadge } from "./PropertyBadge";
import { PropertyQuickView } from "./PropertyQuickView";
import { Bed, Bath, Square, MapPin, Heart, Eye } from "lucide-react";
import { useT } from "@/i18n/useT";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t, tx, tEnum } = useT();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const favorite = isFavorite(property.id);

  return (
    <div className="group flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={`/properties/${property.id}`} className="block w-full h-full">
          <img
            src={property.images[0]}
            alt={tx(property.title)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <PropertyBadge status={property.status} />
            {property.isFeatured && (
              <span className="px-3 py-1 text-xs font-medium tracking-widest uppercase rounded-sm bg-[#0B3A36] text-[#F3D8A5]">
                {t("common.featured")}
              </span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                setQuickViewOpen(true);
              }}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
              aria-label={t("quickView.quickView")}
              title={t("quickView.quickView")}
              data-testid={`btn-quickview-${property.id}`}
            >
              <Eye className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(property.id);
              }}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
              data-testid={`btn-favorite-${property.id}`}
            >
              <Heart className={`w-5 h-5 ${favorite ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
            </button>
          </div>
        </div>
      </div>

      <PropertyQuickView property={property} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium text-gray-500">{tEnum("propertyType", property.type)}</p>
          <p className="text-lg font-serif font-bold text-[#0B3A36]">
            €{property.price.toLocaleString()}
            {property.status === "For Rent" && <span className="text-sm font-sans font-normal text-gray-500"> {t("common.perMonth")}</span>}
          </p>
        </div>

        <Link href={`/properties/${property.id}`} className="inline-block mb-2">
          <h3 className="font-serif text-xl text-gray-900 font-semibold line-clamp-1 group-hover:text-[#0B3A36] transition-colors">
            {tx(property.title)}
          </h3>
        </Link>
        
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-1 opacity-70" />
          <span className="line-clamp-1">{property.neighborhood}, {property.city}</span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
          {property.bedrooms !== undefined && (
            <div className="flex items-center" title={t("propertyCard.bedroomsTitle")}>
              <Bed className="w-4 h-4 mr-1.5 opacity-60" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center" title={t("propertyCard.bathroomsTitle")}>
              <Bath className="w-4 h-4 mr-1.5 opacity-60" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          <div className="flex items-center" title={t("propertyCard.areaTitle")}>
            <Square className="w-4 h-4 mr-1.5 opacity-60" />
            <span>{property.area} m²</span>
          </div>
        </div>
      </div>
    </div>
  );
}
