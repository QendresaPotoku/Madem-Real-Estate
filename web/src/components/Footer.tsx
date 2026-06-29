import { Link } from "wouter";
import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react";
import { useT } from "@/i18n/useT";

export function Footer() {
  const { t } = useT();
  return (
    <footer className="bg-[#072D2A] text-white pt-20 pb-10 border-t border-[#F3D8A5]/10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
          {/* Brand Col */}
          <div>
            <Link href="/" className="inline-flex items-center mb-6">
              <img src="/Madem_Mark.png" alt="MADEM" className="h-16 w-auto" />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">
              {t("footer.description")}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#0B3A36] flex items-center justify-center text-[#F3D8A5] hover:bg-[#F3D8A5] hover:text-[#0B3A36] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#0B3A36] flex items-center justify-center text-[#F3D8A5] hover:bg-[#F3D8A5] hover:text-[#0B3A36] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#0B3A36] flex items-center justify-center text-[#F3D8A5] hover:bg-[#F3D8A5] hover:text-[#0B3A36] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-xl mb-6 text-[#F3D8A5]">{t("footer.quickLinks")}</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              <li><Link href="/properties" className="hover:text-white transition-colors">{t("footer.allProperties")}</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">{t("footer.ourAgency")}</Link></li>
              <li><Link href="/favorites" className="hover:text-white transition-colors">{t("footer.favorites")}</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">{t("footer.realEstateBlog")}</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">{t("footer.faq")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-xl mb-6 text-[#F3D8A5]">{t("footer.contactUs")}</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#F3D8A5] shrink-0 mt-0.5" />
                <span>Mother Teresa Blvd, No. 45<br/>10000 Prishtine, Kosovo</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#F3D8A5] shrink-0" />
                <a href="tel:+38344123456" className="hover:text-white transition-colors">+383 44 123 456</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#F3D8A5] shrink-0" />
                <a href="mailto:info@madem.com" className="hover:text-white transition-colors">info@madem.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#0B3A36] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} MADEM Real Estate. {t("footer.rights")}</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">{t("footer.privacy")}</Link>
            <Link href="/terms" className="hover:text-white transition-colors">{t("footer.terms")}</Link>
            <Link href="/cookie-policy" className="hover:text-white transition-colors">{t("footer.cookies")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
