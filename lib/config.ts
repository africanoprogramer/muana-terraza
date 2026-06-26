import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface RestaurantConfig {
  nombre: string;
  subtitulo: string;
  emoji: string;
}

const CONFIG_DOC = doc(db, "config", "general");

const defaults: RestaurantConfig = {
  nombre: "Muana Terraza Tía Leny",
  subtitulo: "",
  emoji: "🌴",
};

export async function getConfig(): Promise<RestaurantConfig> {
  const snap = await getDoc(CONFIG_DOC);
  if (!snap.exists()) return defaults;
  return { ...defaults, ...snap.data() } as RestaurantConfig;
}

export async function saveConfig(data: Partial<RestaurantConfig>) {
  await setDoc(CONFIG_DOC, data, { merge: true });
}
