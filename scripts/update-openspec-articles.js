import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'src/content/blog');
const PUBLIC_IMAGES_DIR = path.join(ROOT_DIR, 'public/images');

const ALL_TOOLS = [
  'OpenSpec', 'Superpowers', 'Spec-Kit', 'BMAD', 'Grill-me', 'GSD',
  'Beads', 'LeanSpec', 'Taskmaster', 'Spec-Kitty', 'Harness'
];

async function generateSvg(tool) {
  const svgPath = path.join(PUBLIC_IMAGES_DIR, `infographic-${tool.toLowerCase()}.svg`);

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#018786"/>
  <rect x="100" y="100" width="1000" height="430" rx="20" fill="#000000" opacity="0.1"/>
  <text x="600" y="315" font-family="sans-serif" font-size="80" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
    ${tool} Infographic
  </text>
  <circle cx="600" cy="450" r="40" fill="#FF9800" />
</svg>`;

  try {
    await fs.access(svgPath);
  } catch (err) {
    await fs.writeFile(svgPath, svgContent, 'utf8');
    console.log(`Generated SVG for ${tool} at ${svgPath}`);
  }
}

async function findFilesWithOpenSpec() {
  const targetFiles = [];

  async function scanDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf8');
        if (/openspec/i.test(content)) {
          targetFiles.push({ fullPath, content });
        }
      }
    }
  }

  await scanDir(BLOG_DIR);
  return targetFiles;
}

async function processFiles() {
  const files = await findFilesWithOpenSpec();

  // First, generate all necessary SVGs
  const allMentionedTools = new Set();

  for (const file of files) {
    const mentionedTools = [];
    for (const tool of ALL_TOOLS) {
      const regex = new RegExp(`\\b${tool.replace('-', '[- ]?')}\\b`, 'i');
      if (regex.test(file.content)) {
        mentionedTools.push(tool);
        allMentionedTools.add(tool);
      }
    }
    file.mentionedTools = mentionedTools;
  }

  for (const tool of allMentionedTools) {
    await generateSvg(tool);
  }

  // Now process each file
  for (const file of files) {
    let newContent = file.content;
    const mentionedTools = file.mentionedTools;

    console.log(`Processing ${path.basename(file.fullPath)} with tools: ${mentionedTools.join(', ')}`);

    if (mentionedTools.length === 1) {
      // Single tool: Replace heroImage
      const tool = mentionedTools[0];
      const match = newContent.match(/heroImage:\s*"([^"]+)"/);
      if (match) {
        const oldImage = match[1];
        const oldImagePath = path.join(ROOT_DIR, 'public', oldImage);

        // Use exact replacement on the entire file to avoid changing unrelated parts
        newContent = newContent.replace(
          match[0],
          `heroImage: "/images/infographic-${tool.toLowerCase()}.svg"`
        );

        // Try deleting old image, silently fail if it doesn't exist
        if (!oldImage.includes('infographic-')) {
            try {
              await fs.unlink(oldImagePath);
              console.log(`  Deleted old image: ${oldImagePath}`);
            } catch (err) {
              console.log(`  Could not delete old image (may not exist): ${oldImagePath}`);
            }
        }
      }
    } else if (mentionedTools.length > 1) {
      // Multiple tools: Inject infographics
      // Find where frontmatter ends
      const fmEndIndex = newContent.indexOf('---', 4);
      if (fmEndIndex !== -1) {
        // We will do simple string replacement to insert the image after the first mention of each tool in the body.
        let bodyOffset = fmEndIndex + 3;
        let body = newContent.substring(bodyOffset);
        let frontmatter = newContent.substring(0, bodyOffset);

        for (const tool of mentionedTools) {
          // Check if already injected
          if (body.includes(`![Infografía ${tool}](/images/infographic-${tool.toLowerCase()}.svg)`)) {
              continue;
          }

          const regex = new RegExp(`(\\b${tool.replace('-', '[- ]?')}\\b.*?\\n\\n)`, 'is');
          const match = body.match(regex);

          if (match) {
            const indexToInject = match.index + match[0].length;
            const imageStr = `\n![Infografía ${tool}](/images/infographic-${tool.toLowerCase()}.svg)\n\n`;
            body = body.substring(0, indexToInject) + imageStr + body.substring(indexToInject);
            console.log(`  Injected ${tool} infographic into ${path.basename(file.fullPath)}`);
          } else {
              // fallback append
              const imageStr = `\n\n![Infografía ${tool}](/images/infographic-${tool.toLowerCase()}.svg)\n\n`;
              body += imageStr;
          }
        }
        newContent = frontmatter + body;
      }
    }

    if (newContent !== file.content) {
      await fs.writeFile(file.fullPath, newContent, 'utf8');
      console.log(`Updated ${file.fullPath}`);
    }
  }
}

processFiles().catch(err => {
  console.error("Error processing files:", err);
  process.exit(1);
});
