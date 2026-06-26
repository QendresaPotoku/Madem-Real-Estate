import { useState, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchFilters, type PropertyFilters } from "@/components/SearchFilters";
import { PropertyGrid } from "@/components/PropertyGrid";
import { Pagination } from "@/components/Pagination";
import { useProperties } from "@/hooks/useApi";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useT } from "@/i18n/useT";

const CANONICAL_TYPES = ["Apartment", "House", "Villa", "Office", "Commercial", "Land", "Warehouse"];

/** Build filters from URL query params (e.g. set by the home hero search). Returns null when there are none. */
function parseFiltersFromSearch(search: string): PropertyFilters | null {
  const params = new URLSearchParams(search);
  if ([...params.keys()].length === 0) return null;
  const rawType = params.get("type");
  const type = rawType ? CANONICAL_TYPES.find((t) => t.toLowerCase() === rawType.toLowerCase()) ?? "all" : "all";
  return {
    status: params.get("status") === "Rent" ? "Rent" : "Sale",
    country: params.get("country") ?? "all",
    city: params.get("city") ?? "all",
    area: params.get("area") ?? "all",
    cadastralZone: params.get("cadastralZone") ?? "all",
    type,
    bedrooms: params.get("bedrooms") ?? "any",
  };
}

export default function PropertiesPage() {
  const { t } = useT();
  const { data: properties = [] } = useProperties();
  const search = useSearch();
  const urlFilters = useMemo(() => parseFiltersFromSearch(search), [search]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState<PropertyFilters | null>(urlFilters);
  const itemsPerPage = 9;

  // Re-seed filters when the URL query changes (e.g. navigating in via a hero/category search).
  useEffect(() => {
    setFilters(urlFilters);
    setCurrentPage(1);
  }, [urlFilters]);

  const handleSearch = (next: PropertyFilters) => {
    setFilters(next);
    setCurrentPage(1);
    setIsMobileFiltersOpen(false);
  };

  // Filter then sort
  const sortedProperties = useMemo(() => {
    const filtered = !filters
      ? properties
      : properties.filter((p) => {
          if (filters.status === "Sale" && p.status === "For Rent") return false;
          if (filters.status === "Rent" && p.status !== "For Rent") return false;
          if (filters.country !== "all" && p.country !== filters.country) return false;
          if (filters.city !== "all" && p.city !== filters.city) return false;
          if (filters.area !== "all" && p.neighborhood !== filters.area) return false;
          if (filters.cadastralZone !== "all" && p.cadastralZone !== filters.cadastralZone) return false;
          if (filters.type !== "all" && p.type !== filters.type) return false;
          if (filters.bedrooms !== "any" && (p.bedrooms ?? 0) < Number(filters.bedrooms)) return false;
          return true;
        });

    let sorted = [...filtered];
    switch(sortBy) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "area-desc":
        sorted.sort((a, b) => b.area - a.area);
        break;
      case "area-asc":
        sorted.sort((a, b) => a.area - b.area);
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "newest":
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    return sorted;
  }, [sortBy, filters, properties]);

  const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
  const paginatedProperties = sortedProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Header />
      
      <div className="bg-[#0B3A36] py-12 text-white border-t border-[#F3D8A5]/10">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t("propertiesPage.title")}</h1>
          <p className="text-gray-300 max-w-2xl">{t("propertiesPage.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-28">
              <SearchFilters key={search} variant="sidebar" onSearch={handleSearch} initial={urlFilters} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <p className="text-sm font-medium text-gray-600">
                {t("propertiesPage.showing", { count: sortedProperties.length })}
              </p>
              
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Drawer open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="lg:hidden flex-1 border-gray-200 text-gray-700">
                      <Filter className="w-4 h-4 mr-2" />
                      {t("propertiesPage.filters")}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="p-4 bg-gray-50 h-[85vh]">
                    <div className="overflow-y-auto pb-8">
                      <SearchFilters key={search} variant="sidebar" onSearch={handleSearch} initial={urlFilters} />
                    </div>
                  </DrawerContent>
                </Drawer>
                
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <SlidersHorizontal className="w-4 h-4 text-gray-400 hidden sm:block" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-200">
                      <SelectValue placeholder={t("propertiesPage.sortBy")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{t("propertiesPage.newest")}</SelectItem>
                      <SelectItem value="oldest">{t("propertiesPage.oldest")}</SelectItem>
                      <SelectItem value="price-asc">{t("propertiesPage.priceAsc")}</SelectItem>
                      <SelectItem value="price-desc">{t("propertiesPage.priceDesc")}</SelectItem>
                      <SelectItem value="area-desc">{t("propertiesPage.areaDesc")}</SelectItem>
                      <SelectItem value="area-asc">{t("propertiesPage.areaAsc")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Grid */}
            <PropertyGrid properties={paginatedProperties} columns={3} />
            
            {/* Pagination */}
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
            
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
