import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FAQAccordion } from "@/components/FAQAccordion";
import { faqs } from "@/data/faqs";
import { useT } from "@/i18n/useT";

export default function FAQPage() {
  const { t, tEnum } = useT();
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Buying", "Renting", "Selling", "Agency"];
  
  const filteredFaqs = activeCategory === "All" 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Header />
      
      <div className="bg-[#0B3A36] py-16 text-white text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t("home.faqTitle")}</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">{t("faqPage.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 flex-grow max-w-4xl">
        
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-sm text-sm font-medium tracking-wide transition-colors ${
                activeCategory === cat 
                  ? "bg-[#0B3A36] text-[#F3D8A5]" 
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#0B3A36]"
              }`}
            >
              {cat === "All" ? t("common.all") : tEnum("faqCategory", cat)}
            </button>
          ))}
        </div>

        {/* FAQs List */}
        <div className="mb-16">
          <FAQAccordion faqs={filteredFaqs} />
        </div>

        {/* Still have questions CTA */}
        <div className="bg-[#F3D8A5]/20 border border-[#F3D8A5]/50 p-8 rounded-lg text-center">
          <h3 className="font-serif text-2xl font-bold text-[#0B3A36] mb-3">{t("faqPage.stillQuestions")}</h3>
          <p className="text-gray-700 mb-6">{t("faqPage.stillText")}</p>
          <a href="/contact" className="inline-block bg-[#0B3A36] text-[#F3D8A5] hover:bg-[#072D2A] uppercase tracking-widest text-xs font-semibold px-8 py-4 rounded-sm transition-colors">
            {t("faqPage.contactSupport")}
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
