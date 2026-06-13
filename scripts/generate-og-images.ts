/**
 * OG Image Generation Script
 * 
 * Generates 1200x630 PNG OG images for all blog/apps/devlog entries.
 * Uses satori for SVG rendering and sharp for PNG conversion.
 * 
 * Run: npx tsx scripts/generate-og-images.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Brand colors
const TEAL = '#018786';
const ORANGE = '#FF9800';
const WHITE = '#FFFFFF';

const OUTPUT_DIR = 'public/images/og';

interface OGEntry {
  title: string;
  date: string;
  type: 'blog' | 'apps' | 'devlog';
  lang: 'en' | 'es';
  slug: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Creates SVG string for an OG image
 */
function createOGSVG(entry: OGEntry): string {
  const { title, date, type, lang } = entry;
  
  const typeLabels = {
    blog: lang === 'es' ? 'Blog' : 'Blog',
    apps: lang === 'es' ? 'App' : 'App',
    devlog: lang === 'es' ? 'Devlog' : 'Devlog',
  };

  const langLabel = lang === 'es' ? 'ES' : 'EN';
  const dateLabel = new Date(date).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${TEAL};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#006666;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${ORANGE};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFB74D;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  
  <!-- Decorative circles -->
  <circle cx="1100" cy="100" r="300" fill="${ORANGE}" opacity="0.1" />
  <circle cx="100" cy="600" r="200" fill="${WHITE}" opacity="0.05" />
  
  <!-- Accent bar -->
  <rect x="0" y="580" width="1200" height="50" fill="url(#accentGrad)" />
  
  <!-- Type badge -->
  <rect x="80" y="80" width="140" height="40" rx="20" fill="${ORANGE}" />
  <text x="150" y="106" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${WHITE}" text-anchor="middle">${typeLabels[type]}</text>
  
  <!-- Language badge -->
  <rect x="240" y="80" width="50" height="40" rx="20" fill="${WHITE}" opacity="0.2" />
  <text x="265" y="106" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${WHITE}" text-anchor="middle">${langLabel}</text>
  
  <!-- Title -->
  <text x="80" y="280" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="${WHITE}">${escapeXml(title)}</text>
  
  <!-- Divider -->
  <rect x="80" y="320" width="80" height="4" rx="2" fill="${ORANGE}" />
  
  <!-- Date -->
  <text x="80" y="400" font-family="Arial, sans-serif" font-size="24" fill="${WHITE}" opacity="0.8">${dateLabel}</text>
  
  <!-- Brand watermark -->
  <text x="1100" y="600" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${WHITE}" opacity="0.6" text-anchor="end">ArceApps</text>
</svg>`;
}

/**
 * Generate OG image for an entry
 */
async function generateOGImage(entry: OGEntry): Promise<void> {
  try {
    const svgString = createOGSVG(entry);
    const svgBuffer = Buffer.from(svgString);
    
    // Convert SVG to PNG using sharp
    const pngBuffer = await sharp(svgBuffer)
      .resize(1200, 630)
      .png()
      .toBuffer();

    // Write to file
    const outputPath = path.join(process.cwd(), OUTPUT_DIR, `${entry.slug}.png`);
    fs.writeFileSync(outputPath, new Uint8Array(pngBuffer));
    
    console.log(`  ✓ Generated: ${entry.slug}.png`);
  } catch (error) {
    console.error(`  ✗ Failed: ${entry.slug}.png - ${error}`);
  }
}

/**
 * Fetch all content entries from Astro content collections
 */
async function getContentEntries(): Promise<OGEntry[]> {
  const entries: OGEntry[] = [];

  // Import Astro content config
  const configPath = path.join(process.cwd(), 'src/content/config.ts');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  
  // Check what collections exist
  const blogMatch = configContent.match(/['"]blog['"]/);
  const appsMatch = configContent.match(/['"]apps['"]/);
  const devlogMatch = configContent.match(/['"]devlog['"]/);
  
  const collectionsDir = path.join(process.cwd(), 'src/content');
  
  // Read blog entries
  if (blogMatch) {
    const blogDir = path.join(collectionsDir, 'blog');
    if (fs.existsSync(blogDir)) {
      const enDir = path.join(blogDir, 'en');
      const esDir = path.join(blogDir, 'es');
      
      if (fs.existsSync(enDir)) {
        const files = fs.readdirSync(enDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
        for (const file of files) {
          const filePath = path.join(enDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
          if (frontmatterMatch) {
            const fm = frontmatterMatch[1];
            const titleMatch = fm.match(/title:\s*["'](.*)["']/);
            const dateMatch = fm.match(/pubDate:\s*(.*)/);
            const draftMatch = fm.match(/draft:\s*(?:true|false)/);
            
            if (titleMatch && !draftMatch?.input?.includes('draft: true')) {
              const slug = file.replace(/\.mdx?$/, '');
              entries.push({
                title: titleMatch[1],
                date: dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString(),
                type: 'blog',
                lang: 'en',
                slug: `blog-en-${slug}`,
              });
            }
          }
        }
      }
      
      if (fs.existsSync(esDir)) {
        const files = fs.readdirSync(esDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
        for (const file of files) {
          const filePath = path.join(esDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
          if (frontmatterMatch) {
            const fm = frontmatterMatch[1];
            const titleMatch = fm.match(/title:\s*["'](.*?)["']/);
            const dateMatch = fm.match(/pubDate:\s*(.*)/);
            const draftMatch = fm.match(/draft:\s*(?:true|false)/);
            
            if (titleMatch && !draftMatch?.input?.includes('draft: true')) {
              const slug = file.replace(/\.mdx?$/, '');
              entries.push({
                title: titleMatch[1],
                date: dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString(),
                type: 'blog',
                lang: 'es',
                slug: `blog-es-${slug}`,
              });
            }
          }
        }
      }
    }
  }
  
  // Read devlog entries
  if (devlogMatch) {
    const devlogDir = path.join(collectionsDir, 'devlog');
    if (fs.existsSync(devlogDir)) {
      const enDir = path.join(devlogDir, 'en');
      const esDir = path.join(devlogDir, 'es');
      
      for (const [lang, dir] of [['en', enDir], ['es', esDir]] as const) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
          for (const file of files) {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const frontmatterMatch = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
            if (frontmatterMatch) {
              const fm = frontmatterMatch[1];
              const titleMatch = fm.match(/title:\s*["'](.*)["']/);
              const dateMatch = fm.match(/pubDate:\s*(.*)/);
              const draftMatch = fm.match(/draft:\s*(?:true|false)/);
              
              if (titleMatch && !draftMatch?.input?.includes('draft: true')) {
                const slug = file.replace(/\.mdx?$/, '');
                entries.push({
                  title: titleMatch[1],
                  date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
                  type: 'devlog',
                  lang,
                  slug: `devlog-${lang}-${slug}`,
                });
              }
            }
          }
        }
      }
    }
  }
  
  // Read apps entries
  if (appsMatch) {
    const appsDir = path.join(collectionsDir, 'apps');
    if (fs.existsSync(appsDir)) {
      const enDir = path.join(appsDir, 'en');
      const esDir = path.join(appsDir, 'es');
      
      for (const [lang, dir] of [['en', enDir], ['es', esDir]] as const) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
          for (const file of files) {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const frontmatterMatch = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
            if (frontmatterMatch) {
              const fm = frontmatterMatch[1];
              const titleMatch = fm.match(/title:\s*["'](.*)["']/);
              const dateMatch = fm.match(/pubDate:\s*(.*)/);
              const draftMatch = fm.match(/draft:\s*(?:true|false)/);
              
              if (titleMatch && !draftMatch?.input?.includes('draft: true')) {
                const slug = file.replace(/\.mdx?$/, '');
                entries.push({
                  title: titleMatch[1],
                  date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
                  type: 'apps',
                  lang,
                  slug: `apps-${lang}-${slug}`,
                });
              }
            }
          }
        }
      }
    }
  }

  return entries;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 Generating OG Images...\n');

  // Ensure output directory exists
  const outputPath = path.join(process.cwd(), OUTPUT_DIR);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  try {
    const entries = await getContentEntries();
    console.log(`Found ${entries.length} content entries\n`);

    // Generate images with concurrency control
    const batchSize = 10;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (entry) => {
          try {
            await generateOGImage(entry);
            successCount++;
          } catch {
            failCount++;
          }
        })
      );
    }

    console.log(`\n📊 Summary:`);
    console.log(`  Total: ${entries.length}`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log(`\n✨ OG image generation complete!`);
    console.log(`   Output: /${OUTPUT_DIR}/\n`);
  } catch (error) {
    console.error('Error during OG image generation:', error);
    process.exit(1);
  }
}

main();