"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { getMesas, addMesa, deleteMesa, updateMesa } from "@/lib/menu";
import type { Mesa } from "@/types";

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://muana-terraza.vercel.app";

export default function AdminMesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [nuevaMesa, setNuevaMesa] = useState({ numero: 1, nombre: "" });
  const [qrSeleccionado, setQrSeleccionado] = useState<Mesa | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);

  const cargar = async () => {
    const data = await getMesas();
    setMesas(data);
    if (data.length > 0) {
      setNuevaMesa((p) => ({ ...p, numero: data[data.length - 1].numero + 1 }));
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleAgregar = async () => {
    if (!nuevaMesa.nombre.trim() || agregando) return;
    setAgregando(true);
    await addMesa({ ...nuevaMesa, activa: true });
    setNuevaMesa((p) => ({ numero: p.numero + 1, nombre: "" }));
    await cargar();
    setAgregando(false);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta mesa?")) return;
    setEliminando(id);
    await deleteMesa(id);
    await cargar();
    setEliminando(null);
  };

  const handleToggle = async (mesa: Mesa) => {
    await updateMesa(mesa.id, { activa: !mesa.activa });
    await cargar();
  };

  const imprimirQR = (mesa: Mesa) => {
    const url = `${BASE_URL}/menu/${mesa.id}`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>QR ${mesa.nombre}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;gap:16px">
        <h2 style="margin:0">${mesa.nombre}</h2>
        <p style="margin:0;color:#888;font-size:14px">Escanea para ver el menú y pedir</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}" style="border-radius:12px"/>
        <p style="margin:0;font-size:12px;color:#aaa">${url}</p>
        <script>window.print()</script>
      </body></html>
    `);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-amber-600 text-white px-6 py-4">
        <a href="/admin" className="text-amber-200 text-sm">← Admin</a>
        <h1 className="text-xl font-bold mt-1">Mesas y códigos QR</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Agregar mesa */}
        <section className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="font-bold text-stone-700 mb-4">Añadir mesa</h2>
          <div className="flex gap-3">
            <input
              type="number"
              value={nuevaMesa.numero}
              onChange={(e) => setNuevaMesa((p) => ({ ...p, numero: parseInt(e.target.value) || 1 }))}
              placeholder="Nº"
              className="w-20 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              value={nuevaMesa.nombre}
              onChange={(e) => setNuevaMesa((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Nombre (ej. Mesa 1, Terraza A...)"
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
            />
            <button
              onClick={handleAgregar}
              disabled={agregando}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed min-w-[80px]"
            >
              {agregando ? "Añadiendo..." : "Añadir"}
            </button>
          </div>
        </section>

        {/* Lista de mesas */}
        <section>
          <h2 className="font-bold text-stone-700 mb-3">Mesas ({mesas.length})</h2>
          <div className="space-y-3">
            {mesas.map((mesa) => {
              const menuUrl = `${BASE_URL}/menu/${mesa.id}`;
              return (
                <div
                  key={mesa.id}
                  className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-4"
                >
                  {/* Mini QR */}
                  <div
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setQrSeleccionado(mesa)}
                    title="Ver QR grande"
                  >
                    <QRCode value={menuUrl} size={64} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800">{mesa.nombre}</p>
                    <p className="text-xs text-stone-400 truncate">{menuUrl}</p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(mesa)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium ${mesa.activa ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}
                    >
                      {mesa.activa ? "Activa" : "Inactiva"}
                    </button>
                    <button
                      onClick={() => imprimirQR(mesa)}
                      className="text-xs px-2 py-1 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200"
                    >
                      Imprimir
                    </button>
                    <button
                      onClick={() => handleEliminar(mesa.id)}
                      disabled={eliminando === mesa.id}
                      className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed min-w-[70px] text-center"
                    >
                      {eliminando === mesa.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              );
            })}
            {mesas.length === 0 && (
              <p className="text-center text-stone-400 py-8">Sin mesas creadas todavía</p>
            )}
          </div>
        </section>
      </div>

      {/* Modal QR grande */}
      {qrSeleccionado && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
          onClick={() => setQrSeleccionado(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-xl text-stone-800">{qrSeleccionado.nombre}</h2>
            <p className="text-stone-500 text-sm text-center">Escanea para ver el menú y hacer tu pedido</p>
            <QRCode
              value={`${BASE_URL}/menu/${qrSeleccionado.id}`}
              size={220}
            />
            <p className="text-xs text-stone-400 text-center break-all">
              {BASE_URL}/menu/{qrSeleccionado.id}
            </p>
            <button
              onClick={() => imprimirQR(qrSeleccionado)}
              className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700"
            >
              Imprimir QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
