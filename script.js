// SPA navigation for Portfolio and Blog
function showSection(id) {
  document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  document.querySelector(`nav a[data-section="${id}"]`).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('nav a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      showSection(a.dataset.section);
      history.pushState(null, '', `#${a.dataset.section}`);
    });
  });
  // On load, show section from hash or default
  const hash = location.hash.replace('#', '') || 'portfolio';
  if (document.getElementById(hash)) showSection(hash);
  else showSection('portfolio');
  window.onpopstate = () => {
    const hash = location.hash.replace('#', '') || 'portfolio';
    if (document.getElementById(hash)) showSection(hash);
  };
});
