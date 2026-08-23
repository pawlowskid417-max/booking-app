import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://booking-app-one-kappa.vercel.app'; // Zmień na docelową domenę

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/rezerwacja`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.8,
    },
  ];
}
