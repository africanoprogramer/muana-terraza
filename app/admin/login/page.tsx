"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin_auth", "1");
        router.replace("/admin/stats");
      } else {
        setError("Contraseña incorrecta");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-xl font-bold text-stone-800">Área de administración</h1>
          <p className="text-stone-500 text-sm mt-1">Muana Terraza Tía Leny</p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Contraseña de administrador"
            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </div>
        <a href="/admin" className="block text-center text-stone-400 text-sm hover:text-stone-600">
          ← Volver al admin
        </a>
      </div>
    </div>
  );
}
