"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPedidosHistorial } from "@/lib/pedidos";
import type { Pedido } from "@/types";

type Rango = "hoy" | "semana" | "mes" | "todo";

function tsMs(p: Pedido): number {
  if (!p.createdAt) return 0;
  if (typeof p.createdAt === "object" && "seconds" in p.createdAt) return p.createdAt.seconds * 1000;
  return p.createdAt;
}

function formatFecha(p: Pedido): string {
  const d = new Date(tsMs(p));
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "⏳ Pendiente",
  preparando: "👨‍🍳 Preparando",
  listo: "✅ Listo",
  entregado: "🎉 Entregado",
};

export default function StatsPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState<Rango>("hoy");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && !sessionStorage.getItem("admin_auth")) {
      router.replace("/admin/login");
      return;
    }
    getPedidosHistorial().then((data) => {
      setPedidos(data);
      setLoading(false);
    });
  }, []);

  const ahora = Date.now();
  const filtrarPorRango = (p: Pedido) => {
    const t = tsMs(p);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (rango === "hoy") return t >= hoy.getTime();
    if (rango === "semana") return t >= ahora - 7 * 86400000;
    if (rango === "mes") return t >= ahora - 30 * 86400000;
    return true;
  };

  const pedidosFiltrados = pedidos
    .filter(filtrarPorRango)
    .filter((p) => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return (
        p.mesaNombre?.toLowerCase().includes(q) ||
        p.camareroNombre?.toLowerCase().includes(q) ||
        String(p.numero).includes(q)
      );
    });

  const entregados = pedidosFiltrados.filter((p) => p.estado === "entregado");
  const ingresoTotal = entregados.reduce((acc, p) => acc + p.total, 0);

  // Ranking por mesa
  const porMesa: Record<string, { nombre: string; pedidos: number; ingresos: number }> = {};
  entregados.forEach((p) => {
    if (!porMesa[p.mesaId]) porMesa[p.mesaId] = { nombre: p.mesaNombre, pedidos: 0, ingresos: 0 };
    porMesa[p.mesaId].pedidos++;
    porMesa[p.mesaId].ingresos += p.total;
  });
  const rankingMesa = Object.values(porMesa).sort((a, b) => b.ingresos - a.ingresos);

  // Ranking por camarero
  const porCamarero: Record<string, { nombre: string; pedidos: number; ingresos: number }> = {};
  entregados.forEach((p) => {
    const key = p.camareroId ?? "sin_asignar";
    const nombre = p.camareroNombre ?? "Sin asignar";
    if (!porCamarero[key]) porCamarero[key] = { nombre, pedidos: 0, ingresos: 0 };
    porCamarero[key].pedidos++;
    porCamarero[key].ingresos += p.total;
  });
  const rankingCamarero = Object.values(porCamarero).sort((a, b) => b.pedidos - a.pedidos);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-400">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <a href="/admin" className="text-amber-200 text-sm">← Admin</a>
          <h1 className="text-xl font-bold mt-1">Estadísticas</h1>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem("admin_auth"); router.replace("/admin/login"); }}
          className="text-amber-200 text-sm hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          {(["hoy", "semana", "mes", "todo"] as Rango[]).map((r) => (
            <button
              key={r}
              onClick={() => setRango(r)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${rango === r ? "bg-amber-600 text-white" : "bg-white border border-stone-200 text-stone-600"}`}
            >
              {r === "hoy" ? "Hoy" : r === "semana" ? "7 días" : r === "mes" ? "30 días" : "Todo"}
            </button>
          ))}
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar mesa, camarero, nº..."
            className="ml-auto border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 w-48"
          />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pedidos totales", value: pedidosFiltrados.length, color: "text-stone-800" },
            { label: "Entregados", value: entregados.length, color: "text-green-700" },
            { label: "Ingresos", value: ingresoTotal.toLocaleString("fr-FR") + " FCFA", color: "text-amber-600" },
            { label: "Ticket medio", value: entregados.length ? Math.round(ingresoTotal / entregados.length).toLocaleString("fr-FR") + " FCFA" : "—", color: "text-stone-600" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-stone-400 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Rankings */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Ranking mesas */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="font-bold text-stone-700 mb-3">🪑 Ranking por mesa</h2>
            {rankingMesa.length === 0 ? (
              <p className="text-stone-400 text-sm">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {rankingMesa.map((m, i) => (
                  <div key={m.nombre} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600"><span className="font-bold text-stone-400 mr-2">#{i + 1}</span>{m.nombre}</span>
                    <div className="text-right">
                      <span className="font-semibold text-amber-600">{m.ingresos.toLocaleString("fr-FR")} FCFA</span>
                      <span className="text-stone-400 ml-2">({m.pedidos} pedidos)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranking camareros */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="font-bold text-stone-700 mb-3">👤 Ranking por camarero</h2>
            {rankingCamarero.length === 0 ? (
              <p className="text-stone-400 text-sm">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {rankingCamarero.map((c, i) => (
                  <div key={c.nombre} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600"><span className="font-bold text-stone-400 mr-2">#{i + 1}</span>{c.nombre}</span>
                    <div className="text-right">
                      <span className="font-semibold text-stone-700">{c.pedidos} pedidos</span>
                      <span className="text-amber-600 ml-2">{c.ingresos.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Historial de pedidos */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="font-bold text-stone-700 mb-4">📋 Historial de pedidos ({pedidosFiltrados.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-xs text-stone-400 uppercase tracking-wide">
                  <th className="pb-2 pr-4">Nº</th>
                  <th className="pb-2 pr-4">Mesa</th>
                  <th className="pb-2 pr-4">Artículos</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2 pr-4">Camarero</th>
                  <th className="pb-2 pr-4">Estado</th>
                  <th className="pb-2">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {pedidosFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="py-2 pr-4 font-bold text-stone-700">#{p.numero}</td>
                    <td className="py-2 pr-4 text-stone-600">{p.mesaNombre}</td>
                    <td className="py-2 pr-4 text-stone-500 max-w-[180px]">
                      <span className="truncate block">{p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}</span>
                    </td>
                    <td className="py-2 pr-4 font-semibold text-amber-600 whitespace-nowrap">{p.total.toLocaleString("fr-FR")} FCFA</td>
                    <td className="py-2 pr-4 text-stone-500">{p.camareroNombre ?? <span className="text-stone-300">—</span>}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.estado === "entregado" ? "bg-green-100 text-green-700" :
                        p.estado === "listo" ? "bg-blue-100 text-blue-700" :
                        p.estado === "preparando" ? "bg-yellow-100 text-yellow-700" :
                        "bg-stone-100 text-stone-500"
                      }`}>
                        {ESTADO_LABEL[p.estado] ?? p.estado}
                      </span>
                    </td>
                    <td className="py-2 text-stone-400 whitespace-nowrap text-xs">{formatFecha(p)}</td>
                  </tr>
                ))}
                {pedidosFiltrados.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-stone-400">Sin pedidos en este período</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
