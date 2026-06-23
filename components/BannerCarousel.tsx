"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@/types";

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [activo, setActivo] = useState(0);
  const [detalle, setDetalle] = useState<Banner | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setActivo((i) => (i + 1) % banners.length), 4000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <>
      <div className="relative overflow-hidden cursor-pointer" style={{ aspectRatio: "3/1" }}>
        {banners.map((b, i) => (
          <div
            key={b.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === activo ? 1 : 0, pointerEvents: i === activo ? "auto" : "none" }}
            onClick={() => setDetalle(b)}
          >
            <img src={b.imagen} alt={b.titulo ?? "Banner"} className="w-full h-full object-cover" />
            {(b.titulo || b.subtitulo) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                {b.titulo && <p className="text-white font-bold text-base leading-tight">{b.titulo}</p>}
                {b.subtitulo && <p className="text-white/80 text-sm mt-0.5">{b.subtitulo}</p>}
                <p className="text-white/60 text-xs mt-1">Pulsa para ver más →</p>
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
                onClick={(e) => { e.stopPropagation(); setActivo(i); }}
                className={`rounded-full transition-all ${i === activo ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {detalle && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex flex-col overflow-y-auto"
          onClick={() => setDetalle(null)}
        >
          <div
            className="bg-white rounded-t-3xl mt-auto w-full max-w-lg mx-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen grande */}
            <div className="relative">
              <img
                src={detalle.imagen}
                alt={detalle.titulo ?? "Banner"}
                className="w-full object-cover"
                style={{ maxHeight: "55vw", minHeight: 180 }}
              />
              <button
                onClick={() => setDetalle(null)}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-black/70"
              >
                ×
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-3">
              {detalle.titulo && (
                <h2 className="text-2xl font-bold text-stone-800 leading-tight">{detalle.titulo}</h2>
              )}
              {detalle.subtitulo && (
                <p className="text-amber-600 font-semibold text-base">{detalle.subtitulo}</p>
              )}
              {detalle.descripcion && (
                <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{detalle.descripcion}</p>
              )}
              {!detalle.descripcion && !detalle.titulo && !detalle.subtitulo && (
                <p className="text-stone-400 text-sm text-center py-4">Sin descripción</p>
              )}
              <button
                onClick={() => setDetalle(null)}
                className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 mt-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
