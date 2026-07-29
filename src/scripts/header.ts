import { triggerHapticFeedback } from "./haptics";

let cleanup: (() => void) | undefined;

function runCleanup() {
  cleanup?.();
  cleanup = undefined;
}

export function initHeader() {
  runCleanup();

  // Theme Toggle Logic
  const themeToggle = document.getElementById("theme-toggle");

  const handleThemeToggle = () => {
    const element = document.documentElement;
    element.classList.toggle("dark");

    const isDark = element.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");

    // Haptic feedback
    triggerHapticFeedback();
  };

  themeToggle?.addEventListener("click", handleThemeToggle);

  // Mobile Menu Logic
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  let handleLinkClick: (() => void) | undefined;
  let handleMenuToggle: ((event: Event) => void) | undefined;
  let handleOutsideClick: ((event: MouseEvent) => void) | undefined;
  let handleEscape: ((event: KeyboardEvent) => void) | undefined;

  if (menuToggle && mobileMenu) {
    const closeMenu = () => {
      mobileMenu.classList.add("hidden");
      menuToggle.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
      mobileMenu.setAttribute("data-state", "closed");
      const icon = menuToggle.querySelector(".material-icons");
      if (icon) icon.textContent = "menu";
      menuToggle.focus();
    };

    const openMenu = () => {
      mobileMenu.classList.remove("hidden");
      menuToggle.setAttribute("aria-expanded", "true");
      mobileMenu.setAttribute("aria-hidden", "false");
      mobileMenu.setAttribute("data-state", "open");
      const icon = menuToggle.querySelector(".material-icons");
      if (icon) icon.textContent = "close";
      mobileMenu.querySelector<HTMLAnchorElement>("a[href]")?.focus();
    };

    handleMenuToggle = (event: Event) => {
      event.stopPropagation();
      triggerHapticFeedback();
      const isOpen = mobileMenu.getAttribute("data-state") === "open";
      if (isOpen) closeMenu();
      else openMenu();
    };

    handleOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (
        mobileMenu.getAttribute("data-state") === "open" &&
        target instanceof Node &&
        !mobileMenu.contains(target) &&
        !menuToggle.contains(target)
      ) {
        closeMenu();
      }
    };

    handleEscape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        mobileMenu.getAttribute("data-state") === "open"
      ) {
        event.preventDefault();
        closeMenu();
      }
    };

    menuToggle.addEventListener("click", handleMenuToggle);
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

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

    if (menuToggle && handleMenuToggle) {
      menuToggle.removeEventListener("click", handleMenuToggle);
    }
    if (handleOutsideClick) {
      document.removeEventListener("click", handleOutsideClick);
    }
    if (handleEscape) {
      document.removeEventListener("keydown", handleEscape);
    }

    const menuLinks = mobileMenu?.querySelectorAll("a");
    if (menuLinks && handleLinkClick) {
      menuLinks.forEach((link) =>
        link.removeEventListener("click", handleLinkClick!)
      );
    }
  };
}

// Run on view transitions and initial DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeader);
} else {
  initHeader();
}
document.addEventListener("astro:page-load", initHeader);
document.addEventListener("astro:before-swap", runCleanup);
