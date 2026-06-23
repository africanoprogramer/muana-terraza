"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getCamarerosAdmin, addCamarero, updateCamarero, deleteCamarero } from "@/lib/camareros";
import type { Camarero } from "@/types";

export default function AdminCamarerosPage() {
  const [camareros, setCamareros] = useState<Camarero[]>([]);
  const [nuevo, setNuevo] = useState({ nombre: "", codigo: "" });
  const [agregando, setAgregando] = useState(false);

  const cargar = async () => {
    setCamareros(await getCamarerosAdmin());
  };

  useEffect(() => { cargar(); }, []);

  const handleAgregar = async () => {
    if (!nuevo.nombre.trim() || !nuevo.codigo.trim() || agregando) return;
    setAgregando(true);
    try {
      const ref = await addCamarero({ nombre: nuevo.nombre.trim(), codigo: nuevo.codigo.trim(), activo: true });
      setCamareros((prev) => [...prev, { id: ref.id, ...nuevo, activo: true }].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevo({ nombre: "", codigo: "" });
    } finally {
      setAgregando(false);
    }
  };

  const handleToggle = async (c: Camarero) => {
    await updateCamarero(c.id, { activo: !c.activo });
    setCamareros((prev) => prev.map((x) => x.id === c.id ? { ...x, activo: !c.activo } : x));
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este camarero?")) return;
    await deleteCamarero(id);
    setCamareros((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-amber-600 text-white px-6 py-4">
        <a href="/admin" className="text-amber-200 text-sm">← Admin</a>
        <h1 className="text-xl font-bold mt-1">Camareros</h1>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6">
        <section className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="font-bold text-stone-700 mb-4">Añadir camarero</h2>
          <div className="space-y-3">
            <input
              value={nuevo.nombre}
              onChange={(e) => setNuevo((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Nombre"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              value={nuevo.codigo}
              onChange={(e) => setNuevo((p) => ({ ...p, codigo: e.target.value }))}
              placeholder="Código (ej. 1234)"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={handleAgregar}
              disabled={agregando}
              className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
            >
              {agregando ? "Añadiendo..." : "Añadir camarero"}
            </button>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-stone-700 mb-3">Camareros ({camareros.length})</h2>
          <div className="space-y-2">
            {camareros.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-sm flex-shrink-0">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-800 text-sm">{c.nombre}</p>
                  <p className="text-stone-400 text-xs">Código: {c.codigo}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(c)}
                    className={`text-xs px-2 py-1 rounded-lg font-medium ${c.activo ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}
                  >
                    {c.activo ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => handleEliminar(c.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {camareros.length === 0 && <p className="text-stone-400 text-sm text-center py-8">Sin camareros registrados</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
