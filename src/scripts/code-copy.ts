import { triggerHapticFeedback } from "./haptics";

export function setupCopyButtons() {
  const preTags = document.querySelectorAll("pre");
  preTags.forEach((pre) => {
    // Avoid duplicates if script runs multiple times on same DOM
    if (pre.querySelector(".copy-code-btn")) return;

    // Ensure the pre tag has relative positioning for button placement
    if (getComputedStyle(pre).position === 'static') {
      pre.style.position = 'relative';
    }

    const button = document.createElement("button");
    button.className =
      "copy-code-btn focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";
    button.innerHTML =
      '<span class="material-icons" aria-hidden="true">content_copy</span>';
    button.title = "Copiar código";
    button.setAttribute("aria-label", "Copiar código");

    button.addEventListener("click", () => {
      const code = pre.querySelector("code");
      const text = (code ? code.textContent : pre.textContent) || "";

      navigator.clipboard
        .writeText(text)
        .then(() => {
          // Haptic feedback
          triggerHapticFeedback();

          // Visual feedback
          button.innerHTML =
            '<span class="material-icons" aria-hidden="true">check</span>';
          button.classList.add("text-green-400");
          button.setAttribute("aria-label", "¡Copiado!");
          button.title = "¡Copiado!";

          setTimeout(() => {
            // Restore original state
            button.innerHTML =
              '<span class="material-icons" aria-hidden="true">content_copy</span>';
            button.classList.remove("text-green-400");
            button.setAttribute("aria-label", "Copiar código");
            button.title = "Copiar código";
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
        });
    });

    pre.appendChild(button);
  });
}
