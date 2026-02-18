
let scrollHandler: (() => void) | undefined;

export function setupProgressBar() {
  const progressBar = document.getElementById("progress-bar");
  if (!progressBar) return;

  // Clean up any existing handler just in case
  if (scrollHandler) {
    window.removeEventListener("scroll", scrollHandler);
  }

  let ticking = false;

  scrollHandler = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (!progressBar) return;
        const scrollTop =
          document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        const scrolled = (scrollTop / scrollHeight) * 100;
        progressBar.style.width = scrolled + "%";
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener("scroll", scrollHandler, { passive: true });
}

function initBlog() {
  setupProgressBar();
}

function cleanupBlog() {
  if (scrollHandler) {
    window.removeEventListener("scroll", scrollHandler);
    scrollHandler = undefined;
  }
}

// Initialize on page load (initial and view transitions)
document.addEventListener("astro:page-load", initBlog);

// Clean up listeners before swapping content
document.addEventListener("astro:before-swap", cleanupBlog);
