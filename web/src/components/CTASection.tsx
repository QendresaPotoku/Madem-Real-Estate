import { Link } from "wouter";
import { Button } from "./ui/button";

interface CTASectionProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonHref: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  theme?: "light" | "dark";
}

export function CTASection({
  title,
  subtitle,
  buttonText,
  buttonHref,
  secondaryButtonText,
  secondaryButtonHref,
  theme = "dark"
}: CTASectionProps) {
  const isDark = theme === "dark";
  
  return (
    <section className={`py-24 ${isDark ? "bg-[#0B3A36] text-white" : "bg-gray-50 text-[#0B3A36]"}`}>
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">{title}</h2>
        <p className={`text-lg mb-10 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className={`rounded-none px-8 tracking-widest uppercase ${
            isDark 
              ? "bg-[#F3D8A5] text-[#0B3A36] hover:bg-white" 
              : "bg-[#0B3A36] text-white hover:bg-[#072D2A]"
          }`}>
            <Link href={buttonHref}>{buttonText}</Link>
          </Button>
          
          {secondaryButtonText && secondaryButtonHref && (
            <Button asChild variant="outline" size="lg" className={`rounded-none px-8 tracking-widest uppercase ${
              isDark 
                ? "border-[#F3D8A5] text-[#F3D8A5] hover:bg-[#F3D8A5] hover:text-[#0B3A36]" 
                : "border-[#0B3A36] text-[#0B3A36] hover:bg-[#0B3A36] hover:text-white"
            }`}>
              <Link href={secondaryButtonHref}>{secondaryButtonText}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
