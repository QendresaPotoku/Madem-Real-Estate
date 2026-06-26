import type { Localized } from "@/i18n/types";

export interface Agent {
  id: string;
  name: string;
  title: Localized;
  phone: string;
  email: string;
  image: string;
  specialties: string[];
  propertiesCount: number;
  yearsExperience: number;
}

export const agents: Agent[] = [
  {
    id: "a1",
    name: "Arbenita Hoxha",
    title: {
      en: "Senior Property Consultant",
      sq: "Konsulente e lartë e pronave",
      de: "Leitende Immobilienberaterin",
    },
    phone: "+383 44 123 456",
    email: "arbenita.h@madem.com",
    image: "https://picsum.photos/seed/agent1/400/500",
    specialties: ["Luxury Apartments", "City Center"],
    propertiesCount: 42,
    yearsExperience: 8,
  },
  {
    id: "a2",
    name: "Dardan Krasniqi",
    title: {
      en: "Commercial Real Estate Director",
      sq: "Drejtor i patundshmërive komerciale",
      de: "Direktor für Gewerbeimmobilien",
    },
    phone: "+383 45 234 567",
    email: "dardan.k@madem.com",
    image: "https://picsum.photos/seed/agent2/400/500",
    specialties: ["Offices", "Retail Spaces", "Warehouses"],
    propertiesCount: 35,
    yearsExperience: 12,
  },
  {
    id: "a3",
    name: "Liridon Gashi",
    title: {
      en: "Investment Advisor",
      sq: "Këshilltar investimesh",
      de: "Anlageberater",
    },
    phone: "+383 49 345 678",
    email: "liridon.g@madem.com",
    image: "https://picsum.photos/seed/agent3/400/500",
    specialties: ["Land Development", "Multi-family"],
    propertiesCount: 18,
    yearsExperience: 15,
  },
  {
    id: "a4",
    name: "Blerta Kelmendi",
    title: {
      en: "Residential Sales Expert",
      sq: "Eksperte e shitjeve rezidenciale",
      de: "Expertin für Wohnimmobilienverkauf",
    },
    phone: "+383 44 456 789",
    email: "blerta.k@madem.com",
    image: "https://picsum.photos/seed/agent4/400/500",
    specialties: ["Houses", "Villas", "Suburbs"],
    propertiesCount: 56,
    yearsExperience: 6,
  },
  {
    id: "a5",
    name: "Valon Berisha",
    title: {
      en: "Industrial Property Specialist",
      sq: "Specialist i pronave industriale",
      de: "Spezialist für Industrieimmobilien",
    },
    phone: "+383 45 567 890",
    email: "valon.b@madem.com",
    image: "https://picsum.photos/seed/agent5/400/500",
    specialties: ["Logistics", "Industrial Land"],
    propertiesCount: 24,
    yearsExperience: 10,
  },
  {
    id: "a6",
    name: "Teuta Rexhepi",
    title: {
      en: "Leasing Manager",
      sq: "Menaxhere e qirave",
      de: "Leasing-Managerin",
    },
    phone: "+383 49 678 901",
    email: "teuta.r@madem.com",
    image: "https://picsum.photos/seed/agent6/400/500",
    specialties: ["Long-term Rentals", "Corporate Relocation"],
    propertiesCount: 89,
    yearsExperience: 5,
  },
];
