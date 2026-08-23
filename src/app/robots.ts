import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/panel/', '/api/'],
    },
    sitemap: 'https://booking-app-one-kappa.vercel.app/sitemap.xml', // Zmień na docelową domenę
  };
}
