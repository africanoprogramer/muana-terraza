"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  getCategorias,
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addCategoria,
  deleteCategoria,
} from "@/lib/menu";
import type { Categoria, ItemMenu } from "@/types";

const ITEM_VACIO: Omit<ItemMenu, "id"> = {
  nombre: "",
  descripcion: "",
  precio: 0,
  categoriaId: "",
  imagen: null,
  disponible: true,
  orden: 0,
};

export default function AdminMenuPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [items, setItems] = useState<ItemMenu[]>([]);
  const [editando, setEditando] = useState<Partial<ItemMenu> | null>(null);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [catActiva, setCatActiva] = useState<string>("todas");

  const cargar = async () => {
    const [cats, menuItems] = await Promise.all([getCategorias(), getMenuItems()]);
    setCategorias(cats);
    setItems(menuItems);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleGuardar = async () => {
    if (!editando?.nombre || !editando.categoriaId) return;
    setGuardando(true);
    try {
      if (editando.id) {
        const { id, ...data } = editando as ItemMenu;
        await updateMenuItem(id, data);
      } else {
        await addMenuItem(editando as Omit<ItemMenu, "id">);
      }
      setEditando(null);
      await cargar();
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    await deleteMenuItem(id);
    await cargar();
  };

  const handleAgregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    await addCategoria({
      nombre: nuevaCategoria.trim(),
      orden: categorias.length,
      activa: true,
    });
    setNuevaCategoria("");
    await cargar();
  };

  const handleEliminarCategoria = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await deleteCategoria(id);
    await cargar();
  };

  const itemsFiltrados =
    catActiva === "todas" ? items : items.filter((i) => i.categoriaId === catActiva);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-amber-600 text-white px-6 py-4">
        <a href="/admin" className="text-amber-200 text-sm">← Admin</a>
        <h1 className="text-xl font-bold mt-1">Gestión del menú</h1>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">

        {/* Categorías */}
        <section>
          <h2 className="font-bold text-stone-700 mb-3">Categorías</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-sm">
                <span>{cat.nombre}</span>
                <button
                  onClick={() => handleEliminarCategoria(cat.id)}
                  className="text-red-400 hover:text-red-600 ml-1 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              placeholder="Nueva categoría..."
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
              onKeyDown={(e) => e.key === "Enter" && handleAgregarCategoria()}
            />
            <button
              onClick={handleAgregarCategoria}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700"
            >
              Añadir
            </button>
          </div>
        </section>

        {/* Lista de artículos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-stone-700">Artículos</h2>
            <button
              onClick={() => setEditando({ ...ITEM_VACIO })}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700"
            >
              + Añadir artículo
            </button>
          </div>

          {/* Filtro por categoría */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => setCatActiva("todas")}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${catActiva === "todas" ? "bg-amber-600 text-white" : "bg-white border border-stone-200 text-stone-600"}`}
            >
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatActiva(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${catActiva === cat.id ? "bg-amber-600 text-white" : "bg-white border border-stone-200 text-stone-600"}`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {itemsFiltrados.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-3"
              >
                {item.imagen && (
                  <img src={item.imagen} alt={item.nombre} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 text-sm">{item.nombre}</p>
                  <p className="text-stone-400 text-xs truncate">{item.descripcion}</p>
                  <p className="text-amber-600 font-bold text-sm mt-0.5">{item.precio.toFixed(2)} €</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => updateMenuItem(item.id, { disponible: !item.disponible }).then(cargar)}
                    className={`text-xs px-2 py-1 rounded-lg font-medium ${item.disponible ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}
                  >
                    {item.disponible ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => setEditando({ ...item })}
                    className="text-xs px-2 py-1 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(item.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal de edición */}
      {editando !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg text-stone-800">
              {editando.id ? "Editar artículo" : "Nuevo artículo"}
            </h3>
            <div className="space-y-3">
              <input
                value={editando.nombre ?? ""}
                onChange={(e) => setEditando((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del artículo"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <textarea
                value={editando.descripcion ?? ""}
                onChange={(e) => setEditando((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción (opcional)"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                rows={2}
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  value={editando.precio ?? 0}
                  onChange={(e) => setEditando((p) => ({ ...p, precio: parseFloat(e.target.value) || 0 }))}
                  placeholder="Precio"
                  className="w-1/2 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <select
                  value={editando.categoriaId ?? ""}
                  onChange={(e) => setEditando((p) => ({ ...p, categoriaId: e.target.value }))}
                  className="w-1/2 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Categoría...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <input
                value={editando.imagen ?? ""}
                onChange={(e) => setEditando((p) => ({ ...p, imagen: e.target.value || null }))}
                placeholder="URL de imagen (opcional)"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                type="number"
                value={editando.orden ?? 0}
                onChange={(e) => setEditando((p) => ({ ...p, orden: parseInt(e.target.value) || 0 }))}
                placeholder="Orden de aparición"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditando(null)}
                className="flex-1 border border-stone-200 py-2.5 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
