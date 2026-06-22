import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Todas las páginas usan Firebase (cliente), no hay rutas estáticas
  output: "standalone",
};

export default nextConfig;
