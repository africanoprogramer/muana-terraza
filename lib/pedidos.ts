import {
  collection,
  doc,
  runTransaction,
  onSnapshot,
  query,
  where,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ItemPedido, Pedido, EstadoPedido } from "@/types";

// Tiempo estimado por pedido en minutos
const MINUTOS_POR_PEDIDO = 5;

export async function crearPedido(
  mesaId: string,
  mesaNombre: string,
  items: ItemPedido[],
  notas: string
): Promise<string> {
  const contadorRef = doc(db, "counters", "pedidos");
  const pedidoRef = doc(collection(db, "orders"));

  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  await runTransaction(db, async (tx) => {
    const contadorSnap = await tx.get(contadorRef);
    const numero = (contadorSnap.exists() ? contadorSnap.data().count : 0) + 1;

    // Contar pedidos activos para estimar tiempo
    const pedidosActivosSnap = await tx.get(
      doc(db, "counters", "pedidos_activos")
    );
    const pedidosActivos = pedidosActivosSnap.exists()
      ? pedidosActivosSnap.data().count
      : 0;

    tx.set(contadorRef, { count: numero });
    tx.set(pedidoRef, {
      mesaId,
      mesaNombre,
      items,
      total,
      estado: "pendiente",
      numero,
      tiempoEstimado: (pedidosActivos + 1) * MINUTOS_POR_PEDIDO,
      notas,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  return pedidoRef.id;
}

export async function actualizarEstadoPedido(
  pedidoId: string,
  estado: EstadoPedido
) {
  await updateDoc(doc(db, "orders", pedidoId), {
    estado,
    updatedAt: Timestamp.now(),
  });
}

export function suscribirPedido(
  pedidoId: string,
  callback: (pedido: Pedido | null) => void
) {
  return onSnapshot(doc(db, "orders", pedidoId), (snap) => {
    if (!snap.exists()) return callback(null);
    callback({ id: snap.id, ...snap.data() } as Pedido);
  });
}

export function suscribirPedidosPendientes(
  callback: (pedidos: Pedido[]) => void
) {
  const q = query(
    collection(db, "orders"),
    where("estado", "in", ["pendiente", "preparando", "listo"])
  );
  return onSnapshot(q, (snap) => {
    const pedidos = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Pedido))
      .sort((a, b) => {
        const ta = a.createdAt && typeof a.createdAt === "object" && "seconds" in a.createdAt
          ? (a.createdAt as any).seconds : a.createdAt ?? 0;
        const tb = b.createdAt && typeof b.createdAt === "object" && "seconds" in b.createdAt
          ? (b.createdAt as any).seconds : b.createdAt ?? 0;
        return ta - tb;
      });
    callback(pedidos);
  });
}

export function calcularPosicion(pedidos: Pedido[], pedidoId: string) {
  const activos = pedidos.filter(
    (p) => p.estado === "pendiente" || p.estado === "preparando"
  );
  const idx = activos.findIndex((p) => p.id === pedidoId);
  const delante = idx === -1 ? 0 : idx;
  const tiempoEstimado = (delante + 1) * MINUTOS_POR_PEDIDO;
  return { posicion: idx + 1, delante, tiempoEstimado };
}
