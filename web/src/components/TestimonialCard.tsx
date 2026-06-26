import { Testimonial } from "@/data/testimonials";
import { Star } from "lucide-react";
import { useT } from "@/i18n/useT";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { tx } = useT();
  return (
    <div className="bg-white p-8 md:p-10 border border-gray-100 rounded-lg shadow-sm hover:shadow-lg transition-all">
      <div className="flex gap-1 mb-6 text-[#F3D8A5]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? "fill-current" : "opacity-30"}`} />
        ))}
      </div>
      
      <blockquote className="text-lg text-gray-700 italic mb-8 min-h-[100px]">
        "{tx(testimonial.content)}"
      </blockquote>
      
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="font-serif font-bold text-gray-900">{testimonial.name}</h4>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{tx(testimonial.role)}, {testimonial.city}</p>
        </div>
      </div>
    </div>
  );
}
