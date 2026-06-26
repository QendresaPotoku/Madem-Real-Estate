import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PropertyGrid } from "@/components/PropertyGrid";
import { useProperties, useAgents } from "@/hooks/useApi";
import { CTASection } from "@/components/CTASection";
import { TeamCard } from "@/components/TeamCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { testimonials } from "@/data/testimonials";
import { FAQAccordion } from "@/components/FAQAccordion";
import { faqs } from "@/data/faqs";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, Home, Landmark, Briefcase, Trees, Factory, ShieldCheck, Award, Clock, Search, ChevronDown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "@/i18n/useT";

export default function HomePage() {
  const { t, tEnum } = useT();
  const { data: properties = [] } = useProperties();
  const { data: agents = [] } = useAgents();
  const featuredProperties = properties.filter(p => p.isFeatured).slice(0, 3);
  const latestProperties = [...properties].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  const homeFaqs = faqs.slice(0, 4);
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"Sale" | "Rent">("Sale");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  const runHeroSearch = () => {
    const params = new URLSearchParams();
    params.set("status", activeTab);
    if (selectedType !== "all") params.set("type", selectedType);
    if (selectedCity !== "all") params.set("city", selectedCity);
    setLocation(`/properties?${params.toString()}`);
  };

  const categories = [
    { name: "Apartment", icon: Building2, count: properties.filter(p => p.type === "Apartment").length },
    { name: "House", icon: Home, count: properties.filter(p => p.type === "House").length },
    { name: "Villa", icon: Landmark, count: properties.filter(p => p.type === "Villa").length },
    { name: "Office", icon: Briefcase, count: properties.filter(p => p.type === "Office").length },
    { name: "Commercial", icon: Factory, count: properties.filter(p => p.type === "Commercial").length },
    { name: "Land", icon: Trees, count: properties.filter(p => p.type === "Land").length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[640px] flex flex-col justify-center overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
            alt="Luxury Property"
            className="w-full h-full object-cover object-center scale-[1.02]"
          />
          <div className="absolute inset-0 bg-[#072D2A]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#072D2A]/90 via-transparent to-[#072D2A]/20" />
        </div>

        {/* Centred content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-8">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-8 h-px bg-[#F3D8A5]/70" />
            <span className="text-[#F3D8A5] tracking-[0.24em] text-[11px] uppercase font-medium">
              {t("home.eyebrow")}
            </span>
            <div className="w-8 h-px bg-[#F3D8A5]/70" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-white font-bold leading-[1.06] tracking-tight mb-6 max-w-4xl"
          >
            <span className="block text-[52px] md:text-[72px] lg:text-[88px]">
              {t("home.heroTitlePart1")} <span className="text-[#F3D8A5]">{t("home.heroTitleHighlight")}</span>
            </span>
            <span className="block text-[52px] md:text-[72px] lg:text-[88px]">
              {t("home.heroTitlePart2")}
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="text-white/50 text-[16px] font-light mb-12 max-w-md leading-relaxed"
          >
            {t("home.subline")}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-14"
          >
            <Link href="/properties" data-testid="hero-cta-explore">
              <button className="inline-flex items-center gap-2 px-9 py-4 bg-[#F3D8A5] text-[#0B3A36] font-semibold text-[12px] uppercase tracking-[0.18em] hover:bg-[#EBCB8F] transition-colors duration-200">
                {t("home.exploreProperties")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/offer-property" data-testid="hero-cta-list">
              <button className="inline-flex items-center gap-2 px-9 py-4 border border-white/30 text-white font-medium text-[12px] uppercase tracking-[0.18em] hover:border-[#F3D8A5]/50 hover:text-[#F3D8A5] transition-colors duration-200">
                {t("home.listProperty")}
              </button>
            </Link>
          </motion.div>

          {/* Minimal search strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="w-full max-w-3xl"
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex flex-col sm:flex-row items-stretch">
              {/* Sale / Rent */}
              <div className="flex sm:border-r border-white/10">
                {(["Sale", "Rent"] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    data-testid={`hero-tab-${tab.toLowerCase()}`}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 sm:flex-none px-5 py-4 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-150 ${
                      activeTab === tab
                        ? "bg-[#F3D8A5] text-[#0B3A36]"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    {t(tab === "Sale" ? "home.tabSale" : "home.tabRent")}
                  </button>
                ))}
              </div>

              {/* Type */}
              <div className="relative flex-1 border-t sm:border-t-0 sm:border-r border-white/10">
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  data-testid="hero-select-type"
                  className="w-full h-full bg-transparent text-white text-[13px] py-4 px-5 appearance-none cursor-pointer focus:outline-none"
                >
                  <option value="all" className="bg-[#0B3A36]">{t("searchFilters.allTypes")}</option>
                  <option value="Apartment" className="bg-[#0B3A36]">{tEnum("propertyType", "Apartment")}</option>
                  <option value="House" className="bg-[#0B3A36]">{tEnum("propertyType", "House")}</option>
                  <option value="Villa" className="bg-[#0B3A36]">{tEnum("propertyType", "Villa")}</option>
                  <option value="Office" className="bg-[#0B3A36]">{tEnum("propertyType", "Office")}</option>
                  <option value="Commercial" className="bg-[#0B3A36]">{tEnum("propertyType", "Commercial")}</option>
                  <option value="Land" className="bg-[#0B3A36]">{tEnum("propertyType", "Land")}</option>
                </select>
                <ChevronDown className="w-4 h-4 text-white/30 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* City */}
              <div className="relative flex-1 border-t sm:border-t-0 sm:border-r border-white/10">
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  data-testid="hero-select-city"
                  className="w-full h-full bg-transparent text-white text-[13px] py-4 px-5 appearance-none cursor-pointer focus:outline-none"
                >
                  <option value="all" className="bg-[#0B3A36]">{t("searchFilters.allCities")}</option>
                  <option value="Prishtine" className="bg-[#0B3A36]">Prishtinë</option>
                  <option value="Prizren" className="bg-[#0B3A36]">Prizren</option>
                  <option value="Peje" className="bg-[#0B3A36]">Pejë</option>
                  <option value="Gjakove" className="bg-[#0B3A36]">Gjakovë</option>
                  <option value="Ferizaj" className="bg-[#0B3A36]">Ferizaj</option>
                  <option value="Gjilan" className="bg-[#0B3A36]">Gjilan</option>
                  <option value="Mitrovice" className="bg-[#0B3A36]">Mitrovicë</option>
                </select>
                <ChevronDown className="w-4 h-4 text-white/30 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search button */}
              <button
                onClick={runHeroSearch}
                data-testid="hero-search-button"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#F3D8A5] text-[#0B3A36] font-semibold text-[11px] uppercase tracking-[0.18em] hover:bg-[#EBCB8F] transition-colors duration-200 border-t sm:border-t-0"
              >
                <Search className="w-4 h-4" />
                <span>{t("common.search")}</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 pointer-events-none">
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, idx) => (
              <Link key={idx} href={`/properties?type=${cat.name.toLowerCase()}`} className="flex flex-col items-center justify-center p-6 border border-gray-100 rounded-lg hover:border-[#0B3A36] hover:bg-gray-50 transition-colors group">
                <cat.icon className="w-8 h-8 text-[#0B3A36] mb-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                <span className="font-medium text-gray-900 mb-1">{tEnum("propertyType", cat.name)}</span>
                <span className="text-xs text-gray-500">{t("home.categoryCount", { count: cat.count })}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-4xl text-[#0B3A36] font-bold mb-4">{t("home.featuredTitle")}</h2>
              <p className="text-gray-600 max-w-xl">{t("home.featuredSubtitle")}</p>
            </div>
            <Link href="/properties" className="text-[#0B3A36] font-medium uppercase tracking-wider text-sm hover:text-[#EBCB8F] transition-colors mt-6 md:mt-0 flex items-center">
              {t("common.viewAll")} <span className="ml-2">→</span>
            </Link>
          </div>
          
          <PropertyGrid properties={featuredProperties} columns={3} />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-[#0B3A36] text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[#F3D8A5] tracking-[0.2em] text-xs uppercase font-semibold mb-4 block">{t("home.standardEyebrow")}</span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-8 leading-tight">{t("home.standardTitle")}</h2>
              <p className="text-gray-300 text-lg mb-12 leading-relaxed">
                {t("home.standardIntro")}
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full bg-[#072D2A] flex items-center justify-center shrink-0 border border-[#F3D8A5]/20">
                    <ShieldCheck className="w-6 h-6 text-[#F3D8A5]" />
                  </div>
                  <div>
                    <h4 className="text-xl font-serif font-medium mb-2">{t("home.discretionTitle")}</h4>
                    <p className="text-sm text-gray-400">{t("home.discretionText")}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full bg-[#072D2A] flex items-center justify-center shrink-0 border border-[#F3D8A5]/20">
                    <Award className="w-6 h-6 text-[#F3D8A5]" />
                  </div>
                  <div>
                    <h4 className="text-xl font-serif font-medium mb-2">{t("home.portfolioTitle")}</h4>
                    <p className="text-sm text-gray-400">{t("home.portfolioText")}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full bg-[#072D2A] flex items-center justify-center shrink-0 border border-[#F3D8A5]/20">
                    <Clock className="w-6 h-6 text-[#F3D8A5]" />
                  </div>
                  <div>
                    <h4 className="text-xl font-serif font-medium mb-2">{t("home.processTitle")}</h4>
                    <p className="text-sm text-gray-400">{t("home.processText")}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-[4/5] bg-gray-800 rounded-sm overflow-hidden">
                <img src="https://picsum.photos/seed/officeinterior/800/1000" alt="MADEM Office" className="w-full h-full object-cover opacity-80" />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-white p-8 shadow-2xl hidden md:block max-w-[280px]">
                <p className="font-serif text-4xl text-[#0B3A36] font-bold mb-2">12+</p>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">{t("home.yearsBadge")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Properties */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-4xl text-[#0B3A36] font-bold mb-4">{t("home.latestTitle")}</h2>
              <p className="text-gray-600 max-w-xl">{t("home.latestSubtitle")}</p>
            </div>
            <Link href="/properties" className="text-[#0B3A36] font-medium uppercase tracking-wider text-sm hover:text-[#EBCB8F] transition-colors mt-6 md:mt-0 flex items-center">
              {t("common.viewAll")} <span className="ml-2">→</span>
            </Link>
          </div>
          
          <PropertyGrid properties={latestProperties} columns={3} />
        </div>
      </section>

      {/* CTA Section - Offer Property */}
      <CTASection
        title={t("home.ctaTitle")}
        subtitle={t("home.ctaSubtitle")}
        buttonText={t("home.ctaButton")}
        buttonHref="/offer-property"
        secondaryButtonText={t("home.ctaSecondary")}
        secondaryButtonHref="/contact"
        theme="light"
      />

      {/* Agents */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-[#0B3A36] font-bold mb-4">{t("home.expertsTitle")}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t("home.expertsSubtitle")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {agents.slice(0, 4).map(agent => (
              <TeamCard key={agent.id} agent={agent} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button asChild variant="outline" className="border-[#0B3A36] text-[#0B3A36] rounded-none px-8 tracking-widest uppercase hover:bg-[#0B3A36] hover:text-white h-12">
              <Link href="/about">{t("home.meetFullTeam")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 bg-[#F3D8A5] text-[#0B3A36]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-[#0B3A36]/20">
            <div>
              <p className="font-serif text-4xl md:text-5xl font-bold mb-2">500+</p>
              <p className="text-xs uppercase tracking-widest font-medium">{t("home.statProperties")}</p>
            </div>
            <div>
              <p className="font-serif text-4xl md:text-5xl font-bold mb-2">12</p>
              <p className="text-xs uppercase tracking-widest font-medium">{t("home.statYears")}</p>
            </div>
            <div>
              <p className="font-serif text-4xl md:text-5xl font-bold mb-2">98%</p>
              <p className="text-xs uppercase tracking-widest font-medium">{t("home.statClients")}</p>
            </div>
            <div>
              <p className="font-serif text-4xl md:text-5xl font-bold mb-2">7</p>
              <p className="text-xs uppercase tracking-widest font-medium">{t("home.statCities")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-[#0B3A36] font-bold mb-4">{t("home.testimonialsTitle")}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t("home.testimonialsSubtitle")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.slice(0, 3).map(testimonial => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-[#0B3A36] font-bold mb-4">{t("home.faqTitle")}</h2>
            <p className="text-gray-600">{t("home.faqSubtitle")}</p>
          </div>
          
          <FAQAccordion faqs={homeFaqs} />
          
          <div className="text-center mt-12">
            <Link href="/faq" className="text-[#0B3A36] font-medium uppercase tracking-wider text-sm hover:text-[#EBCB8F] transition-colors">
              {t("home.readAllFaqs")} <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
