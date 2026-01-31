import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date('2024-10-27'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/check`,
      lastModified: new Date('2024-10-27'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
