import { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useLocation } from "wouter";
import { useT } from "@/i18n/useT";
import { useLocationLookups } from "@/hooks/useApi";

export interface PropertyFilters {
  /** "Sale" excludes rentals (For Sale / Reserved / Sold); "Rent" keeps only For Rent. */
  status: "Sale" | "Rent";
  country: string; // "all" or canonical country name
  city: string; // "all" or canonical city name
  area: string; // "all" or canonical area/neighborhood name
  cadastralZone: string; // "all" or canonical cadastral zone name
  type: string; // "all" or canonical PropertyType
  bedrooms: string; // "any" or minimum bedroom count as a string
}

interface SearchFiltersProps {
  variant?: "hero" | "sidebar";
  onSearch?: (filters: PropertyFilters) => void;
  /** Initial filter values, e.g. seeded from URL query params. */
  initial?: PropertyFilters | null;
}

export function SearchFilters({ variant = "sidebar", onSearch, initial }: SearchFiltersProps) {
  const [, setLocation] = useLocation();
  const { t, tEnum } = useT();
  const { data: locations } = useLocationLookups();
  const [activeTab, setActiveTab] = useState<"Sale" | "Rent">(initial?.status ?? "Sale");
  const [country, setCountry] = useState(initial?.country ?? "all");
  const [city, setCity] = useState(initial?.city ?? "all");
  const [area, setArea] = useState(initial?.area ?? "all");
  const [cadastralZone, setCadastralZone] = useState(initial?.cadastralZone ?? "all");
  const [type, setType] = useState(initial?.type ?? "all");
  const [bedrooms, setBedrooms] = useState(initial?.bedrooms ?? "any");
  const selectedCountry = locations?.countries.find((c) => c.name === country);
  const cities = useMemo(
    () => locations?.cities.filter((c) => country === "all" || c.countryId === selectedCountry?.id) ?? [],
    [country, locations?.cities, selectedCountry?.id],
  );
  const selectedCity = cities.find((c) => c.name === city);
  const areas = useMemo(
    () => locations?.areas.filter((a) => city === "all" || a.cityId === selectedCity?.id) ?? [],
    [city, locations?.areas, selectedCity?.id],
  );
  const cadastralZones = useMemo(
    () => locations?.cadastralZones.filter((z) => city === "all" || z.cityId === selectedCity?.id) ?? [],
    [city, locations?.cadastralZones, selectedCity?.id],
  );
  const cityOptions = city !== "all" && !cities.some((c) => c.name === city) ? [...cities, { id: city, countryId: "", name: city }] : cities;
  const areaOptions = area !== "all" && !areas.some((a) => a.name === area) ? [...areas, { id: area, cityId: "", name: area }] : areas;
  const cadastralOptions = cadastralZone !== "all" && !cadastralZones.some((z) => z.name === cadastralZone)
    ? [...cadastralZones, { id: cadastralZone, cityId: "", name: cadastralZone }]
    : cadastralZones;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (variant === "hero") {
      setLocation("/properties");
    } else if (onSearch) {
      onSearch({ status: activeTab, country, city, area, cadastralZone, type, bedrooms });
    }
  };

  if (variant === "hero") {
    return (
      <div className="bg-white p-2 md:p-4 rounded-lg shadow-2xl w-full max-w-5xl mx-auto border border-[#EBCB8F]/30">
        <div className="flex mb-4 gap-2 border-b border-gray-100 pb-4 px-2">
          <button 
            type="button"
            onClick={() => setActiveTab("Sale")}
            className={`px-6 py-2 rounded-sm text-sm font-medium transition-colors ${
              activeTab === "Sale" 
                ? "bg-[#0B3A36] text-[#F3D8A5]" 
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tEnum("propertyStatus", "For Sale")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("Rent")}
            className={`px-6 py-2 rounded-sm text-sm font-medium transition-colors ${
              activeTab === "Rent"
                ? "bg-[#0B3A36] text-[#F3D8A5]"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tEnum("propertyStatus", "For Rent")}
          </button>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 px-2">
          <div className="relative">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">{t("searchFilters.propertyType")}</label>
            <select className="w-full bg-transparent border-none text-gray-900 font-medium focus:ring-0 cursor-pointer appearance-none">
              <option>{t("searchFilters.allTypes")}</option>
              <option>{tEnum("propertyType", "Apartment")}</option>
              <option>{tEnum("propertyType", "House")}</option>
              <option>{tEnum("propertyType", "Villa")}</option>
              <option>{tEnum("propertyType", "Commercial")}</option>
              <option>{tEnum("propertyType", "Land")}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 bottom-1 pointer-events-none" />
          </div>

          <div className="relative md:border-l border-gray-100 md:pl-4">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Country</label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setCity("all");
                setArea("all");
                setCadastralZone("all");
              }}
              className="w-full bg-transparent border-none text-gray-900 font-medium focus:ring-0 cursor-pointer appearance-none"
            >
              <option value="all">All countries</option>
              {locations?.countries.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 bottom-1 pointer-events-none" />
          </div>

          <div className="relative md:border-l border-gray-100 md:pl-4">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">{t("searchFilters.city")}</label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setArea("all");
                setCadastralZone("all");
              }}
              className="w-full bg-transparent border-none text-gray-900 font-medium focus:ring-0 cursor-pointer appearance-none"
            >
              <option value="all">{t("searchFilters.allCities")}</option>
              {cityOptions.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 bottom-1 pointer-events-none" />
          </div>

          <div className="relative md:border-l border-gray-100 md:pl-4">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">{t("searchFilters.priceRange")}</label>
            <select className="w-full bg-transparent border-none text-gray-900 font-medium focus:ring-0 cursor-pointer appearance-none">
              <option>{t("searchFilters.anyPrice")}</option>
              <option>{t("searchFilters.priceUpTo")}</option>
              <option>{t("searchFilters.price100250")}</option>
              <option>{t("searchFilters.price250500")}</option>
              <option>{t("searchFilters.price500plus")}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 bottom-1 pointer-events-none" />
          </div>

          <Button type="submit" className="w-full bg-[#F3D8A5] text-[#0B3A36] hover:bg-[#EBCB8F] h-12 uppercase tracking-widest text-xs mt-auto rounded-sm">
            <Search className="w-4 h-4 mr-2" />
            {t("common.search")}
          </Button>
        </form>
      </div>
    );
  }

  // Sidebar variant
  return (
    <form onSubmit={handleSearch} className="bg-white p-6 border border-gray-100 rounded-lg">
      <h3 className="font-serif text-xl text-[#0B3A36] mb-6 border-b border-gray-100 pb-4">{t("searchFilters.filterProperties")}</h3>

      <div className="space-y-6">
        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 mb-3 block">{t("searchFilters.status")}</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => setActiveTab("Sale")}
              className={`py-2 rounded-sm text-sm border transition-colors ${
                activeTab === "Sale" 
                  ? "bg-[#0B3A36] text-[#F3D8A5] border-[#0B3A36]" 
                  : "bg-transparent text-gray-600 border-gray-200 hover:border-[#0B3A36]"
              }`}
            >
              {t("searchFilters.buy")}
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab("Rent")}
              className={`py-2 rounded-sm text-sm border transition-colors ${
                activeTab === "Rent" 
                  ? "bg-[#0B3A36] text-[#F3D8A5] border-[#0B3A36]" 
                  : "bg-transparent text-gray-600 border-gray-200 hover:border-[#0B3A36]"
              }`}
            >
              {t("searchFilters.rent")}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">Country</label>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setCity("all");
              setArea("all");
              setCadastralZone("all");
            }}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:border-[#0B3A36] focus:ring-0 transition-colors"
          >
            <option value="all">All countries</option>
            {locations?.countries.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">{t("searchFilters.city")}</label>
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setArea("all");
              setCadastralZone("all");
            }}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:border-[#0B3A36] focus:ring-0 transition-colors"
          >
            <option value="all">{t("searchFilters.allCities")}</option>
            {cityOptions.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">Area / neighborhood</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:border-[#0B3A36] focus:ring-0 transition-colors"
          >
            <option value="all">All areas</option>
            {areaOptions.map((a) => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">Cadastral zone</label>
          <select
            value={cadastralZone}
            onChange={(e) => setCadastralZone(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:border-[#0B3A36] focus:ring-0 transition-colors"
          >
            <option value="all">All cadastral zones</option>
            {cadastralOptions.map((z) => (
              <option key={z.id} value={z.name}>{z.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">{t("searchFilters.propertyType")}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:border-[#0B3A36] focus:ring-0 transition-colors"
          >
            <option value="all">{t("searchFilters.allTypes")}</option>
            <option value="Apartment">{tEnum("propertyType", "Apartment")}</option>
            <option value="House">{tEnum("propertyType", "House")}</option>
            <option value="Villa">{tEnum("propertyType", "Villa")}</option>
            <option value="Commercial">{tEnum("propertyType", "Commercial")}</option>
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">{t("searchFilters.bedrooms")}</label>
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:border-[#0B3A36] focus:ring-0 transition-colors"
          >
            <option value="any">{t("searchFilters.any")}</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>

        <Button type="submit" className="w-full bg-[#0B3A36] text-[#F3D8A5] hover:bg-[#072D2A] uppercase tracking-widest text-xs h-12 rounded-sm mt-4">
          {t("searchFilters.applyFilters")}
        </Button>
      </div>
    </form>
  );
}
