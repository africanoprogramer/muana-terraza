import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Camarero } from "@/types";

export async function getCamareros(): Promise<Camarero[]> {
  const snap = await getDocs(collection(db, "camareros"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Camarero))
    .filter((c) => c.activo)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function getCamarerosAdmin(): Promise<Camarero[]> {
  const snap = await getDocs(collection(db, "camareros"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Camarero))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function addCamarero(data: Omit<Camarero, "id">) {
  return addDoc(collection(db, "camareros"), data);
}

export async function updateCamarero(id: string, data: Partial<Camarero>) {
  return updateDoc(doc(db, "camareros", id), data);
}

export async function deleteCamarero(id: string) {
  return deleteDoc(doc(db, "camareros", id));
}
