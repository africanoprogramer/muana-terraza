"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { suscribirPedidosPendientes, actualizarEstadoPedido } from "@/lib/pedidos";
import type { Pedido, EstadoPedido } from "@/types";

const ESTADOS: { estado: EstadoPedido; label: string; color: string }[] = [
  { estado: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { estado: "preparando", label: "Preparando", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { estado: "listo", label: "Listo", color: "bg-green-100 text-green-800 border-green-200" },
  { estado: "entregado", label: "Entregado", color: "bg-stone-100 text-stone-500 border-stone-200" },
];

const SIGUIENTE: Partial<Record<EstadoPedido, EstadoPedido>> = {
  pendiente: "preparando",
  preparando: "listo",
  listo: "entregado",
};

const COLOR_CARD: Record<EstadoPedido, string> = {
  pendiente: "border-yellow-300",
  preparando: "border-blue-400",
  listo: "border-green-400",
  entregado: "border-stone-200 opacity-60",
};

function tiempoTranscurrido(createdAt: number) {
  const minutos = Math.floor((Date.now() - createdAt) / 60000);
  if (minutos < 1) return "Ahora mismo";
  if (minutos === 1) return "Hace 1 min";
  return `Hace ${minutos} min`;
}

export default function StaffPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [actualizando, setActualizando] = useState<string | null>(null);

  useEffect(() => {
    const unsub = suscribirPedidosPendientes(setPedidos);
    return unsub;
  }, []);

  const avanzarEstado = async (pedido: Pedido) => {
    const siguiente = SIGUIENTE[pedido.estado];
    if (!siguiente) return;
    setActualizando(pedido.id);
    await actualizarEstadoPedido(pedido.id, siguiente);
    setActualizando(null);
  };

  const pendientes = pedidos.filter((p) => p.estado === "pendiente");
  const preparando = pedidos.filter((p) => p.estado === "preparando");
  const listos = pedidos.filter((p) => p.estado === "listo");

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold">Panel de Pedidos</h1>
          <p className="text-amber-100 text-sm">Muana Terraza Tía Leny</p>
        </div>
        <div className="bg-amber-500 rounded-full px-3 py-1 text-sm font-bold">
          {pendientes.length + preparando.length + listos.length} activos
        </div>
      </div>

      {/* Columnas Kanban */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Columna: Pendientes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📋</span>
            <h2 className="font-bold text-stone-700">Pendientes</h2>
            <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendientes.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendientes.map((p) => (
              <TarjetaPedido
                key={p.id}
                pedido={p}
                onAvanzar={() => avanzarEstado(p)}
                cargando={actualizando === p.id}
                accionLabel="→ En cocina"
              />
            ))}
            {pendientes.length === 0 && (
              <p className="text-stone-400 text-sm text-center py-8">Sin pedidos pendientes</p>
            )}
          </div>
        </div>

        {/* Columna: Preparando */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">👨‍🍳</span>
            <h2 className="font-bold text-stone-700">En cocina</h2>
            <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {preparando.length}
            </span>
          </div>
          <div className="space-y-3">
            {preparando.map((p) => (
              <TarjetaPedido
                key={p.id}
                pedido={p}
                onAvanzar={() => avanzarEstado(p)}
                cargando={actualizando === p.id}
                accionLabel="✅ Marcar listo"
              />
            ))}
            {preparando.length === 0 && (
              <p className="text-stone-400 text-sm text-center py-8">Cocina libre</p>
            )}
          </div>
        </div>

        {/* Columna: Listos */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🛎️</span>
            <h2 className="font-bold text-stone-700">Para entregar</h2>
            <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {listos.length}
            </span>
          </div>
          <div className="space-y-3">
            {listos.map((p) => (
              <TarjetaPedido
                key={p.id}
                pedido={p}
                onAvanzar={() => avanzarEstado(p)}
                cargando={actualizando === p.id}
                accionLabel="🎉 Entregado"
              />
            ))}
            {listos.length === 0 && (
              <p className="text-stone-400 text-sm text-center py-8">Sin pedidos listos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TarjetaPedido({
  pedido,
  onAvanzar,
  cargando,
  accionLabel,
}: {
  pedido: Pedido;
  onAvanzar: () => void;
  cargando: boolean;
  accionLabel: string;
}) {
  const createdMs =
    pedido.createdAt && typeof pedido.createdAt === "object" && "seconds" in pedido.createdAt
      ? (pedido.createdAt as any).seconds * 1000
      : pedido.createdAt;

  return (
    <div
      className={`bg-white rounded-2xl border-2 ${COLOR_CARD[pedido.estado]} shadow-sm p-4`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="font-bold text-lg text-stone-800">#{pedido.numero}</span>
          <p className="text-stone-500 text-xs">{pedido.mesaNombre}</p>
        </div>
        <span className="text-xs text-stone-400">{tiempoTranscurrido(createdMs)}</span>
      </div>
      <div className="space-y-1 mb-3">
        {pedido.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-stone-700">
              <span className="font-semibold">{item.cantidad}×</span> {item.nombre}
            </span>
          </div>
        ))}
      </div>
      {pedido.notas && (
        <p className="text-xs text-stone-500 italic bg-stone-50 rounded-lg px-2 py-1 mb-3">
          📝 {pedido.notas}
        </p>
      )}
      <div className="flex justify-between items-center">
        <span className="font-bold text-amber-600">{pedido.total.toLocaleString("fr-FR")} FCFA</span>
        <button
          onClick={onAvanzar}
          disabled={cargando}
          className="bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {cargando ? "..." : accionLabel}
        </button>
      </div>
    </div>
  );
}

