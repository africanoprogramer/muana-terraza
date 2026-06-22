"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { suscribirPedido, suscribirPedidosPendientes, calcularPosicion } from "@/lib/pedidos";
import type { Pedido, EstadoPedido } from "@/types";

const PASOS: { estado: EstadoPedido; label: string; emoji: string }[] = [
  { estado: "pendiente", label: "Recibido", emoji: "📋" },
  { estado: "preparando", label: "En cocina", emoji: "👨‍🍳" },
  { estado: "listo", label: "Listo", emoji: "✅" },
  { estado: "entregado", label: "Entregado", emoji: "🎉" },
];

const PASO_IDX: Record<EstadoPedido, number> = {
  pendiente: 0,
  preparando: 1,
  listo: 2,
  entregado: 3,
};

export default function SeguimientoPedidoPage() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [todosPedidos, setTodosPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubPedido = suscribirPedido(pedidoId, (p) => {
      setPedido(p);
      setLoading(false);
    });
    const unsubTodos = suscribirPedidosPendientes(setTodosPedidos);
    return () => {
      unsubPedido();
      unsubTodos();
    };
  }, [pedidoId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-stone-400">
          <div className="text-4xl mb-3">⏳</div>
          <p>Cargando tu pedido...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Pedido no encontrado.</p>
      </div>
    );
  }

  const pasoActual = PASO_IDX[pedido.estado];
  const { posicion, delante, tiempoEstimado } = calcularPosicion(todosPedidos, pedidoId);
  const estaActivo = pedido.estado === "pendiente" || pedido.estado === "preparando";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-amber-600 text-white px-4 py-5">
        <p className="text-amber-100 text-sm">Muana Terraza Tía Leny</p>
        <h1 className="text-2xl font-bold mt-1">Pedido #{pedido.numero}</h1>
        <p className="text-amber-100 text-sm mt-0.5">{pedido.mesaNombre}</p>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">

        {/* Estado en tiempo real */}
        {estaActivo && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 text-center">
            <div className="text-5xl mb-3">
              {pedido.estado === "pendiente" ? "⏳" : "👨‍🍳"}
            </div>
            <h2 className="font-bold text-lg text-stone-800">
              {pedido.estado === "pendiente"
                ? "Tu pedido está en cola"
                : "¡Tu pedido se está preparando!"}
            </h2>
            <div className="mt-4 grid grid-cols-3 divide-x divide-stone-100">
              <div className="px-3">
                <p className="text-2xl font-bold text-amber-600">{posicion}</p>
                <p className="text-xs text-stone-400 mt-0.5">Tu posición</p>
              </div>
              <div className="px-3">
                <p className="text-2xl font-bold text-stone-700">{delante}</p>
                <p className="text-xs text-stone-400 mt-0.5">Pedidos delante</p>
              </div>
              <div className="px-3">
                <p className="text-2xl font-bold text-stone-700">~{tiempoEstimado}m</p>
                <p className="text-xs text-stone-400 mt-0.5">Tiempo aprox.</p>
              </div>
            </div>
          </div>
        )}

        {pedido.estado === "listo" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <div className="text-5xl mb-2">✅</div>
            <h2 className="font-bold text-lg text-green-700">¡Tu pedido está listo!</h2>
            <p className="text-green-600 text-sm mt-1">El camarero viene en camino.</p>
          </div>
        )}

        {pedido.estado === "entregado" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="font-bold text-lg text-amber-700">¡Buen provecho!</h2>
            <p className="text-amber-600 text-sm mt-1">Pedido entregado. Disfruta tu comida.</p>
          </div>
        )}

        {/* Barra de progreso */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
          <h3 className="font-semibold text-stone-700 mb-4 text-sm">Estado del pedido</h3>
          <div className="flex items-center">
            {PASOS.map((paso, idx) => (
              <div key={paso.estado} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                      idx <= pasoActual
                        ? "bg-amber-600 shadow-md"
                        : "bg-stone-100"
                    }`}
                  >
                    {paso.emoji}
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      idx <= pasoActual ? "text-amber-600" : "text-stone-400"
                    }`}
                  >
                    {paso.label}
                  </p>
                </div>
                {idx < PASOS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-1 rounded transition-all ${
                      idx < pasoActual ? "bg-amber-600" : "bg-stone-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
          <h3 className="font-semibold text-stone-700 mb-3 text-sm">Tu pedido</h3>
          <div className="space-y-2">
            {pedido.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-stone-700">
                  {item.cantidad}× {item.nombre}
                </span>
                <span className="font-medium text-stone-800">
                  {(item.precio * item.cantidad).toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            ))}
            {pedido.notas && (
              <p className="text-xs text-stone-400 mt-2 italic">📝 {pedido.notas}</p>
            )}
          </div>
          <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-amber-600">{pedido.total.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
