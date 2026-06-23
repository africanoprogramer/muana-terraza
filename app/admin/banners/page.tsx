"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { getBanners, addBanner, updateBanner, deleteBanner } from "@/lib/banners";
import type { Banner } from "@/types";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [nuevo, setNuevo] = useState({ titulo: "", subtitulo: "", descripcion: "", imagen: "", orden: 0, activo: true });
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputEditRef = useRef<HTMLInputElement>(null);
  const [editando, setEditando] = useState<Banner | null>(null);
  const [subiendoEdit, setSubiendoEdit] = useState(false);
  const [progresoEdit, setProgresoEdit] = useState(0);

  const cargar = async () => setBanners(await getBanners());

  useEffect(() => { cargar(); }, []);

  const subirImagen = (
    file: File,
    onProgress: (p: number) => void,
    onDone: (url: string) => void,
    onError: () => void
  ) => {
    const storageRef = ref(storage, `banners/${Date.now()}_${file.name.replace(/\s/g, "_")}`);
    const tarea = uploadBytesResumable(storageRef, file);
    tarea.on("state_changed",
      (snap) => onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      onError,
      async () => onDone(await getDownloadURL(tarea.snapshot.ref))
    );
  };

  const handleSeleccionarImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoImagen(true);
    setProgreso(0);
    subirImagen(file, setProgreso, (url) => {
      setNuevo((p) => ({ ...p, imagen: url }));
      setSubiendoImagen(false);
    }, () => setSubiendoImagen(false));
  };

  const handleSeleccionarImagenEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editando) return;
    setSubiendoEdit(true);
    setProgresoEdit(0);
    subirImagen(file, setProgresoEdit, (url) => {
      setEditando((p) => p ? { ...p, imagen: url } : p);
      setSubiendoEdit(false);
    }, () => setSubiendoEdit(false));
  };

  const handleGuardar = async () => {
    if (!nuevo.imagen || guardando) return;
    setGuardando(true);
    try {
      const ref = await addBanner({ ...nuevo, orden: banners.length });
      setBanners((prev) => [...prev, { id: ref.id, ...nuevo, orden: banners.length }]);
      setNuevo({ titulo: "", subtitulo: "", descripcion: "", imagen: "", orden: 0, activo: true });
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarEdit = async () => {
    if (!editando) return;
    await updateBanner(editando.id, editando);
    setBanners((prev) => prev.map((b) => b.id === editando.id ? editando : b));
    setEditando(null);
  };

  const handleToggle = async (b: Banner) => {
    await updateBanner(b.id, { activo: !b.activo });
    setBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, activo: !b.activo } : x));
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este banner?")) return;
    await deleteBanner(id);
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-amber-600 text-white px-6 py-4">
        <a href="/admin" className="text-amber-200 text-sm">← Admin</a>
        <h1 className="text-xl font-bold mt-1">Banners publicitarios</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Nuevo banner */}
        <section className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
          <h2 className="font-bold text-stone-700">Añadir banner</h2>

          {/* Zona imagen */}
          {nuevo.imagen ? (
            <div className="relative">
              <img src={nuevo.imagen} alt="Preview" className="w-full h-44 object-cover rounded-xl" />
              <button
                onClick={() => setNuevo((p) => ({ ...p, imagen: "" }))}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/80"
              >×</button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoImagen}
              className="w-full border-2 border-dashed border-stone-200 rounded-xl py-8 flex flex-col items-center gap-2 text-stone-400 hover:border-amber-400 hover:text-amber-500 transition-colors disabled:opacity-60"
            >
              {subiendoImagen ? (
                <>
                  <span className="text-2xl">⏳</span>
                  <span className="text-sm font-medium">Subiendo... {progreso}%</span>
                  <div className="w-32 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progreso}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <span className="text-3xl">🖼️</span>
                  <span className="text-sm font-medium">Pulsa para subir imagen del banner</span>
                  <span className="text-xs">Recomendado: 1200 × 400 px</span>
                </>
              )}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSeleccionarImagen} />

          <input
            value={nuevo.titulo}
            onChange={(e) => setNuevo((p) => ({ ...p, titulo: e.target.value }))}
            placeholder="Título (opcional)"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            value={nuevo.subtitulo}
            onChange={(e) => setNuevo((p) => ({ ...p, subtitulo: e.target.value }))}
            placeholder="Subtítulo (opcional)"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <textarea
            value={nuevo.descripcion}
            onChange={(e) => setNuevo((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Descripción / texto del anuncio (opcional) — el cliente lo verá al pulsar el banner"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            rows={3}
          />
          <button
            onClick={handleGuardar}
            disabled={!nuevo.imagen || guardando || subiendoImagen}
            className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar banner"}
          </button>
        </section>

        {/* Lista banners */}
        <section>
          <h2 className="font-bold text-stone-700 mb-3">Banners ({banners.length})</h2>
          <div className="space-y-3">
            {banners.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <div className="relative h-32">
                  <img src={b.imagen} alt={b.titulo ?? "Banner"} className="w-full h-full object-cover" />
                  {(b.titulo || b.subtitulo) && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3">
                      {b.titulo && <p className="text-white font-bold text-sm">{b.titulo}</p>}
                      {b.subtitulo && <p className="text-white/80 text-xs">{b.subtitulo}</p>}
                    </div>
                  )}
                </div>
                <div className="p-3 flex gap-2 justify-end">
                  <button
                    onClick={() => handleToggle(b)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium ${b.activo ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}
                  >
                    {b.activo ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => setEditando(b)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(b.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {banners.length === 0 && <p className="text-stone-400 text-sm text-center py-8">Sin banners todavía</p>}
          </div>
        </section>
      </div>

      {/* Modal editar */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg text-stone-800">Editar banner</h3>
            <div className="relative h-36 rounded-xl overflow-hidden">
              <img src={editando.imagen} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => fileInputEditRef.current?.click()}
                disabled={subiendoEdit}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-black/80 disabled:opacity-60"
              >
                {subiendoEdit ? `Subiendo ${progresoEdit}%` : "Cambiar imagen"}
              </button>
            </div>
            <input ref={fileInputEditRef} type="file" accept="image/*" className="hidden" onChange={handleSeleccionarImagenEdit} />
            <input
              value={editando.titulo ?? ""}
              onChange={(e) => setEditando((p) => p ? { ...p, titulo: e.target.value } : p)}
              placeholder="Título (opcional)"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              value={editando.subtitulo ?? ""}
              onChange={(e) => setEditando((p) => p ? { ...p, subtitulo: e.target.value } : p)}
              placeholder="Subtítulo (opcional)"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <textarea
              value={editando.descripcion ?? ""}
              onChange={(e) => setEditando((p) => p ? { ...p, descripcion: e.target.value } : p)}
              placeholder="Descripción / texto del anuncio (opcional)"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => setEditando(null)} className="flex-1 border border-stone-200 py-2.5 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50">Cancelar</button>
              <button onClick={handleGuardarEdit} disabled={subiendoEdit} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
