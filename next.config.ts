import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le routing SEO (catégories /{id}-{rewrite}, produits .html, /label, /content,
  // /supplier) est géré nativement par les routes app/ (catch-all + segments
  // statiques). Plus besoin de rewrites.
};

export default nextConfig;
