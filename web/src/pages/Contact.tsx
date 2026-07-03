import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useT } from "@/i18n/useT";
import { Seo } from "@/components/Seo";

export default function ContactPage() {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Seo
        title={t("seo.contactTitle")}
        description={t("seo.contactDescription")}
        path="/contact"
      />
      <Header />
      
      <div className="bg-[#0B3A36] py-16 text-white text-center">
        <div className="container mx-auto">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t("contact.title")}</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">{t("contact.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto py-16 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
          
          {/* Contact Info */}
          <div>
            <h2 className="font-serif text-3xl text-[#0B3A36] font-bold mb-8">{t("contact.getInTouch")}</h2>
            <p className="text-gray-600 mb-10 leading-relaxed">
              {t("contact.intro")}
            </p>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5 text-[#0B3A36]" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#0B3A36] mb-1">{t("contact.headOffice")}</h4>
                  <p className="text-gray-600">Robert Doll 19 K-1 H-3 NR.4<br/>Prishtinë, Kosovo</p>
                  <a
                    href="https://maps.app.goo.gl/utQYnAqoKoznnFAKA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm font-medium text-[#0B3A36] underline-offset-2 hover:underline"
                  >
                    Get directions →
                  </a>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
                  <Phone className="w-5 h-5 text-[#0B3A36]" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#0B3A36] mb-1">{t("contact.phone")}</h4>
                  <p className="text-gray-600">
                    <a href="tel:+38349440015" className="hover:text-[#0B3A36] transition-colors">+383 49 440 015</a>{" "}
                    <span className="text-gray-400">(Andi)</span>
                    <br />
                    <a href="tel:+38344505405" className="hover:text-[#0B3A36] transition-colors">+383 44 505 405</a>{" "}
                    <span className="text-gray-400">(Emiri)</span>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
                  <Mail className="w-5 h-5 text-[#0B3A36]" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#0B3A36] mb-1">{t("contact.email")}</h4>
                  <p className="text-gray-600">
                    <a href="mailto:info@madem-ks.com" className="hover:text-[#0B3A36] transition-colors">info@madem-ks.com</a>
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
                  <Clock className="w-5 h-5 text-[#0B3A36]" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#0B3A36] mb-1">{t("contact.workingHours")}</h4>
                  <p className="text-gray-600">{t("contact.hoursWeekday")}<br/>{t("contact.hoursSaturday")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white p-8 md:p-10 rounded-lg shadow-xl border border-gray-100">
            <h3 className="font-serif text-2xl font-bold text-[#0B3A36] mb-6">{t("contact.sendInquiry")}</h3>
            <ContactForm />
          </div>
        </div>

        {/* Map */}
        <div className="mt-20 h-[400px] w-full rounded-lg relative overflow-hidden max-w-6xl mx-auto border border-gray-300">
          <iframe
            title={t("contact.headOffice")}
            src="https://www.google.com/maps?q=42.65567800015017,21.155250274802768&z=17&output=embed"
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
