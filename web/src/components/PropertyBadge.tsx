import { PropertyStatus } from "@/data/properties";
import { useT } from "@/i18n/useT";

interface PropertyBadgeProps {
  status: PropertyStatus;
  className?: string;
}

export function PropertyBadge({ status, className = "" }: PropertyBadgeProps) {
  const { tEnum } = useT();
  let bgColor = "bg-gray-200 text-gray-800";
  
  switch (status) {
    case "For Sale":
      bgColor = "bg-[#072D2A] text-white"; // dark green
      break;
    case "For Rent":
      bgColor = "bg-[#F3D8A5] text-[#0B3A36]"; // gold
      break;
    case "Reserved":
      bgColor = "bg-gray-400 text-white";
      break;
    case "Sold":
      bgColor = "bg-red-800 text-white";
      break;
  }

  return (
    <span className={`px-3 py-1 text-xs font-medium tracking-widest uppercase rounded-sm ${bgColor} ${className}`} data-testid={`badge-status-${status.replace(/\s+/g, '-').toLowerCase()}`}>
      {tEnum("propertyStatus", status)}
    </span>
  );
}
