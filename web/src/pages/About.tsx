import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TeamCard } from "@/components/TeamCard";
import { useAgents } from "@/hooks/useApi";
import { Building2, Award, Users, Globe2 } from "lucide-react";
import { useT } from "@/i18n/useT";

export default function AboutPage() {
  const { t } = useT();
  const { data: agents = [] } = useAgents();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Header />
      
      {/* Hero */}
      <section className="bg-[#0B3A36] py-24 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <span className="text-[#F3D8A5] tracking-[0.3em] text-xs uppercase font-semibold mb-6 block">{t("about.eyebrow")}</span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-8 leading-tight">{t("about.title")}</h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            {t("about.intro")}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
              <p>{t("about.para1")}</p>
              <p>{t("about.para2")}</p>
              <p>{t("about.para3")}</p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-gray-200 rounded-sm overflow-hidden">
                <img src="https://picsum.photos/seed/aboutmadem/800/600" alt="MADEM office meeting" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-[#F3D8A5] -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-[#0B3A36] font-bold mb-4">{t("about.valuesTitle")}</h2>
            <p className="text-gray-600">{t("about.valuesSubtitle")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-lg border border-gray-100 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-[#0B3A36]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0B3A36] mb-3">{t("about.excellence")}</h3>
              <p className="text-sm text-gray-600">{t("about.excellenceText")}</p>
            </div>
            <div className="bg-white p-8 rounded-lg border border-gray-100 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-[#0B3A36]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0B3A36] mb-3">{t("about.expertise")}</h3>
              <p className="text-sm text-gray-600">{t("about.expertiseText")}</p>
            </div>
            <div className="bg-white p-8 rounded-lg border border-gray-100 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-[#0B3A36]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0B3A36] mb-3">{t("about.discretion")}</h3>
              <p className="text-sm text-gray-600">{t("about.discretionText")}</p>
            </div>
            <div className="bg-white p-8 rounded-lg border border-gray-100 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Globe2 className="w-8 h-8 text-[#0B3A36]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0B3A36] mb-3">{t("about.integrity")}</h3>
              <p className="text-sm text-gray-600">{t("about.integrityText")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-[#0B3A36] font-bold mb-4">{t("about.teamTitle")}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t("about.teamSubtitle")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map(agent => (
              <TeamCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
