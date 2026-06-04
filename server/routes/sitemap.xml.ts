import { eq } from 'drizzle-orm'
import { blogPosts, listings } from '../db/schema'
import { getDb } from '../utils/db'

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl.replace(/\/$/, '')
  const db = getDb()

  const [listingRows, blogRows] = await Promise.all([
    db.select({
      id: listings.id,
      updatedAt: listings.updatedAt,
    })
      .from(listings)
      .where(eq(listings.status, 'published')),
    db.select({
      slug: blogPosts.slug,
      updatedAt: blogPosts.updatedAt,
    })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published')),
  ])

  const staticPaths = [
    '',
    '/search',
    '/blog',
    '/auth/login',
    '/auth/register',
    '/legal',
    '/legal/requisites',
    '/legal/offer',
    '/legal/privacy',
    '/legal/terms',
    '/help',
    '/help/support',
  ]
  const staticUrls = staticPaths.map(path => ({
    loc: `${siteUrl}${path}`,
    lastmod: new Date().toISOString().slice(0, 10),
  }))

  const listingUrls = listingRows.map(row => ({
    loc: `${siteUrl}/listings/${row.id}`,
    lastmod: row.updatedAt.toISOString().slice(0, 10),
  }))

  const blogUrls = blogRows.map(row => ({
    loc: `${siteUrl}/blog/${row.slug}`,
    lastmod: row.updatedAt.toISOString().slice(0, 10),
  }))

  const urls = [...staticUrls, ...listingUrls, ...blogUrls]
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return body
})
