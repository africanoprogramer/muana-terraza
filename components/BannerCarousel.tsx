"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@/types";

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setActivo((i) => (i + 1) % banners.length), 4000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative overflow-hidden" style={{ aspectRatio: "3/1" }}>
      {banners.map((b, i) => (
        <div
          key={b.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === activo ? 1 : 0 }}
        >
          <img src={b.imagen} alt={b.titulo ?? "Banner"} className="w-full h-full object-cover" />
          {(b.titulo || b.subtitulo) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
              {b.titulo && <p className="text-white font-bold text-base leading-tight">{b.titulo}</p>}
              {b.subtitulo && <p className="text-white/80 text-sm mt-0.5">{b.subtitulo}</p>}
            </div>
          )}
        </div>
      ))}

      {/* Indicadores */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setActivo(i)}
              className={`rounded-full transition-all ${i === activo ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
