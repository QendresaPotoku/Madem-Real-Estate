import type { Localized } from "@/i18n/types";

export type PropertyStatus = "For Sale" | "For Rent" | "Reserved" | "Sold";
export type PropertyType = "Apartment" | "House" | "Villa" | "Office" | "Commercial" | "Land" | "Warehouse";
export type PropertyCondition =
  | "New"
  | "Excellent"
  | "Renovated"
  | "Good"
  | "Needs Renovation"
  | "Under Construction";
export type Orientation =
  | "North"
  | "South"
  | "East"
  | "West"
  | "Northeast"
  | "Northwest"
  | "Southeast"
  | "Southwest";

export interface Property {
  id: string;
  title: Localized;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  country?: string;
  city: string;
  neighborhood: string;
  cadastralZone?: string;
  /** Living / usable area in m². */
  area: number;
  /** Plot (land) area in m² — for houses, villas and land. */
  plotArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  condition?: PropertyCondition;
  yearBuilt?: number;
  /** Canonical heating term (translated via the glossary). */
  heating?: string;
  orientation?: Orientation;
  referenceNumber: string;
  description: Localized;
  amenities: string[];
  // Structured amenities shown as a checklist on the detail page.
  elevator?: boolean;
  parking?: boolean;
  garage?: boolean;
  terrace?: boolean;
  airConditioning?: boolean;
  images: string[];
  agentId: string;
  isFeatured: boolean;
  createdAt: string;
}

const generateImages = (seedPrefix: string) => {
  return [
    `https://picsum.photos/seed/${seedPrefix}1/1200/800`,
    `https://picsum.photos/seed/${seedPrefix}2/1200/800`,
    `https://picsum.photos/seed/${seedPrefix}3/1200/800`,
    `https://picsum.photos/seed/${seedPrefix}4/1200/800`,
  ];
};

export const properties: Property[] = [
  {
    id: "p1",
    title: {
      en: "Luxury Penthouse with City Views",
      sq: "Penthouse luksoz me pamje nga qyteti",
      de: "Luxus-Penthouse mit Stadtblick",
    },
    type: "Apartment",
    status: "For Sale",
    price: 450000,
    city: "Prishtine",
    neighborhood: "Dragodan",
    area: 210,
    bedrooms: 3,
    bathrooms: 2,
    floor: 8,
    condition: "New",
    yearBuilt: 2021,
    heating: "Central Heating",
    orientation: "South",
    referenceNumber: "PR-1001",
    description: {
      en: "Exceptional penthouse offering panoramic views of Prishtina. Featuring high-end finishes, floor-to-ceiling windows, and a massive wrap-around terrace.",
      sq: "Penthouse i jashtëzakonshëm që ofron pamje panoramike të Prishtinës. Me përfundime të cilësisë së lartë, dritare nga dyshemeja deri në tavan dhe një tarracë të madhe rrethuese.",
      de: "Außergewöhnliches Penthouse mit Panoramablick über Prishtina. Mit hochwertiger Ausstattung, raumhohen Fenstern und einer großzügigen umlaufenden Terrasse.",
    },
    amenities: ["Elevator", "Parking", "Security 24/7", "Central Heating", "Air Conditioning"],
    elevator: true,
    parking: true,
    garage: false,
    terrace: true,
    airConditioning: true,
    images: generateImages("luxpent"),
    agentId: "a1",
    isFeatured: true,
    createdAt: "2023-10-01T10:00:00Z",
  },
  {
    id: "p2",
    title: {
      en: "Modern Villa with Private Pool",
      sq: "Vilë moderne me pishinë private",
      de: "Moderne Villa mit Privatpool",
    },
    type: "Villa",
    status: "For Sale",
    price: 850000,
    city: "Prishtine",
    neighborhood: "Sofalia",
    area: 450,
    plotArea: 700,
    bedrooms: 5,
    bathrooms: 4,
    condition: "New",
    yearBuilt: 2020,
    heating: "Underfloor Heating",
    orientation: "Southwest",
    referenceNumber: "VL-2005",
    description: {
      en: "Stunning modern villa situated in the exclusive Sofalia neighborhood. Boasts a private swimming pool, landscaped gardens, and premium imported materials throughout.",
      sq: "Vilë moderne mahnitëse e vendosur në lagjen ekskluzive të Sofalisë. Disponon pishinë private, kopshte të rregulluara dhe materiale premium të importuara në çdo cep.",
      de: "Atemberaubende moderne Villa im exklusiven Viertel Sofalia. Verfügt über einen privaten Swimmingpool, angelegte Gärten und durchweg hochwertige importierte Materialien.",
    },
    amenities: ["Pool", "Garage", "Security System", "Garden", "Fireplace"],
    elevator: false,
    parking: true,
    garage: true,
    terrace: true,
    airConditioning: true,
    images: generateImages("modvilla"),
    agentId: "a2",
    isFeatured: true,
    createdAt: "2023-09-15T08:30:00Z",
  },
  {
    id: "p3",
    title: {
      en: "Prime Commercial Space in Center",
      sq: "Lokal afarist atraktiv në qendër",
      de: "Erstklassige Gewerbefläche im Zentrum",
    },
    type: "Commercial",
    status: "For Rent",
    price: 3500,
    city: "Prizren",
    neighborhood: "Center",
    area: 180,
    floor: 1,
    condition: "Renovated",
    yearBuilt: 2017,
    heating: "Central Heating",
    orientation: "East",
    referenceNumber: "CM-3012",
    description: {
      en: "Highly visible commercial space in the heart of Prizren. Perfect for a boutique, upscale cafe, or flagship retail store with heavy foot traffic.",
      sq: "Lokal afarist shumë i dukshëm në zemër të Prizrenit. Ideal për butik, kafe ekskluzive ose dyqan kryesor me qarkullim të lartë këmbësorësh.",
      de: "Gut sichtbare Gewerbefläche im Herzen von Prizren. Perfekt für eine Boutique, ein gehobenes Café oder einen Flagship-Store mit hoher Laufkundschaft.",
    },
    amenities: ["Street Level", "Large Windows", "HVAC", "Storage Room"],
    elevator: false,
    parking: false,
    garage: false,
    terrace: false,
    airConditioning: true,
    images: generateImages("prizrencom"),
    agentId: "a3",
    isFeatured: false,
    createdAt: "2023-10-10T14:15:00Z",
  },
  {
    id: "p4",
    title: {
      en: "Elegant City Center Apartment",
      sq: "Banesë elegante në qendër të qytetit",
      de: "Elegante Wohnung im Stadtzentrum",
    },
    type: "Apartment",
    status: "Reserved",
    price: 185000,
    city: "Prishtine",
    neighborhood: "Center",
    area: 95,
    bedrooms: 2,
    bathrooms: 1,
    floor: 4,
    condition: "Renovated",
    yearBuilt: 2015,
    heating: "City Heating",
    orientation: "West",
    referenceNumber: "PR-1022",
    description: {
      en: "Beautifully renovated apartment steps away from Mother Teresa Boulevard. Sold fully furnished with custom Italian design pieces.",
      sq: "Banesë e renovuar bukur, vetëm disa hapa larg Bulevardit Nënë Tereza. Shitet plotësisht e mobiluar me pjesë dizajni italian me porosi.",
      de: "Wunderschön renovierte Wohnung nur wenige Schritte vom Mutter-Teresa-Boulevard. Wird voll möbliert mit maßgefertigten italienischen Designstücken verkauft.",
    },
    amenities: ["Elevator", "City Heating", "Intercom", "Balcony"],
    elevator: true,
    parking: false,
    garage: false,
    terrace: false,
    airConditioning: false,
    images: generateImages("cityapt"),
    agentId: "a1",
    isFeatured: false,
    createdAt: "2023-10-05T09:45:00Z",
  },
  {
    id: "p5",
    title: {
      en: "Spacious Family House with Garden",
      sq: "Shtëpi e gjerë familjare me kopsht",
      de: "Geräumiges Familienhaus mit Garten",
    },
    type: "House",
    status: "For Sale",
    price: 320000,
    city: "Peje",
    neighborhood: "Karagaq",
    area: 280,
    plotArea: 500,
    bedrooms: 4,
    bathrooms: 3,
    condition: "Good",
    yearBuilt: 2012,
    heating: "Central Heating",
    orientation: "Southeast",
    referenceNumber: "PJ-4001",
    description: {
      en: "Generous family home near the park. Features a large private garden, traditional stone details, and modern interior comforts.",
      sq: "Shtëpi e gjerë familjare afër parkut. Përfshin kopsht të madh privat, detaje tradicionale guri dhe komoditete moderne të brendshme.",
      de: "Großzügiges Familienhaus in Parknähe. Mit großem Privatgarten, traditionellen Steindetails und modernem Wohnkomfort.",
    },
    amenities: ["Garage", "Garden", "Heating System", "Storage"],
    elevator: false,
    parking: true,
    garage: true,
    terrace: false,
    airConditioning: false,
    images: generateImages("pejhouse"),
    agentId: "a4",
    isFeatured: true,
    createdAt: "2023-09-20T11:20:00Z",
  },
  {
    id: "p6",
    title: {
      en: "Premium Office Space",
      sq: "Hapësirë premium zyre",
      de: "Premium-Bürofläche",
    },
    type: "Office",
    status: "For Rent",
    price: 1200,
    city: "Prishtine",
    neighborhood: "Dardania",
    area: 120,
    floor: 2,
    condition: "New",
    yearBuilt: 2019,
    heating: "Central Heating",
    orientation: "North",
    referenceNumber: "OF-5011",
    description: {
      en: "Turnkey office space in a modern business center. Includes glass partitions, reception area, and dedicated server room.",
      sq: "Hapësirë zyre çelës-në-dorë në një qendër moderne biznesi. Përfshin ndarje xhami, zonë recepsioni dhe dhomë të dedikuar serverësh.",
      de: "Schlüsselfertige Bürofläche in einem modernen Business-Center. Inklusive Glastrennwänden, Empfangsbereich und eigenem Serverraum.",
    },
    amenities: ["Elevator", "Underground Parking", "Reception", "Fiber Optic"],
    elevator: true,
    parking: true,
    garage: false,
    terrace: false,
    airConditioning: true,
    images: generateImages("proffice"),
    agentId: "a2",
    isFeatured: false,
    createdAt: "2023-10-12T16:00:00Z",
  },
  {
    id: "p7",
    title: {
      en: "Development Land near Highway",
      sq: "Tokë për zhvillim afër autostradës",
      de: "Bauland in Autobahnnähe",
    },
    type: "Land",
    status: "For Sale",
    price: 1500000,
    city: "Ferizaj",
    neighborhood: "Industrial Zone",
    area: 15000,
    plotArea: 15000,
    orientation: "South",
    referenceNumber: "LD-6001",
    description: {
      en: "Prime parcel of land with direct highway access. Ideal for logistics center, factory, or large retail warehouse.",
      sq: "Parcelë atraktive toke me qasje direkte në autostradë. Ideale për qendër logjistike, fabrikë ose depo të madhe tregtare.",
      de: "Erstklassiges Grundstück mit direktem Autobahnzugang. Ideal für ein Logistikzentrum, eine Fabrik oder ein großes Einzelhandelslager.",
    },
    amenities: ["Road Access", "Electricity", "Water Connection", "Industrial Zoning"],
    elevator: false,
    parking: false,
    garage: false,
    terrace: false,
    airConditioning: false,
    images: generateImages("indland"),
    agentId: "a3",
    isFeatured: false,
    createdAt: "2023-08-10T10:00:00Z",
  },
  {
    id: "p8",
    title: {
      en: "Historic Stone House Restored",
      sq: "Shtëpi historike guri e restauruar",
      de: "Restauriertes historisches Steinhaus",
    },
    type: "House",
    status: "Sold",
    price: 275000,
    city: "Gjakove",
    neighborhood: "Old Bazaar",
    area: 160,
    plotArea: 300,
    bedrooms: 3,
    bathrooms: 2,
    condition: "Renovated",
    yearBuilt: 1965,
    heating: "Underfloor Heating",
    orientation: "South",
    referenceNumber: "GJ-7001",
    description: {
      en: "Meticulously restored traditional stone house near the old bazaar. Blends historic charm with contemporary luxury living.",
      sq: "Shtëpi tradicionale guri e restauruar me përkujdesje afër pazarit të vjetër. Ndërthur sharmin historik me jetesën luksoze bashkëkohore.",
      de: "Sorgfältig restauriertes traditionelles Steinhaus nahe dem alten Basar. Verbindet historischen Charme mit zeitgemäßem Luxuswohnen.",
    },
    amenities: ["Courtyard", "Underfloor Heating", "Security Camera"],
    elevator: false,
    parking: false,
    garage: false,
    terrace: false,
    airConditioning: false,
    images: generateImages("gjstone"),
    agentId: "a4",
    isFeatured: true,
    createdAt: "2023-07-15T09:00:00Z",
  },
  {
    id: "p9",
    title: {
      en: "Contemporary Warehouse Facility",
      sq: "Objekt bashkëkohor depoje",
      de: "Moderne Lagerhalle",
    },
    type: "Warehouse",
    status: "For Rent",
    price: 4500,
    city: "Mitrovice",
    neighborhood: "South Zone",
    area: 1200,
    plotArea: 2000,
    condition: "New",
    yearBuilt: 2022,
    heating: "No Heating",
    orientation: "East",
    referenceNumber: "WH-8005",
    description: {
      en: "New warehouse with high clearance and multiple loading docks. Includes integrated office space and staff facilities.",
      sq: "Depo e re me lartësi të madhe dhe rampa të shumta ngarkimi. Përfshin hapësirë zyre të integruar dhe ambiente për stafin.",
      de: "Neue Lagerhalle mit großer Höhe und mehreren Laderampen. Inklusive integrierter Bürofläche und Personalräumen.",
    },
    amenities: ["Loading Docks", "Heavy Duty Floors", "High Ceilings", "Parking"],
    elevator: false,
    parking: true,
    garage: false,
    terrace: false,
    airConditioning: false,
    images: generateImages("mitwh"),
    agentId: "a5",
    isFeatured: false,
    createdAt: "2023-10-01T13:30:00Z",
  },
  {
    id: "p10",
    title: {
      en: "Boutique Apartment with Terrace",
      sq: "Banesë butik me tarracë",
      de: "Boutique-Wohnung mit Terrasse",
    },
    type: "Apartment",
    status: "For Rent",
    price: 850,
    city: "Prishtine",
    neighborhood: "Ulpiana",
    area: 85,
    bedrooms: 1,
    bathrooms: 1,
    floor: 6,
    condition: "New",
    yearBuilt: 2020,
    heating: "Central Heating",
    orientation: "West",
    referenceNumber: "PR-1033",
    description: {
      en: "Stylish one-bedroom apartment featuring a large terrace. Perfect for young professionals or expats seeking comfort and convenience.",
      sq: "Banesë elegante me një dhomë gjumi dhe tarracë të madhe. Ideale për profesionistë të rinj ose të huaj që kërkojnë rehati dhe komoditet.",
      de: "Stilvolle Ein-Zimmer-Wohnung mit großer Terrasse. Perfekt für junge Berufstätige oder Expats, die Komfort und Bequemlichkeit suchen.",
    },
    amenities: ["Elevator", "Central Heating", "Furnished"],
    elevator: true,
    parking: false,
    garage: false,
    terrace: true,
    airConditioning: true,
    images: generateImages("btqapt"),
    agentId: "a1",
    isFeatured: false,
    createdAt: "2023-10-18T11:15:00Z",
  },
  {
    id: "p11",
    title: {
      en: "Suburban Family Villa",
      sq: "Vilë familjare në periferi",
      de: "Familienvilla im Vorort",
    },
    type: "Villa",
    status: "For Sale",
    price: 420000,
    city: "Gjilan",
    neighborhood: "Zabeli",
    area: 310,
    plotArea: 450,
    bedrooms: 4,
    bathrooms: 3,
    condition: "Good",
    yearBuilt: 2016,
    heating: "Heat Pump",
    orientation: "Southeast",
    referenceNumber: "GL-9002",
    description: {
      en: "Elegant villa in a quiet suburban area. Features an open-concept living space, large bedrooms, and a meticulously kept garden.",
      sq: "Vilë elegante në një zonë të qetë periferike. Përfshin hapësirë jetese me koncept të hapur, dhoma të mëdha gjumi dhe një kopsht të mirëmbajtur me kujdes.",
      de: "Elegante Villa in einer ruhigen Vorortlage. Mit offenem Wohnbereich, großen Schlafzimmern und einem sorgfältig gepflegten Garten.",
    },
    amenities: ["Garage", "Garden", "Security System", "Heat Pump"],
    elevator: false,
    parking: true,
    garage: true,
    terrace: false,
    airConditioning: true,
    images: generateImages("glvilla"),
    agentId: "a6",
    isFeatured: false,
    createdAt: "2023-09-05T14:45:00Z",
  },
  {
    id: "p12",
    title: {
      en: "Executive Office Suite",
      sq: "Suitë ekzekutive zyre",
      de: "Executive-Bürosuite",
    },
    type: "Office",
    status: "For Sale",
    price: 210000,
    city: "Prishtine",
    neighborhood: "Lakrishte",
    area: 95,
    floor: 5,
    condition: "New",
    yearBuilt: 2019,
    heating: "Central Heating",
    orientation: "North",
    referenceNumber: "OF-5020",
    description: {
      en: "Premium office suite in a prestigious commercial building. Excellent natural light and views of the city skyline.",
      sq: "Suitë premium zyre në një ndërtesë prestigjioze afariste. Dritë natyrore e shkëlqyer dhe pamje nga silueta e qytetit.",
      de: "Premium-Bürosuite in einem renommierten Geschäftsgebäude. Hervorragendes natürliches Licht und Blick auf die Skyline der Stadt.",
    },
    amenities: ["Elevator", "Parking", "24/7 Access", "HVAC"],
    elevator: true,
    parking: true,
    garage: false,
    terrace: false,
    airConditioning: true,
    images: generateImages("execoff"),
    agentId: "a2",
    isFeatured: true,
    createdAt: "2023-10-08T09:20:00Z",
  }
];
