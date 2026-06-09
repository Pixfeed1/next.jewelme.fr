import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Categories : /36-onlyroots-records → /categorie/36
      { source: '/:id(\\d+)-:slug', destination: '/categorie/:id' },
      // CMS classiques : /content/14-faq → /page/faq
      { source: '/content/:id(\\d+)-:slug', destination: '/page/:slug' },
      // CMS custom (URL exactes du megamenu OnlyRoots)
      { source: '/vente-en-gros', destination: '/page/vente-en-gros' },
    ];
  },
};

export default nextConfig;
