"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getConfig, saveConfig } from "@/lib/config";

const EMOJIS = ["🌴", "🍽️", "🌿", "🥂", "🍹", "🏖️", "🔥", "⭐", "🎶", "🍃"];

export default function AdminConfigPage() {
  const [nombre, setNombre] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [emoji, setEmoji] = useState("🌴");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    getConfig().then((c) => {
      setNombre(c.nombre);
      setSubtitulo(c.subtitulo);
      setEmoji(c.emoji);
    });
  }, []);

  const handleGuardar = async () => {
    if (!nombre.trim() || guardando) return;
    setGuardando(true);
    try {
      await saveConfig({ nombre: nombre.trim(), subtitulo: subtitulo.trim(), emoji });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-amber-600 text-white px-6 py-4">
        <a href="/admin" className="text-amber-200 text-sm">← Admin</a>
        <h1 className="text-xl font-bold mt-1">Configuración del restaurante</h1>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6">

        {/* Preview */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-stone-100">
          <div className="bg-amber-600 text-white px-4 py-5">
            <h1 className="text-xl font-bold">{emoji} {nombre || "Nombre del restaurante"}</h1>
            {subtitulo && <p className="text-amber-100 text-sm mt-0.5">{subtitulo}</p>}
          </div>
          <div className="bg-white px-4 py-3 text-xs text-stone-400 text-center">
            Así se verá la cabecera en el menú del cliente
          </div>
        </div>

        {/* Formulario */}
        <section className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
          <h2 className="font-bold text-stone-700">Datos del establecimiento</h2>

          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
              Emoji / icono
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${
                    emoji === e ? "border-amber-500 bg-amber-50" : "border-stone-100 bg-stone-50 hover:border-stone-300"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
              Nombre del restaurante *
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Muana Terraza Tía Leny"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
              Subtítulo (opcional)
            </label>
            <input
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Ej: Mesa 3 · Terraza exterior"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <p className="text-xs text-stone-400 mt-1">El nombre de la mesa se añade automáticamente junto a este subtítulo.</p>
          </div>

          <button
            onClick={handleGuardar}
            disabled={!nombre.trim() || guardando}
            className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {guardando ? "Guardando..." : guardado ? "✅ Guardado correctamente" : "Guardar cambios"}
          </button>
        </section>
      </div>
    </div>
  );
}
