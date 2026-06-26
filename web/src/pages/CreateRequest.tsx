import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreateRequestForm } from "@/components/CreateRequestForm";
import { Target, Search, Clock } from "lucide-react";
import { useT } from "@/i18n/useT";

export default function CreateRequestPage() {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Header />
      
      <div className="bg-[#0B3A36] py-16 text-white text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t("requestPage.title")}</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">{t("requestPage.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 max-w-6xl mx-auto">
          
          <div className="lg:col-span-1 space-y-10">
            <div>
              <h2 className="font-serif text-3xl text-[#0B3A36] font-bold mb-6">{t("requestPage.serviceTitle")}</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {t("requestPage.serviceText")}
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <Target className="w-8 h-8 text-[#0B3A36] shrink-0" />
                <div>
                  <h4 className="font-serif font-bold text-gray-900 text-lg mb-1">{t("requestPage.matchTitle")}</h4>
                  <p className="text-sm text-gray-600">{t("requestPage.matchText")}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Search className="w-8 h-8 text-[#0B3A36] shrink-0" />
                <div>
                  <h4 className="font-serif font-bold text-gray-900 text-lg mb-1">{t("requestPage.offMarketTitle")}</h4>
                  <p className="text-sm text-gray-600">{t("requestPage.offMarketText")}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="w-8 h-8 text-[#0B3A36] shrink-0" />
                <div>
                  <h4 className="font-serif font-bold text-gray-900 text-lg mb-1">{t("requestPage.timeTitle")}</h4>
                  <p className="text-sm text-gray-600">{t("requestPage.timeText")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-10 rounded-lg shadow-xl border border-gray-100">
              <h3 className="font-serif text-2xl font-bold text-[#0B3A36] mb-6 border-b border-gray-100 pb-4">{t("requestPage.formTitle")}</h3>
              <CreateRequestForm />
            </div>
          </div>
          
        </div>
      </div>

      <Footer />
    </div>
  );
}
