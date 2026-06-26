import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/i18n/context";
import { LANGUAGES } from "@/i18n/types";
import { useFavorites } from "@/hooks/useFavorites";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useT();
  const { language, setLanguage } = useLanguage();
  const { favorites } = useFavorites();
  const favoritesCount = favorites.length;

  // If we are not on the home page, we always want the solid header
  const isHomePage = location === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial scroll position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const headerBgClass = isHomePage && !isScrolled && !isMobileMenuOpen
    ? "bg-transparent text-white border-transparent"
    : "bg-[#0B3A36] text-white border-b border-[#072D2A]/20 shadow-md";

  const linkClass = "text-sm font-medium tracking-wide hover:text-[#F3D8A5] transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-[#F3D8A5] after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left";

  const navLinks = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.properties"), href: "/properties" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.blog"), href: "/blog" },
    { name: t("nav.faq"), href: "/faq" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${headerBgClass}`}>
      <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex flex-col z-50">
          <span className="font-serif text-2xl tracking-widest font-bold leading-none">MADEM</span>
          <span className="text-[0.65rem] tracking-[0.3em] uppercase text-[#F3D8A5] leading-tight">{t("header.tagline")}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-6">
          <Link
            href="/favorites"
            className="relative p-1 hover:text-[#F3D8A5] transition-colors"
            aria-label={t("footer.favorites")}
            title={t("footer.favorites")}
            data-testid="link-favorites"
          >
            <Heart className="w-5 h-5" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#F3D8A5] text-[#0B3A36] text-[10px] font-bold leading-none">
                {favoritesCount}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider">
            {LANGUAGES.map((lang, index) => (
              <span key={lang.code} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  aria-pressed={language === lang.code}
                  className={`transition-colors cursor-pointer ${
                    language === lang.code ? "text-[#F3D8A5]" : "hover:text-[#F3D8A5]"
                  }`}
                  data-testid={`btn-lang-${lang.code}`}
                >
                  {lang.label}
                </button>
                {index < LANGUAGES.length - 1 && <span className="opacity-40">|</span>}
              </span>
            ))}
          </div>

          <Button asChild variant="outline" className="border-[#F3D8A5] text-[#F3D8A5] hover:bg-[#F3D8A5] hover:text-[#0B3A36] rounded-none px-6 tracking-widest uppercase text-xs h-10">
            <Link href="/create-request">{t("header.submitRequest")}</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 z-50"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <div className={`lg:hidden fixed inset-0 bg-[#0B3A36] pt-24 px-6 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <nav className="flex flex-col gap-6 text-xl font-serif">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#F3D8A5] transition-colors pb-2 border-b border-[#072D2A]">
              {link.name}
            </Link>
          ))}
          <Link href="/favorites" className="flex items-center gap-3 hover:text-[#F3D8A5] transition-colors pb-2 border-b border-[#072D2A]">
            <Heart className="w-5 h-5" />
            {t("footer.favorites")}
            {favoritesCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-[#F3D8A5] text-[#0B3A36] text-xs font-bold">
                {favoritesCount}
              </span>
            )}
          </Link>
          <Link href="/create-request" className="text-[#F3D8A5] mt-4 font-sans font-medium text-base tracking-wider uppercase">
            {t("header.submitRequest")} →
          </Link>
        </nav>

        <div className="mt-12 flex gap-4 text-sm font-semibold tracking-wider border-t border-[#072D2A] pt-6">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              aria-pressed={language === lang.code}
              className={`cursor-pointer transition-colors ${
                language === lang.code ? "text-[#F3D8A5]" : "hover:text-[#F3D8A5]"
              }`}
              data-testid={`btn-lang-mobile-${lang.code}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
