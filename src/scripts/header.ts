let cleanup: (() => void) | undefined;

export function initHeader() {
  if (cleanup) cleanup();

  // Theme Toggle Logic
  const themeToggle = document.getElementById("theme-toggle");

  const handleThemeToggle = () => {
    const element = document.documentElement;
    element.classList.toggle("dark");

    const isDark = element.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  themeToggle?.addEventListener("click", handleThemeToggle);

  // Mobile Menu Logic
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  let cleanupMenuListeners: (() => void) | undefined;
  let handleLinkClick: (() => void) | undefined;
  let toggleMenu: ((e: Event) => void) | undefined;

  if (menuToggle && mobileMenu) {
    const closeMenu = () => {
      mobileMenu.classList.add("hidden");
      menuToggle.setAttribute("aria-expanded", "false");
      const icon = menuToggle.querySelector(".material-icons");
      if (icon) icon.textContent = "menu";

      if (cleanupMenuListeners) {
        cleanupMenuListeners();
        cleanupMenuListeners = undefined;
      }
    };

    const openMenu = () => {
      mobileMenu.classList.remove("hidden");
      menuToggle.setAttribute("aria-expanded", "true");
      const icon = menuToggle.querySelector(".material-icons");
      if (icon) icon.textContent = "close";

      // Add close-on interaction listeners
      const handleOutsideClick = (e: MouseEvent) => {
        if (
          !mobileMenu.contains(e.target as Node) &&
          !menuToggle.contains(e.target as Node)
        ) {
          closeMenu();
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeMenu();
      };

      // Use requestAnimationFrame to avoid immediate trigger from the toggle click
      requestAnimationFrame(() => {
        document.addEventListener("click", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);
      });

      cleanupMenuListeners = () => {
        document.removeEventListener("click", handleOutsideClick);
        document.removeEventListener("keydown", handleEscape);
      };
    };

    toggleMenu = (e: Event) => {
      e.stopPropagation();
      const isHidden = mobileMenu.classList.contains("hidden");
      if (isHidden) openMenu();
      else closeMenu();
    };

    menuToggle.addEventListener("click", toggleMenu);

    // Close on navigation (link click)
    const menuLinks = mobileMenu.querySelectorAll("a");
    handleLinkClick = () => closeMenu();
    menuLinks.forEach((link) =>
      link.addEventListener("click", handleLinkClick!)
    );
  }

  // Set cleanup for next cycle
  cleanup = () => {
    themeToggle?.removeEventListener("click", handleThemeToggle);

    if (menuToggle && toggleMenu) {
      menuToggle.removeEventListener("click", toggleMenu);
    }
    if (cleanupMenuListeners) cleanupMenuListeners();

    const menuLinks = mobileMenu?.querySelectorAll("a");
    if (menuLinks && handleLinkClick) {
      menuLinks.forEach((link) =>
        link.removeEventListener("click", handleLinkClick!)
      );
    }
  };
}

// Run on view transitions (fires on initial load too)
document.addEventListener("astro:page-load", initHeader);
document.addEventListener("astro:before-swap", () => cleanup && cleanup());
