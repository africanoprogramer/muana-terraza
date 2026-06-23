import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Banner } from "@/types";

export async function getBanners(): Promise<Banner[]> {
  const snap = await getDocs(collection(db, "banners"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Banner))
    .sort((a, b) => a.orden - b.orden);
}

export async function getBannersActivos(): Promise<Banner[]> {
  const all = await getBanners();
  return all.filter((b) => b.activo);
}

export async function addBanner(data: Omit<Banner, "id">) {
  return addDoc(collection(db, "banners"), data);
}

export async function updateBanner(id: string, data: Partial<Banner>) {
  return updateDoc(doc(db, "banners", id), data);
}

export async function deleteBanner(id: string) {
  return deleteDoc(doc(db, "banners", id));
}
