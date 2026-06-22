"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
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
  const [agregandoCat, setAgregandoCat] = useState(false);
  const [catActiva, setCatActiva] = useState<string>("todas");
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [progresoImagen, setProgresoImagen] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!nuevaCategoria.trim() || agregandoCat) return;
    setAgregandoCat(true);
    try {
      await addCategoria({ nombre: nuevaCategoria.trim(), orden: categorias.length, activa: true });
      setNuevaCategoria("");
      await cargar();
    } finally {
      setAgregandoCat(false);
    }
  };

  const handleEliminarCategoria = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await deleteCategoria(id);
    await cargar();
  };

  const handleSeleccionarImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nombre = `menu/${Date.now()}_${file.name.replace(/\s/g, "_")}`;
    const storageRef = ref(storage, nombre);
    const tarea = uploadBytesResumable(storageRef, file);

    setSubiendoImagen(true);
    setProgresoImagen(0);

    tarea.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setProgresoImagen(pct);
      },
      (err) => {
        console.error("Error subiendo imagen:", err);
        setSubiendoImagen(false);
      },
      async () => {
        const url = await getDownloadURL(tarea.snapshot.ref);
        setEditando((p) => ({ ...p, imagen: url }));
        setSubiendoImagen(false);
        setProgresoImagen(0);
      }
    );
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
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium flex-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
              onKeyDown={(e) => e.key === "Enter" && handleAgregarCategoria()}
            />
            <button
              onClick={handleAgregarCategoria}
              disabled={agregandoCat}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 min-w-[90px]"
            >
              {agregandoCat ? "Añadiendo..." : "Añadir"}
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
              <div key={item.id} className="bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-3">
                {item.imagen ? (
                  <img src={item.imagen} alt={item.nombre} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0 text-xl">🍽️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 text-sm">{item.nombre}</p>
                  <p className="text-stone-400 text-xs truncate">{item.descripcion}</p>
                  <p className="text-amber-600 font-bold text-sm mt-0.5">{item.precio.toLocaleString("fr-FR")} FCFA</p>
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
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-stone-800">
              {editando.id ? "Editar artículo" : "Nuevo artículo"}
            </h3>
            <div className="space-y-3">
              <input
                value={editando.nombre ?? ""}
                onChange={(e) => setEditando((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del artículo"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <textarea
                value={editando.descripcion ?? ""}
                onChange={(e) => setEditando((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción (opcional)"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                rows={2}
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  value={editando.precio ?? 0}
                  onChange={(e) => setEditando((p) => ({ ...p, precio: parseFloat(e.target.value) || 0 }))}
                  placeholder="Precio"
                  className="w-1/2 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <select
                  value={editando.categoriaId ?? ""}
                  onChange={(e) => setEditando((p) => ({ ...p, categoriaId: e.target.value }))}
                  className="w-1/2 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Categoría...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Imagen */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Imagen</p>

                {/* Preview */}
                {editando.imagen && (
                  <div className="relative">
                    <img
                      src={editando.imagen}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setEditando((p) => ({ ...p, imagen: null }))}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Botón subir */}
                {!editando.imagen && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendoImagen}
                    className="w-full border-2 border-dashed border-stone-200 rounded-xl py-6 flex flex-col items-center gap-2 text-stone-400 hover:border-amber-400 hover:text-amber-500 transition-colors disabled:opacity-60"
                  >
                    {subiendoImagen ? (
                      <>
                        <span className="text-2xl">⏳</span>
                        <span className="text-sm font-medium">Subiendo... {progresoImagen}%</span>
                        <div className="w-32 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${progresoImagen}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">📷</span>
                        <span className="text-sm font-medium">Pulsa para subir imagen</span>
                        <span className="text-xs">JPG, PNG, WEBP</span>
                      </>
                    )}
                  </button>
                )}

                {/* Cambiar imagen si ya hay una */}
                {editando.imagen && !subiendoImagen && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-xs text-stone-500 hover:text-amber-600 py-1"
                  >
                    Cambiar imagen
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSeleccionarImagen}
                />
              </div>

              <input
                type="number"
                value={editando.orden ?? 0}
                onChange={(e) => setEditando((p) => ({ ...p, orden: parseInt(e.target.value) || 0 }))}
                placeholder="Orden de aparición"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                disabled={guardando || subiendoImagen}
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
