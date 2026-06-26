import type { Localized } from "@/i18n/types";
import type { Property, PropertyType, PropertyStatus, PropertyCondition, Orientation } from "@/data/properties";
import type { Agent } from "@/data/agents";

const EMPTY_LOCALIZED: Localized = { en: "", sq: "", de: "" };

/* ── API response shapes (subset we consume) ─────────────────────────────── */
interface ApiProperty {
  id: string;
  propertyCode: string;
  listingType: "SALE" | "RENT";
  propertyType: "APARTMENT" | "HOUSE" | "VILLA" | "LAND" | "OFFICE" | "SHOP" | "WAREHOUSE" | "BUILDING";
  titleJson: Localized;
  descriptionJson: Localized | null;
  price: number;
  country: string;
  city: string;
  area: string | null;
  cadastralZone: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  sizeM2: number | null;
  lotSizeM2: number | null;
  floor: number | null;
  garage: number | null;
  storage: boolean;
  parking: boolean;
  elevator: boolean;
  furnished: boolean;
  buildingCondition: "NEW_CONSTRUCTION" | "OLD_CONSTRUCTION" | null;
  orientation: "NORTH" | "SOUTH" | "EAST" | "WEST" | null;
  yearBuilt: number | null;
  isFeatured: boolean;
  agentUserId: string;
  attributesJson: Record<string, unknown>;
  coverImageUrl: string | null;
  createdAt: string;
}
interface ApiPropertyDetail extends ApiProperty {
  images: { id: string; imageUrl: string; isCover: boolean; sortOrder: number }[];
}
interface ApiAgent {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  titleJson: Localized | null;
  bioJson: Localized | null;
}
interface Paged<T> {
  data: T[];
  meta: { total: number };
}
export interface LocationLookups {
  countries: Array<{ id: string; name: string }>;
  cities: Array<{ id: string; countryId: string; name: string }>;
  areas: Array<{ id: string; cityId: string; name: string }>;
  cadastralZones: Array<{ id: string; cityId: string; name: string }>;
}

/* ── Mappers: API → existing web interfaces ──────────────────────────────── */
const TYPE_MAP: Record<ApiProperty["propertyType"], PropertyType> = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  VILLA: "Villa",
  OFFICE: "Office",
  SHOP: "Commercial",
  BUILDING: "Commercial",
  LAND: "Land",
  WAREHOUSE: "Warehouse",
};
const CONDITION_MAP: Record<string, PropertyCondition> = {
  NEW_CONSTRUCTION: "New",
  OLD_CONSTRUCTION: "Good",
};
const ORIENTATION_MAP: Record<string, Orientation> = {
  NORTH: "North",
  SOUTH: "South",
  EAST: "East",
  WEST: "West",
};

function mapProperty(p: ApiProperty, images?: string[]): Property {
  const attrs = p.attributesJson ?? {};
  const status: PropertyStatus = p.listingType === "RENT" ? "For Rent" : "For Sale";
  return {
    id: p.propertyCode,
    title: p.titleJson ?? EMPTY_LOCALIZED,
    type: TYPE_MAP[p.propertyType] ?? "Apartment",
    status,
    price: p.price,
    country: p.country,
    city: p.city,
    neighborhood: p.area ?? "",
    cadastralZone: p.cadastralZone ?? "",
    area: p.sizeM2 ?? 0,
    plotArea: p.lotSizeM2 ?? undefined,
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    floor: p.floor ?? undefined,
    condition: p.buildingCondition ? CONDITION_MAP[p.buildingCondition] : undefined,
    yearBuilt: p.yearBuilt ?? undefined,
    heating: typeof attrs.heating === "string" ? attrs.heating : undefined,
    orientation: p.orientation ? ORIENTATION_MAP[p.orientation] : undefined,
    referenceNumber: p.propertyCode,
    description: p.descriptionJson ?? EMPTY_LOCALIZED,
    amenities: Array.isArray(attrs.amenities) ? (attrs.amenities as string[]) : [],
    elevator: p.elevator,
    parking: p.parking,
    garage: (p.garage ?? 0) > 0,
    terrace: !!attrs.terrace,
    airConditioning: !!attrs.airConditioning,
    images: images ?? (p.coverImageUrl ? [p.coverImageUrl] : []),
    agentId: p.agentUserId,
    isFeatured: p.isFeatured,
    createdAt: p.createdAt,
  };
}

function mapAgent(a: ApiAgent): Agent {
  return {
    id: a.id,
    name: a.fullName,
    title: a.titleJson ?? EMPTY_LOCALIZED,
    phone: a.phone ?? "",
    email: a.email ?? "",
    image: a.photoUrl ?? "",
    specialties: a.bioJson?.en ? a.bioJson.en.split(",").map((s) => s.trim()).filter(Boolean) : [],
    propertiesCount: 0,
    yearsExperience: 0,
  };
}

/* ── Fetchers ────────────────────────────────────────────────────────────── */
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchProperties(): Promise<Property[]> {
  const json = await getJson<Paged<ApiProperty>>("/api/public/properties?limit=100&sort=createdAt&order=DESC");
  return json.data.map((p) => mapProperty(p));
}

export async function fetchProperty(code: string): Promise<Property> {
  const p = await getJson<ApiPropertyDetail>(`/api/public/properties/${encodeURIComponent(code)}`);
  return mapProperty(p, p.images.map((i) => i.imageUrl));
}

export async function fetchAgents(): Promise<Agent[]> {
  const json = await getJson<ApiAgent[]>("/api/public/agents");
  return json.map(mapAgent);
}

export async function fetchLocationLookups(): Promise<LocationLookups> {
  return getJson<LocationLookups>("/api/public/location-lookups");
}

/* ── Lead submission (website forms) ─────────────────────────────────────── */
export interface LeadPayload {
  fullName: string;
  phone?: string;
  email?: string;
  message?: string;
  contactType?: "BUYER" | "TENANT" | "OWNER" | "LANDLORD";
  propertyId?: string;
  propertyCode?: string;
  listingType?: "SALE" | "RENT";
  propertyType?: ApiProperty["propertyType"];
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  const res = await fetch("/api/public/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Lead submission failed: ${res.status}`);
}

/* ── Owner property-offer intake ──────────────────────────────────────────── */

export interface UploadedImage {
  url: string;
  key: string;
}

/** Presign → direct PUT to storage → return the public URL + storage key. */
export async function uploadOfferImage(file: File): Promise<UploadedImage> {
  const signRes = await fetch("/api/public/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  if (!signRes.ok) throw new Error(`Could not get upload URL: ${signRes.status}`);
  const { uploadUrl, publicUrl, key } = (await signRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
    key: string;
  };

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error(`Image upload failed: ${put.status}`);

  return { url: publicUrl, key };
}

export interface PropertyOfferPayload {
  fullName: string;
  phone?: string;
  email?: string;
  propertyType: string;
  listingType?: "SALE" | "RENT";
  city: string;
  area?: string;
  price?: number;
  title?: string;
  description?: string;
  images?: UploadedImage[];
}

export async function submitPropertyOffer(
  payload: PropertyOfferPayload,
): Promise<{ contactId: string; propertyId: string }> {
  const res = await fetch("/api/public/property-offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Property offer failed: ${res.status}`);
  return res.json();
}
