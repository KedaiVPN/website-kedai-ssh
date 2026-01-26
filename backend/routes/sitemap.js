const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const baseUrl = 'https://kedaissh.com';
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/tutorials', changefreq: 'daily', priority: 0.9 },
      { url: '/about-us', changefreq: 'monthly', priority: 0.7 },
      { url: '/faq', changefreq: 'weekly', priority: 0.7 },
      { url: '/privacy-policy', changefreq: 'yearly', priority: 0.5 },
      { url: '/terms-of-service', changefreq: 'yearly', priority: 0.5 },
      { url: '/register', changefreq: 'monthly', priority: 0.8 },
      { url: '/login', changefreq: 'monthly', priority: 0.8 }
    ];

    // Fetch published articles
    const [articles] = await db.query(
      "SELECT slug, updated_at, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC"
    );

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Add static pages
    staticPages.forEach(page => {
      xml += '<url>';
      xml += `<loc>${baseUrl}${page.url}</loc>`;
      xml += `<changefreq>${page.changefreq}</changefreq>`;
      xml += `<priority>${page.priority}</priority>`;
      xml += '</url>';
    });

    // Add dynamic article pages
    articles.forEach(article => {
      const lastModDate = article.updated_at || article.published_at || new Date();
      const lastMod = new Date(lastModDate).toISOString();

      xml += '<url>';
      xml += `<loc>${baseUrl}/tutorials/${article.slug}</loc>`;
      xml += `<lastmod>${lastMod}</lastmod>`;
      xml += '<changefreq>weekly</changefreq>';
      xml += '<priority>0.8</priority>';
      xml += '</url>';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);

  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
