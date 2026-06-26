import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/useT";

interface PropertyGalleryProps {
  images: string[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
  const { t } = useT();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-lg bg-gray-100 group">
        <img
          src={images[currentIndex]}
          alt={t("gallery.imageAlt", { n: currentIndex + 1 })}
          className="w-full h-full object-cover transition-transform duration-500"
        />
        
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur text-[#0B3A36] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur text-[#0B3A36] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-xs tracking-wider">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
      
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {images.map((img, index) => (
            <button 
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative aspect-[4/3] rounded-sm overflow-hidden border-2 transition-colors ${
                index === currentIndex ? "border-[#0B3A36]" : "border-transparent hover:border-[#F3D8A5]"
              }`}
            >
              <img src={img} alt={t("gallery.thumbnailAlt", { n: index + 1 })} className="w-full h-full object-cover" />
              {index !== currentIndex && <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
