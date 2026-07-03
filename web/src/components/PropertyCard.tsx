import { useEffect, useRef, useState } from "react";
import { Property } from "@/data/properties";
import { useFavorites } from "@/hooks/useFavorites";
import { Link } from "wouter";
import { PropertyBadge } from "./PropertyBadge";
import { PropertyQuickView } from "./PropertyQuickView";
import { Bed, Bath, Square, MapPin, Heart, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/useT";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t, tx, tEnum } = useT();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [inViewPlaying, setInViewPlaying] = useState(false);
  const favorite = isFavorite(property.id);
  // Inline image browsing: flip through photos on the card before opening it.
  const images = property.images ?? [];
  const [current, setCurrent] = useState(0);
  const hasMultiple = images.length > 1;
  const index = Math.min(current, Math.max(0, images.length - 1));
  const goImage = (e: React.MouseEvent, dir: -1 | 1) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((prev) => (prev + dir + images.length) % images.length);
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const playVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => {});
  };
  const stopVideo = () => {
    videoRef.current?.pause();
  };

  // On touch devices there is no hover, so autoplay the preview (muted) while the
  // card is on screen, like a social feed, and pause it once it scrolls away.
  useEffect(() => {
    if (!property.videoUrl) return;
    if (typeof window === "undefined" || !window.matchMedia("(hover: none)").matches) return;
    const el = cardRef.current;
    const v = videoRef.current;
    if (!el || !v) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.6;
        setInViewPlaying(visible);
        if (visible) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: [0, 0.6, 1] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [property.videoUrl]);

  return (
    <div
      ref={cardRef}
      className="group flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      onMouseEnter={property.videoUrl ? playVideo : undefined}
      onMouseLeave={property.videoUrl ? stopVideo : undefined}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={`/properties/${property.id}`} className="block w-full h-full">
          {/* Sliding track — all images in a row, translated so the active one is
              in view; changing index animates the slide smoothly. */}
          <div
            className="flex h-full w-full transition-transform duration-[900ms] ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {(images.length ? images : [property.images[0]]).map((src, i) => (
              <div key={i} className="h-full w-full shrink-0 overflow-hidden">
                <img
                  src={src}
                  alt={tx(property.title)}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
          {property.videoUrl && (
            <video
              ref={videoRef}
              src={property.videoUrl}
              poster={property.images[0]}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 pointer-events-none ${
                index === 0 ? "group-hover:opacity-100" : ""
              } ${inViewPlaying && index === 0 ? "opacity-100" : "opacity-0"}`}
              muted
              loop
              playsInline
              // Warm the connection + fetch the (faststart) metadata header up front
              // so hover playback starts quickly instead of cold-loading on hover.
              preload="metadata"
            />
          )}
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

        {/* Inline image navigation — arrows (hover on desktop, always on touch)
            and a photo counter. Siblings of the Link so they don't navigate. */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(e) => goImage(e, -1)}
              aria-label={t("common.previous")}
              className="absolute left-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[#0B3A36] opacity-0 backdrop-blur-sm transition-opacity hover:bg-white group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => goImage(e, 1)}
              aria-label={t("common.next")}
              className="absolute right-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[#0B3A36] opacity-0 backdrop-blur-sm transition-opacity hover:bg-white group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              {index + 1}/{images.length}
            </div>
          </>
        )}
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
