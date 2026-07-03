import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useT } from "@/i18n/useT";

interface PropertyMediaGalleryProps {
  images: string[];
  videos: string[];
}

type MediaItem = { type: "video" | "image"; url: string };

/** Property detail media viewer. Videos are listed first (and shown by default),
 *  with a dedicated horizontal scroll bar for videos and the usual thumbnail grid
 *  for photos. Both feed the same main viewer. */
export function PropertyMediaGallery({ images, videos }: PropertyMediaGalleryProps) {
  const { t } = useT();
  const media: MediaItem[] = [
    ...videos.map((url) => ({ type: "video" as const, url })),
    ...images.map((url) => ({ type: "image" as const, url })),
  ];
  const [current, setCurrent] = useState(0);
  const thumbStripRef = useRef<HTMLDivElement>(null);

  if (media.length === 0) return null;

  const index = Math.min(current, media.length - 1);
  const item = media[index];
  const poster = images[0];
  const go = (dir: -1 | 1) => setCurrent((prev) => (prev + dir + media.length) % media.length);
  const scrollThumbs = (dir: -1 | 1) =>
    thumbStripRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <div className="space-y-4">
      {/* Main viewer */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-lg bg-black group">
        {item.type === "video" ? (
          <video
            key={item.url}
            src={item.url}
            poster={poster}
            className="w-full h-full object-contain bg-black"
            controls
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={item.url}
            alt={t("gallery.imageAlt", { n: index + 1 })}
            className="w-full h-full object-cover transition-transform duration-500"
          />
        )}

        {media.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur text-[#0B3A36] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur text-[#0B3A36] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-xs tracking-wider z-10">
          {index + 1} / {media.length}
        </div>
      </div>

      {/* Videos: dedicated horizontal scroll bar */}
      {videos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {videos.map((url, i) => (
            <button
              key={url}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-36 sm:w-44 aspect-video rounded-sm overflow-hidden border-2 transition-colors bg-black ${
                index === i ? "border-[#0B3A36]" : "border-transparent hover:border-[#F3D8A5]"
              }`}
            >
              <video src={url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center">
                  <Play className="w-4 h-4 text-[#0B3A36] fill-current translate-x-[1px]" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Photos: single horizontal row with arrow navigation (no wrapping to
          multiple rows, keeps the gallery compact regardless of photo count). */}
      {images.length > 0 && (
        <div className="relative">
          <div
            ref={thumbStripRef}
            className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, i) => {
              const mediaIndex = videos.length + i;
              return (
                <button
                  key={i}
                  onClick={() => setCurrent(mediaIndex)}
                  className={`relative shrink-0 w-24 sm:w-28 aspect-[4/3] rounded-sm overflow-hidden border-2 transition-colors ${
                    index === mediaIndex ? "border-[#0B3A36]" : "border-transparent hover:border-[#F3D8A5]"
                  }`}
                >
                  <img src={img} alt={t("gallery.thumbnailAlt", { n: i + 1 })} className="w-full h-full object-cover" />
                  {index !== mediaIndex && <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />}
                </button>
              );
            })}
          </div>

          {images.length > 10 && (
            <>
              <button
                type="button"
                aria-label={t("common.previous")}
                onClick={() => scrollThumbs(-1)}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md text-[#0B3A36] flex items-center justify-center hover:bg-white transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label={t("common.next")}
                onClick={() => scrollThumbs(1)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md text-[#0B3A36] flex items-center justify-center hover:bg-white transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
