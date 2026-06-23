"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { suscribirPedidosPendientes, actualizarEstadoPedido } from "@/lib/pedidos";
import { getCamareros } from "@/lib/camareros";
import type { Pedido, EstadoPedido, Camarero } from "@/types";

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

function tiempoTranscurrido(createdAt: any) {
  const ts = createdAt?.seconds ? createdAt.seconds * 1000 : createdAt;
  const minutos = Math.floor((Date.now() - ts) / 60000);
  if (minutos < 1) return "Ahora mismo";
  if (minutos === 1) return "Hace 1 min";
  return `Hace ${minutos} min`;
}

export default function StaffPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [camareros, setCamareros] = useState<Camarero[]>([]);
  const [camareroActivo, setCamareroActivo] = useState<Camarero | null>(null);
  const [cargandoCamareros, setCargandoCamareros] = useState(true);

  useEffect(() => {
    // Recuperar camarero de sesión
    const saved = sessionStorage.getItem("staff_camarero");
    if (saved) {
      try { setCamareroActivo(JSON.parse(saved)); } catch {}
    }
    getCamareros().then((data) => {
      setCamareros(data);
      setCargandoCamareros(false);
    });
    const unsub = suscribirPedidosPendientes(setPedidos);
    return unsub;
  }, []);

  const seleccionarCamarero = (c: Camarero) => {
    setCamareroActivo(c);
    sessionStorage.setItem("staff_camarero", JSON.stringify(c));
  };

  const cerrarSesion = () => {
    setCamareroActivo(null);
    sessionStorage.removeItem("staff_camarero");
  };

  const avanzarEstado = async (pedido: Pedido) => {
    const siguiente = SIGUIENTE[pedido.estado];
    if (!siguiente) return;
    setActualizando(pedido.id);
    await actualizarEstadoPedido(pedido.id, siguiente, camareroActivo ?? undefined);
    setActualizando(null);
  };

  const pendientes = pedidos.filter((p) => p.estado === "pendiente");
  const preparando = pedidos.filter((p) => p.estado === "preparando");
  const listos = pedidos.filter((p) => p.estado === "listo");

  // Pantalla de selección de camarero
  if (!camareroActivo) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <div className="bg-amber-600 text-white px-6 py-4">
          <h1 className="text-xl font-bold">Panel de Pedidos</h1>
          <p className="text-amber-100 text-sm">Muana Terraza Tía Leny</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">👋</div>
              <h2 className="text-xl font-bold text-stone-800">¿Quién eres?</h2>
              <p className="text-stone-500 text-sm mt-1">Selecciona tu nombre para continuar</p>
            </div>
            {cargandoCamareros ? (
              <p className="text-center text-stone-400">Cargando...</p>
            ) : camareros.length === 0 ? (
              <div className="text-center text-stone-400 text-sm">
                <p>No hay camareros registrados.</p>
                <a href="/admin/camareros" className="text-amber-600 underline mt-2 block">Ir al admin →</a>
              </div>
            ) : (
              camareros.map((c) => (
                <button
                  key={c.id}
                  onClick={() => seleccionarCamarero(c)}
                  className="w-full bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-400 hover:bg-amber-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-lg flex-shrink-0">
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">{c.nombre}</p>
                    <p className="text-stone-400 text-xs">Código: {c.codigo}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold">Panel de Pedidos</h1>
          <p className="text-amber-100 text-sm">
            {camareroActivo.nombre} · {pendientes.length + preparando.length + listos.length} activos
          </p>
        </div>
        <button onClick={cerrarSesion} className="text-amber-200 text-sm hover:text-white">
          Cambiar
        </button>
      </div>

      {/* Columnas Kanban */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Columna titulo="Pendientes" emoji="📋" color="bg-yellow-200 text-yellow-800" pedidos={pendientes} accionLabel="→ Preparando" actualizando={actualizando} onAvanzar={avanzarEstado} />
        <Columna titulo="Preparando" emoji="👨‍🍳" color="bg-blue-200 text-blue-800" pedidos={preparando} accionLabel="✅ Marcar listo" actualizando={actualizando} onAvanzar={avanzarEstado} />
        <Columna titulo="Para entregar" emoji="🛎️" color="bg-green-200 text-green-800" pedidos={listos} accionLabel="🎉 Entregado" actualizando={actualizando} onAvanzar={avanzarEstado} />
      </div>
    </div>
  );
}

function Columna({ titulo, emoji, color, pedidos, accionLabel, actualizando, onAvanzar }: {
  titulo: string; emoji: string; color: string;
  pedidos: Pedido[]; accionLabel: string;
  actualizando: string | null; onAvanzar: (p: Pedido) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{emoji}</span>
        <h2 className="font-bold text-stone-700">{titulo}</h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{pedidos.length}</span>
      </div>
      <div className="space-y-3">
        {pedidos.map((p) => (
          <TarjetaPedido key={p.id} pedido={p} onAvanzar={() => onAvanzar(p)} cargando={actualizando === p.id} accionLabel={accionLabel} />
        ))}
        {pedidos.length === 0 && <p className="text-stone-400 text-sm text-center py-8">—</p>}
      </div>
    </div>
  );
}

function TarjetaPedido({ pedido, onAvanzar, cargando, accionLabel }: {
  pedido: Pedido; onAvanzar: () => void; cargando: boolean; accionLabel: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border-2 ${COLOR_CARD[pedido.estado]} shadow-sm p-4`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="font-bold text-lg text-stone-800">#{pedido.numero}</span>
          <p className="text-stone-500 text-xs">{pedido.mesaNombre}</p>
          {pedido.camareroNombre && (
            <p className="text-amber-600 text-xs font-medium">👤 {pedido.camareroNombre}</p>
          )}
        </div>
        <span className="text-xs text-stone-400">{tiempoTranscurrido(pedido.createdAt)}</span>
      </div>
      <div className="space-y-1 mb-3">
        {pedido.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-stone-700"><span className="font-semibold">{item.cantidad}×</span> {item.nombre}</span>
          </div>
        ))}
      </div>
      {pedido.notas && (
        <p className="text-xs text-stone-500 italic bg-stone-50 rounded-lg px-2 py-1 mb-3">📝 {pedido.notas}</p>
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
