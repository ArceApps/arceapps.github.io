const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const blogDir = path.join(__dirname, 'blog');
const outputDir = path.join(__dirname, 'src', 'content', 'blog');

// Leer todos los archivos HTML
const files = fs.readdirSync(blogDir).filter(file => file.endsWith('.html'));

console.log(`Found ${files.length} HTML files to convert`);

files.forEach(file => {
    const filePath = path.join(blogDir, file);
    const html = fs.readFileSync(filePath, 'utf-8');

    // Parsear HTML
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extraer metadatos
    const title = doc.querySelector('h1')?.textContent?.trim() || '';
    const subtitle = doc.querySelector('.article-subtitle')?.textContent?.trim() || '';
    const dateText = doc.querySelector('.article-date')?.textContent?.trim() || '';
    const category = doc.querySelector('.article-category')?.textContent?.trim() || '';
    const tags = Array.from(doc.querySelectorAll('.tags .tag')).map(tag => tag.textContent?.trim());

    // Convertir fecha española a formato ISO
    const dateMatch = dateText.match(/(\d+) de (\w+) de (\d{4})/);
    const months = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };

    let pubDate = '2025-01-01';
    if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = months[dateMatch[2].toLowerCase()] || '01';
        const year = dateMatch[3];
        pubDate = `${year}-${month}-${day}`;
    }

    // Extraer contenido del artículo
    const articleContent = doc.querySelector('.article-content');
    let content = '';

    if (articleContent) {
        // Convertir HTML a Markdown (simplificado)
        content = htmlToMarkdown(articleContent);
    }

    // Generar nombre de archivo
    const fileName = file.replace('.html', '.md');
    const outputPath = path.join(outputDir, fileName);

    // Crear frontmatter
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${subtitle.replace(/"/g, '\\"')}"
pubDate: "${pubDate}"
heroImage: "/images/placeholder-article-${file.replace('blog-', '').replace('.html', '')}.svg"
tags: ${JSON.stringify(tags.length > 0 ? tags : [category])}
---

`;

    // Escribir archivo markdown
    const markdown = frontmatter + content;
    fs.writeFileSync(outputPath, markdown, 'utf-8');

    console.log(`✓ Converted: ${fileName}`);
});

function htmlToMarkdown(element) {
    let markdown = '';

    element.childNodes.forEach(node => {
        if (node.nodeType === 3) { // Text node
            markdown += node.textContent;
        } else if (node.nodeType === 1) { // Element node
            const tagName = node.tagName.toLowerCase();

            switch (tagName) {
                case 'h2':
                    markdown += `\\n## ${node.textContent}\\n\\n`;
                    break;
                case 'h3':
                    markdown += `\\n### ${node.textContent}\\n\\n`;
                    break;
                case 'h4':
                    markdown += `\\n#### ${node.textContent}\\n\\n`;
                    break;
                case 'p':
                    markdown += `${node.textContent}\\n\\n`;
                    break;
                case 'ul':
                case 'ol':
                    Array.from(node.children).forEach(li => {
                        markdown += `- ${li.textContent}\\n`;
                    });
                    markdown += '\\n';
                    break;
                case 'code':
                    if (node.parentElement?.tagName === 'PRE') {
                        markdown += `\\n\`\`\`kotlin\\n${node.textContent}\\n\`\`\`\\n\\n`;
                    } else {
                        markdown += `\`${node.textContent}\``;
                    }
                    break;
                case 'strong':
                case 'b':
                    markdown += `**${node.textContent}**`;
                    break;
                case 'em':
                case 'i':
                    markdown += `*${node.textContent}*`;
                    break;
                case 'a':
                    markdown += `[${node.textContent}](${node.getAttribute('href')})`;
                    break;
                case 'div':
                    if (node.classList.contains('code-block')) {
                        const code = node.querySelector('code');
                        if (code) {
                            markdown += `\\n\`\`\`kotlin\\n${code.textContent}\\n\`\`\`\\n\\n`;
                        }
                    } else {
                        markdown += htmlToMarkdown(node);
                    }
                    break;
                default:
                    // Recursively process child nodes
                    if (node.childNodes.length > 0) {
                        markdown += htmlToMarkdown(node);
                    }
            }
        }
    });

    return markdown;
}

console.log('\\nConversion complete!');
