
let scrollHandler: (() => void) | undefined;

function setupProgressBar() {
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

function setupCopyButtons() {
  const preTags = document.querySelectorAll("pre");
  preTags.forEach((pre) => {
    // Avoid duplicates if script runs multiple times on same DOM
    if (pre.querySelector(".copy-code-btn")) return;

    const button = document.createElement("button");
    button.className =
      "copy-code-btn focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";
    button.innerHTML = '<span class="material-icons">content_copy</span>';
    button.title = "Copiar código";
    button.setAttribute("aria-label", "Copiar código");

    button.addEventListener("click", () => {
      const code = pre.querySelector("code");
      const text = code ? code.innerText : pre.innerText;

      navigator.clipboard
        .writeText(text)
        .then(() => {
          const originalIcon = button.innerHTML;
          button.innerHTML = '<span class="material-icons">check</span>';
          button.classList.add("text-green-400"); // Visual feedback

          setTimeout(() => {
            button.innerHTML = originalIcon;
            button.classList.remove("text-green-400");
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
        });
    });

    pre.appendChild(button);
  });
}

function initBlog() {
  setupProgressBar();
  setupCopyButtons();
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
