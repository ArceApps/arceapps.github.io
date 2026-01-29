let scrollObserver: IntersectionObserver | undefined;
let fadeObserver: IntersectionObserver | undefined;

function initLayout() {
  // Clean up previous observers
  if (scrollObserver) {
    scrollObserver.disconnect();
    scrollObserver = undefined;
  }
  if (fadeObserver) {
    fadeObserver.disconnect();
    fadeObserver = undefined;
  }

  // Scroll to Top Logic
  const scrollBtn = document.getElementById("scroll-to-top");
  const scrollSentinel = document.getElementById("scroll-sentinel");

  if (scrollBtn && scrollSentinel) {
    scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            scrollBtn.classList.remove(
              "translate-y-20",
              "opacity-0",
              "pointer-events-none",
            );
            scrollBtn.classList.add(
              "translate-y-0",
              "opacity-100",
              "pointer-events-auto",
            );
            scrollBtn.removeAttribute("tabindex");
            scrollBtn.setAttribute("aria-hidden", "false");
          } else {
            scrollBtn.classList.add(
              "translate-y-20",
              "opacity-0",
              "pointer-events-none",
            );
            scrollBtn.classList.remove(
              "translate-y-0",
              "opacity-100",
              "pointer-events-auto",
            );
            scrollBtn.setAttribute("tabindex", "-1");
            scrollBtn.setAttribute("aria-hidden", "true");
          }
        });
      },
      { root: null, threshold: 0 },
    );

    scrollObserver.observe(scrollSentinel);

    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Intersection Observer for Fade-in Animations
  const fadeElements = document.querySelectorAll(".fade-in-section");

  if (fadeElements.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    fadeObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    fadeElements.forEach((el) => fadeObserver!.observe(el));
  }
}

function initServiceWorker() {
  // Service Worker Registration
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  }
}

// Initial load
window.addEventListener("load", initServiceWorker);

// View Transitions load (fires on initial load too)
initLayout();
document.addEventListener("astro:page-load", initLayout);
