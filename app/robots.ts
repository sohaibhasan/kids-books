import type { MetadataRoute } from 'next'

const SITE_URL = process.env.APP_URL ?? 'https://storybookstudio.org'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Generated/private surfaces shouldn't be crawled.
        disallow: ['/api/', '/generating/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
