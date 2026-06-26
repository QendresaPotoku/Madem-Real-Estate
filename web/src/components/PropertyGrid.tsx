import { Property } from "@/data/properties";
import { PropertyCard } from "./PropertyCard";
import { useT } from "@/i18n/useT";

interface PropertyGridProps {
  properties: Property[];
  columns?: 2 | 3 | 4;
}

export function PropertyGrid({ properties, columns = 3 }: PropertyGridProps) {
  const { t } = useT();
  const colsClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  if (!properties?.length) {
    return (
      <div className="py-20 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
        <p className="font-serif text-2xl text-[#0B3A36] mb-2">{t("propertyGrid.noResults")}</p>
        <p>{t("propertyGrid.adjustSearch")}</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 md:gap-8 ${colsClass}`}>
      {properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
