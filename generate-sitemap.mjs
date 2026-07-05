/**
 * Rise Music Mag — Générateur de sitemap.xml
 * ----------------------------------------------------------------
 * Script à exécuter manuellement (Node.js) pour régénérer sitemap.xml
 * à partir des données actuelles de /data. Le site étant une SPA statique
 * sans backend de build, ce sitemap N'EST PAS régénéré automatiquement
 * quand du contenu est ajouté via l'admin Decap CMS.
 *
 * À relancer après chaque ajout/suppression significatif de contenu
 * (nouvel artiste, nouvelle interview, etc.) avant un déploiement :
 *
 *   node generate-sitemap.mjs
 *
 * Exclut volontairement :
 * - le contenu non publié (statut 'brouillon')
 * - le contenu placeholder (statut 'exemple', voir data/README.md)
 * - /admin (jamais indexé, cf. robots.txt et meta noindex)
 */

import { readFile, writeFile } from 'fs/promises';

const ROOT = new URL('.', import.meta.url).pathname;

async function loadJson(relativePath) {
  const content = await readFile(ROOT + relativePath, 'utf-8');
  return JSON.parse(content);
}

function formatDate(dateStr) {
  // sitemap.xml attend YYYY-MM-DD ; nos dates sont déjà dans ce format,
  // mais on normalise au cas où une heure aurait été ajoutée (events.json).
  if (!dateStr) return null;
  return dateStr.slice(0, 10);
}

function urlEntry(loc, { lastmod, changefreq, priority }) {
  let xml = `  <url>\n    <loc>${loc}</loc>\n`;
  if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
  if (changefreq) xml += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority !== undefined) xml += `    <priority>${priority.toFixed(1)}</priority>\n`;
  xml += `  </url>`;
  return xml;
}

async function generate() {
  const site = await loadJson('data/site.json');
  const base = site.identite.url.replace(/\/$/, '');

  const [artistesData, interviewsData, articlesData, albumsData] = await Promise.all([
    loadJson('data/artistes.json'),
    loadJson('data/interviews.json'),
    loadJson('data/articles.json'),
    loadJson('data/albums.json')
  ]);

  const entries = [];

  // Pages statiques de navigation (priorité haute pour la home, dégressive ensuite)
  const staticPages = [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/artistes', changefreq: 'daily', priority: 0.9 },
    { path: '/interviews', changefreq: 'weekly', priority: 0.8 },
    { path: '/actualites', changefreq: 'daily', priority: 0.9 },
    { path: '/albums', changefreq: 'weekly', priority: 0.7 },
    { path: '/concerts', changefreq: 'weekly', priority: 0.7 },
    { path: '/galerie', changefreq: 'weekly', priority: 0.5 },
    { path: '/about', changefreq: 'monthly', priority: 0.4 },
    { path: '/partenariats', changefreq: 'monthly', priority: 0.3 },
    { path: '/contact', changefreq: 'monthly', priority: 0.3 },
    { path: '/mentions-legales', changefreq: 'yearly', priority: 0.1 },
    { path: '/confidentialite', changefreq: 'yearly', priority: 0.1 }
  ];
  for (const p of staticPages) {
    entries.push(urlEntry(`${base}${p.path}`, { changefreq: p.changefreq, priority: p.priority }));
  }

  // Artistes : seulement statut 'publie'
  for (const a of artistesData.artistes) {
    if (a.statut !== 'publie') continue;
    entries.push(urlEntry(`${base}/artiste/${a.id}`, {
      lastmod: formatDate(a.datePublication),
      changefreq: 'weekly',
      priority: 0.7
    }));
  }

  // Interviews : seulement statut 'publie'
  for (const i of interviewsData.interviews) {
    if (i.statut !== 'publie') continue;
    entries.push(urlEntry(`${base}/interview/${i.id}`, {
      lastmod: formatDate(i.datePublication),
      changefreq: 'monthly',
      priority: 0.6
    }));
  }

  // Articles : seulement 'publie' — 'exemple' et 'brouillon' explicitement exclus
  for (const a of articlesData.articles) {
    if (a.statut !== 'publie') continue;
    entries.push(urlEntry(`${base}/article/${a.id}`, {
      lastmod: formatDate(a.dateModification || a.datePublication),
      changefreq: 'monthly',
      priority: 0.6
    }));
  }

  // Albums : tous sauf 'brouillon' (cohérent avec dataStore.getAlbums())
  for (const a of albumsData.albums) {
    if (a.statut === 'brouillon') continue;
    entries.push(urlEntry(`${base}/album/${a.id}`, {
      lastmod: formatDate(a.dateSortie),
      changefreq: 'monthly',
      priority: 0.5
    }));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  await writeFile(ROOT + 'sitemap.xml', xml, 'utf-8');

  console.log(`sitemap.xml généré avec ${entries.length} URLs.`);
  console.log(`  - ${staticPages.length} pages statiques`);
  console.log(`  - ${artistesData.artistes.filter(a => a.statut === 'publie').length} artistes publiés`);
  console.log(`  - ${interviewsData.interviews.filter(i => i.statut === 'publie').length} interviews publiées`);
  console.log(`  - ${articlesData.articles.filter(a => a.statut === 'publie').length} articles publiés (exemples exclus)`);
  console.log(`  - ${albumsData.albums.filter(a => a.statut !== 'brouillon').length} albums`);
}

generate().catch((err) => {
  console.error('Erreur lors de la génération du sitemap :', err);
  process.exit(1);
});
