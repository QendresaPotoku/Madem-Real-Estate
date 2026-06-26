import { useParams, Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useProperty, useAgents, useProperties } from "@/hooks/useApi";
import { PropertyGallery } from "@/components/PropertyGallery";
import { PropertyBadge } from "@/components/PropertyBadge";
import { ContactForm } from "@/components/ContactForm";
import { AgentCard } from "@/components/AgentCard";
import { PropertyGrid } from "@/components/PropertyGrid";
import { useFavorites } from "@/hooks/useFavorites";
import {
  Bed, Bath, Square, MapPin, Heart, Share2, Check, X, Building2,
  Hash, Tag, Ruler, LandPlot, Layers, Sparkles, Calendar, Flame, Compass, Clock,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NotFound from "./not-found";
import { useT } from "@/i18n/useT";

export default function PropertyDetail() {
  const { id } = useParams();
  const { t, tx, tEnum, tg, locale } = useT();
  const { data: property, isLoading } = useProperty(id);
  const { data: agents = [] } = useAgents();
  const { data: allProperties = [] } = useProperties();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 text-gray-400">
        {t("common.loading") || "Loading…"}
      </div>
    );
  }

  if (!property) {
    return <NotFound />;
  }

  const agent = agents.find(a => a.id === property.agentId) ?? null;
  const favorite = isFavorite(property.id);
  const similarProperties = allProperties.filter(p => p.type === property.type && p.id !== property.id).slice(0, 3);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Property Details — only rendered when a value is present.
  const detailRows: { label: string; value: string; icon: LucideIcon }[] = [
    { label: t("propertyDetail.referenceNumber"), value: property.referenceNumber, icon: Hash },
    { label: t("searchFilters.propertyType"), value: tEnum("propertyType", property.type), icon: Building2 },
    { label: t("propertyDetail.statusLabel"), value: tEnum("propertyStatus", property.status), icon: Tag },
    ...(property.type !== "Land" ? [{ label: t("propertyDetail.livingArea"), value: `${property.area} m²`, icon: Ruler }] : []),
    ...(property.plotArea ? [{ label: t("propertyDetail.plotArea"), value: `${property.plotArea} m²`, icon: LandPlot }] : []),
    ...(property.bedrooms !== undefined ? [{ label: t("propertyDetail.rooms"), value: String(property.bedrooms), icon: Bed }] : []),
    ...(property.bathrooms !== undefined ? [{ label: t("common.bathrooms"), value: String(property.bathrooms), icon: Bath }] : []),
    ...(property.floor !== undefined ? [{ label: t("common.floor"), value: String(property.floor), icon: Layers }] : []),
    ...(property.condition ? [{ label: t("propertyDetail.condition"), value: tEnum("propertyCondition", property.condition), icon: Sparkles }] : []),
    ...(property.yearBuilt ? [{ label: t("propertyDetail.yearBuilt"), value: String(property.yearBuilt), icon: Calendar }] : []),
    ...(property.heating ? [{ label: t("propertyDetail.heating"), value: tg(property.heating), icon: Flame }] : []),
    ...(property.orientation ? [{ label: t("propertyDetail.orientation"), value: tEnum("orientation", property.orientation), icon: Compass }] : []),
    { label: t("propertyDetail.locationLabel"), value: `${property.neighborhood}, ${property.city}`, icon: MapPin },
    { label: t("propertyDetail.listedOn"), value: new Date(property.createdAt).toLocaleDateString(locale), icon: Clock },
  ];

  // Structured amenities checklist.
  const amenityList: { key: string; on: boolean }[] = [
    { key: "Elevator", on: !!property.elevator },
    { key: "Parking", on: !!property.parking },
    { key: "Garage", on: !!property.garage },
    { key: "Terrace", on: !!property.terrace },
    { key: "Air Conditioning", on: !!property.airConditioning },
  ];

  const mapQuery = encodeURIComponent(`${property.neighborhood}, ${property.city}, Kosovo`);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Header />

      {/* Top Banner */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href="/properties" className="text-xs font-semibold tracking-widest uppercase text-gray-400 hover:text-[#0B3A36] transition-colors">
              ← {t("propertyDetail.backToProperties")}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className={`border-gray-200 ${favorite ? 'text-red-500 hover:text-red-600' : 'text-gray-600 hover:text-[#0B3A36]'}`}
              onClick={() => toggleFavorite(property.id)}
            >
              <Heart className={`w-4 h-4 mr-2 ${favorite ? 'fill-current' : ''}`} />
              {favorite ? t("propertyDetail.saved") : t("propertyDetail.save")}
            </Button>
            <Button variant="outline" className="border-gray-200 text-gray-600 hover:text-[#0B3A36]" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              {t("propertyDetail.share")}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header Info: Title · Price · Location */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <PropertyBadge status={property.status} />
              <span className="px-3 py-1 text-xs font-medium tracking-widest uppercase rounded-sm bg-gray-100 text-gray-600">
                {tEnum("propertyType", property.type)}
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#0B3A36] mb-3">{tx(property.title)}</h1>
            <div className="flex items-center text-gray-500 font-medium">
              <MapPin className="w-5 h-5 mr-1 text-[#F3D8A5]" />
              {property.neighborhood}, {property.city}
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">{t("propertyDetail.askingPrice")}</p>
            <p className="font-serif text-4xl text-[#0B3A36] font-bold">
              €{property.price.toLocaleString()}
              {property.status === "For Rent" && <span className="text-xl font-sans font-normal text-gray-500"> {t("common.perMonth")}</span>}
            </p>
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-12">
          <PropertyGallery images={property.images} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">

            {/* Quick Specs */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-wrap gap-8 justify-around items-center divide-x divide-gray-100">
              {property.bedrooms !== undefined && (
                <div className="flex flex-col items-center px-4">
                  <Bed className="w-6 h-6 text-[#F3D8A5] mb-2" />
                  <span className="text-2xl font-serif font-bold text-[#0B3A36]">{property.bedrooms}</span>
                  <span className="text-xs uppercase tracking-wider text-gray-500">{t("propertyDetail.rooms")}</span>
                </div>
              )}
              {property.bathrooms !== undefined && (
                <div className="flex flex-col items-center px-4">
                  <Bath className="w-6 h-6 text-[#F3D8A5] mb-2" />
                  <span className="text-2xl font-serif font-bold text-[#0B3A36]">{property.bathrooms}</span>
                  <span className="text-xs uppercase tracking-wider text-gray-500">{t("common.bathrooms")}</span>
                </div>
              )}
              <div className="flex flex-col items-center px-4">
                <Square className="w-6 h-6 text-[#F3D8A5] mb-2" />
                <span className="text-2xl font-serif font-bold text-[#0B3A36]">{property.area}</span>
                <span className="text-xs uppercase tracking-wider text-gray-500">{t("propertyDetail.squareMeters")}</span>
              </div>
              {property.floor !== undefined && (
                <div className="flex flex-col items-center px-4">
                  <Building2 className="w-6 h-6 text-[#F3D8A5] mb-2" />
                  <span className="text-2xl font-serif font-bold text-[#0B3A36]">{property.floor}</span>
                  <span className="text-xs uppercase tracking-wider text-gray-500">{t("common.floor")}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0B3A36] mb-6">{t("propertyDetail.aboutTitle")}</h3>
              <div className="prose max-w-none text-gray-600 leading-relaxed text-lg">
                <p>{tx(property.description)}</p>
              </div>
            </div>

            {/* Property Details */}
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0B3A36] mb-6">{t("propertyDetail.detailsTitle")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {detailRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className="flex items-start gap-3 bg-white border border-gray-100 rounded-lg p-4 hover:border-[#F3D8A5] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#0B3A36]/5 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#0B3A36]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">{row.label}</p>
                        <p className="text-sm font-semibold text-[#0B3A36] break-words">{row.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0B3A36] mb-6">{t("propertyDetail.amenities")}</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {amenityList.map(({ key, on }) => (
                  <li
                    key={key}
                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3"
                  >
                    {on ? (
                      <Check className="w-5 h-5 text-[#0B3A36] shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 shrink-0" />
                    )}
                    <span className={`text-sm ${on ? "text-gray-800" : "text-gray-400 line-through"}`}>{tg(key)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Map */}
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0B3A36] mb-6">{t("propertyDetail.mapTitle")}</h3>
              <div className="rounded-lg overflow-hidden border border-gray-100">
                <iframe
                  title={t("propertyDetail.mapTitle")}
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  className="w-full h-[360px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{property.neighborhood}, {property.city}</p>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Agent Card */}
            {agent && (
              <div>
                <h3 className="font-serif text-xl font-bold text-[#0B3A36] mb-4">{t("propertyDetail.listedBy")}</h3>
                <AgentCard agent={agent} />
              </div>
            )}

            {/* Contact Form */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-serif text-xl font-bold text-[#0B3A36] mb-2">{t("propertyDetail.inquireTitle")}</h3>
              <p className="text-sm text-gray-500 mb-6">{t("propertyDetail.refLabel", { ref: property.referenceNumber })}</p>
              <ContactForm propertyRef={property.referenceNumber} />
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <div className="mt-24 pt-16 border-t border-gray-200">
            <h2 className="font-serif text-3xl font-bold text-[#0B3A36] mb-8">{t("propertyDetail.similarProperties")}</h2>
            <PropertyGrid properties={similarProperties} columns={3} />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
