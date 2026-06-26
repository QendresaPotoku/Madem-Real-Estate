import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useT } from "@/i18n/useT";

export default function ContactPage() {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <Header />
      
      <div className="bg-[#0B3A36] py-16 text-white text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t("contact.title")}</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">{t("contact.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 flex-grow">
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
                  <p className="text-gray-600">Mother Teresa Boulevard, No. 45<br/>10000 Prishtine, Kosovo</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
                  <Phone className="w-5 h-5 text-[#0B3A36]" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#0B3A36] mb-1">{t("contact.phone")}</h4>
                  <p className="text-gray-600">+383 44 123 456<br/>+383 38 123 456</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
                  <Mail className="w-5 h-5 text-[#0B3A36]" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#0B3A36] mb-1">{t("contact.email")}</h4>
                  <p className="text-gray-600">info@madem.com<br/>investments@madem.com</p>
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
            src="https://www.google.com/maps?q=Bulevardi%20Nëna%20Terezë%2C%20Prishtina%2C%20Kosovo&output=embed"
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
