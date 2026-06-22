"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { crearPedido } from "@/lib/pedidos";
import { suscribirMenu, getCategorias } from "@/lib/menu";
import { doc, getDoc } from "firebase/firestore";
import type { ItemMenu, Categoria, ItemPedido, Mesa } from "@/types";

interface CartItem extends ItemPedido {}

export default function MenuPage() {
  const { mesaId } = useParams<{ mesaId: string }>();
  const router = useRouter();

  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [items, setItems] = useState<ItemMenu[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string>("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mostrarCart, setMostrarCart] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "tables", mesaId)).then((snap) => {
      if (snap.exists()) setMesa({ id: snap.id, ...snap.data() } as Mesa);
    });
    getCategorias().then((cats) => {
      const activas = cats.filter((c) => c.activa);
      setCategorias(activas);
      if (activas.length > 0) setCategoriaActiva(activas[0].id);
    });
    const unsub = suscribirMenu(setItems);
    return unsub;
  }, [mesaId]);

  const addToCart = (item: ItemMenu) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.itemId === item.id ? { ...c, cantidad: c.cantidad + 1 } : c
        );
      }
      return [
        ...prev,
        { itemId: item.id, nombre: item.nombre, precio: item.precio, cantidad: 1 },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === itemId);
      if (!existing || existing.cantidad === 1) {
        return prev.filter((c) => c.itemId !== itemId);
      }
      return prev.map((c) =>
        c.itemId === itemId ? { ...c, cantidad: c.cantidad - 1 } : c
      );
    });
  };

  const getQty = (itemId: string) =>
    cart.find((c) => c.itemId === itemId)?.cantidad ?? 0;

  const total = cart.reduce((acc, c) => acc + c.precio * c.cantidad, 0);
  const totalItems = cart.reduce((acc, c) => acc + c.cantidad, 0);

  const handlePedir = async () => {
    if (cart.length === 0 || !mesa) return;
    setEnviando(true);
    try {
      const pedidoId = await crearPedido(mesa.id, mesa.nombre, cart, notas);
      router.push(`/pedido/${pedidoId}`);
    } catch (err) {
      console.error(err);
      setEnviando(false);
    }
  };

  const itemsFiltrados = items.filter((i) => i.categoriaId === categoriaActiva);

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Header */}
      <div className="bg-amber-600 text-white px-4 py-5 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">🌴 Muana Terraza Tía Leny</h1>
        {mesa && (
          <p className="text-amber-100 text-sm mt-0.5">{mesa.nombre}</p>
        )}
      </div>

      {/* Categorías */}
      <div className="flex gap-3 overflow-x-auto px-4 py-3 bg-white border-b border-stone-200 sticky top-[72px] z-10">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoriaActiva(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              categoriaActiva === cat.id
                ? "bg-amber-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {itemsFiltrados.length === 0 && (
          <p className="text-center text-stone-400 mt-12">Sin artículos disponibles</p>
        )}
        {itemsFiltrados.map((item) => {
          const qty = getQty(item.id);
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-stone-100 flex gap-3 p-3"
            >
              {item.imagen && (
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-stone-800 text-sm">{item.nombre}</h3>
                {item.descripcion && (
                  <p className="text-stone-500 text-xs mt-0.5 line-clamp-2">{item.descripcion}</p>
                )}
                <p className="text-amber-600 font-bold mt-1">{item.precio.toLocaleString("fr-FR")} FCFA</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                {qty === 0 ? (
                  <button
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-lg font-bold hover:bg-amber-700"
                  >
                    +
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-lg font-bold"
                    >
                      −
                    </button>
                    <span className="font-bold text-stone-800 text-sm">{qty}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-lg font-bold hover:bg-amber-700"
                    >
                      +
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notas */}
      {cart.length > 0 && (
        <div className="px-4 pb-2">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Alguna nota para tu pedido... (alergias, sin sal, etc.)"
            className="w-full border border-stone-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            rows={2}
          />
        </div>
      )}

      {/* Botón pedido fijo */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-lg">
          <button
            onClick={handlePedir}
            disabled={enviando}
            className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-between px-5 disabled:opacity-60"
          >
            <span className="bg-amber-500 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
              {totalItems}
            </span>
            <span>{enviando ? "Enviando pedido..." : "Pedir ahora"}</span>
            <span>{total.toLocaleString("fr-FR")} FCFA</span>
          </button>
        </div>
      )}
    </div>
  );
}
