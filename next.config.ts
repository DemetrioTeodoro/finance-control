import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Em produção o roteamento para o py-api é feito pelo vercel.json
  // (Services). Em dev, `next dev` não lê o vercel.json, então esse
  // rewrite substitui esse papel apontando para o uvicorn local
  // (`uvicorn index:app --reload --port 8000`, rodado dentro de py-api/).
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    return [
      {
        source: "/python-backend/:path*",
        destination: "http://localhost:8000/python-backend/:path*",
      },
    ];
  },
};

export default nextConfig;
