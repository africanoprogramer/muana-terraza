import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Categoria, ItemMenu, Mesa } from "@/types";

// ─── Categorías ───────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<Categoria[]> {
  const q = query(collection(db, "categories"), orderBy("orden", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Categoria));
}

export async function addCategoria(data: Omit<Categoria, "id">) {
  return addDoc(collection(db, "categories"), data);
}

export async function updateCategoria(id: string, data: Partial<Categoria>) {
  return updateDoc(doc(db, "categories", id), data);
}

export async function deleteCategoria(id: string) {
  return deleteDoc(doc(db, "categories", id));
}

// ─── Items de menú ────────────────────────────────────────────────────────────

export async function getMenuItems(): Promise<ItemMenu[]> {
  const q = query(collection(db, "menu"), orderBy("orden", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ItemMenu));
}

export function suscribirMenu(callback: (items: ItemMenu[]) => void) {
  const q = query(
    collection(db, "menu"),
    where("disponible", "==", true),
    orderBy("orden", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ItemMenu)));
  });
}

export async function addMenuItem(data: Omit<ItemMenu, "id">) {
  return addDoc(collection(db, "menu"), data);
}

export async function updateMenuItem(id: string, data: Partial<ItemMenu>) {
  return updateDoc(doc(db, "menu", id), data);
}

export async function deleteMenuItem(id: string) {
  return deleteDoc(doc(db, "menu", id));
}

// ─── Mesas ────────────────────────────────────────────────────────────────────

export async function getMesas(): Promise<Mesa[]> {
  const q = query(collection(db, "tables"), orderBy("numero", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Mesa));
}

export async function addMesa(data: Omit<Mesa, "id">) {
  return addDoc(collection(db, "tables"), data);
}

export async function updateMesa(id: string, data: Partial<Mesa>) {
  return updateDoc(doc(db, "tables", id), data);
}

export async function deleteMesa(id: string) {
  return deleteDoc(doc(db, "tables", id));
}
