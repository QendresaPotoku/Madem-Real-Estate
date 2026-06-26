import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PropertyGrid } from "@/components/PropertyGrid";
import { useFavorites } from "@/hooks/useFavorites";
import { useProperties } from "@/hooks/useApi";
import { HeartCrack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useT } from "@/i18n/useT";

export default function FavoritesPage() {
  const { t } = useT();
  const { favorites } = useFavorites();
  const { data: properties = [] } = useProperties();
  const favoriteProperties = properties.filter(p => favorites.includes(p.id));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Header />
      
      <div className="bg-[#0B3A36] py-12 text-white border-t border-[#F3D8A5]/10">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t("favorites.title")}</h1>
          <p className="text-gray-300 max-w-2xl">{t("favorites.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 flex-grow">
        {favoriteProperties.length > 0 ? (
          <div>
            <div className="mb-8">
              <p className="text-sm font-medium text-gray-600">
                {t("favorites.countText", { count: favoriteProperties.length })}
              </p>
            </div>
            <PropertyGrid properties={favoriteProperties} columns={3} />
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-20 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <HeartCrack className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0B3A36] mb-3">{t("favorites.emptyTitle")}</h2>
            <p className="text-gray-600 mb-8 px-6">
              {t("favorites.emptyText")}
            </p>
            <Button asChild className="bg-[#0B3A36] text-[#F3D8A5] hover:bg-[#072D2A] uppercase tracking-widest text-xs h-12 px-8 rounded-sm">
              <Link href="/properties">{t("favorites.browse")}</Link>
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
