import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-stone-800">Administración</h1>
        <p className="text-stone-500 mt-1">Muana Terraza Tía Leny</p>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link href="/admin/menu" className="block text-center bg-amber-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-amber-700 transition-colors">
          🍽️ Gestionar menú
        </Link>
        <Link href="/admin/mesas" className="block text-center bg-stone-700 text-white py-3 px-6 rounded-xl font-semibold hover:bg-stone-800 transition-colors">
          🪑 Mesas y códigos QR
        </Link>
        <Link href="/admin/camareros" className="block text-center bg-stone-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-stone-700 transition-colors">
          👤 Camareros
        </Link>
        <Link href="/admin/banners" className="block text-center bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
          🖼️ Banners publicitarios
        </Link>
        <Link href="/admin/configuracion" className="block text-center bg-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-teal-700 transition-colors">
          ⚙️ Nombre y cabecera del menú
        </Link>
        <Link href="/admin/login" className="block text-center bg-emerald-700 text-white py-3 px-6 rounded-xl font-semibold hover:bg-emerald-800 transition-colors">
          🔒 Estadísticas (admin)
        </Link>
        <Link href="/staff" className="block text-center border border-stone-300 text-stone-700 py-3 px-6 rounded-xl font-semibold hover:bg-stone-100 transition-colors">
          📋 Ver pedidos (staff)
        </Link>
      </div>
    </div>
  );
}
