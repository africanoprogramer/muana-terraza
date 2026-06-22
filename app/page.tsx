import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-700 mb-2">🌴 Muana Terraza Tía Leny</h1>
        <p className="text-stone-500">Sistema de pedidos digitales</p>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/staff"
          className="block text-center bg-amber-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-amber-700 transition-colors"
        >
          Panel del Staff
        </Link>
        <Link
          href="/admin"
          className="block text-center bg-stone-700 text-white py-3 px-6 rounded-xl font-semibold hover:bg-stone-800 transition-colors"
        >
          Administración
        </Link>
      </div>
    </div>
  );
}
