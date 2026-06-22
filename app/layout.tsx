import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muana Terraza Tía Leny",
  description: "Menú digital y seguimiento de pedidos en tiempo real",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-stone-50 text-stone-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
