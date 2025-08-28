// Minimal data loader and renderer for Home, Portfolio, and Blog
const base = '';

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No se pudo cargar ${path}`);
  return res.json();
}

function renderProjects(container, projects) {
  container.innerHTML = projects.map(p => `
    <div class="card">
      <h3>${p.title}</h3>
      <p>${p.description ?? ''}</p>
      ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener">Ver más</a>` : ''}
    </div>
  `).join('');
}

function renderPosts(container, posts) {
  container.innerHTML = posts.map(post => `
    <article class="blog-post">
      <h3>${post.title}</h3>
      <p>${post.summary ?? ''}</p>
      <small>${new Date(post.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
    </article>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.getAttribute('data-page');
  try {
    if (page === 'home') {
      const [projects, posts] = await Promise.all([
        loadJSON(`${base}/projects.json`),
        loadJSON(`${base}/posts.json`)
      ]);
      const featured = projects.slice(0, 3);
      const latest = posts.slice(0, 3);
      const fp = document.getElementById('featured-projects');
      const lp = document.getElementById('latest-posts');
      if (fp) renderProjects(fp, featured);
      if (lp) renderPosts(lp, latest);
    }
    if (page === 'portfolio') {
      const projects = await loadJSON(`${base}/projects.json`);
      const container = document.getElementById('projects');
      if (container) renderProjects(container, projects);
    }
    if (page === 'blog') {
      const posts = await loadJSON(`${base}/posts.json`);
      const container = document.getElementById('posts');
      if (container) renderPosts(container, posts);
    }
  } catch (e) {
    console.error(e);
  }
});
