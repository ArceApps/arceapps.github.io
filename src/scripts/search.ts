// src/scripts/search.ts

// Module-level state (persists across View Transitions)
let fuse: any;
let searchIndex: any[] = [];

// DOM Element References (refreshed on each navigation)
let searchModal: HTMLElement | null = null;
let searchButton: HTMLElement | null = null;
let closeSearch: HTMLElement | null = null;
let searchInput: HTMLInputElement | null = null;
let searchResults: HTMLElement | null = null;
let searchStatus: HTMLElement | null = null;

// Utility: Debounce function to limit execution frequency
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function escapeHtml(unsafe: string) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#039;");
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === "Escape") {
    closeModal();
  }
}

export function closeModal() {
  if (searchModal) {
    searchModal.classList.add("hidden");
    document.body.style.overflow = "";

    // Clean up global listener
    document.removeEventListener("keydown", handleEscape);

    if (searchButton) {
      searchButton.setAttribute("aria-expanded", "false");
    }

    if (searchInput) {
      searchInput.value = "";
    }

    if (searchResults) {
      searchResults.innerHTML = "";
      searchResults.classList.add("hidden");
    }

    if (searchStatus) {
      searchStatus.textContent = "Escribe para buscar...";
      searchStatus.classList.remove("hidden");
    }
  }
}

export async function initFuse() {
  if (searchIndex.length > 0) return;

  // Show loading state
  if (searchStatus) {
    searchStatus.innerHTML =
      '<div class="flex items-center justify-center gap-2"><span class="material-icons animate-spin">refresh</span><span>Cargando índice...</span></div>';
    searchStatus.classList.remove("hidden");
  }

  try {
    // Parallelize fetching index and loading library
    const [response, { default: Fuse }] = await Promise.all([
      fetch("/search-index.json"),
      import("fuse.js"),
    ]);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    searchIndex = await response.json();

    fuse = new Fuse(searchIndex, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "description", weight: 0.3 },
        { name: "tags", weight: 0.2 },
      ],
      includeScore: true,
      threshold: 0.4,
    });

    // Clear loading state if input is empty
    if (searchInput && searchInput.value === "" && searchStatus) {
      searchStatus.textContent = "Escribe para buscar...";
    } else if (searchInput && searchInput.value !== "") {
      performSearch(searchInput.value);
    }
  } catch (error) {
    console.error("Error loading search index:", error);
    if (searchStatus)
      searchStatus.textContent = "Error al cargar el buscador.";
  }
}

export function openModal() {
  if (searchModal) {
    searchModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Add global listener only when modal is open
    document.addEventListener("keydown", handleEscape);

    if (searchButton) {
      searchButton.setAttribute("aria-expanded", "true");
    }

    initFuse();
    setTimeout(() => searchInput?.focus(), 100);
  }
}

export function performSearch(query: string) {
  if (!fuse) return;

  if (query.length < 2) {
    if (searchResults) searchResults.classList.add("hidden");
    if (searchStatus) {
      searchStatus.textContent = "Escribe al menos 2 caracteres...";
      searchStatus.classList.remove("hidden");
    }
    return;
  }

  const results = fuse.search(query);

  if (results.length === 0) {
    if (searchResults) searchResults.classList.add("hidden");
    if (searchStatus) {
      searchStatus.innerHTML =
        '<div class="flex flex-col items-center justify-center py-8 gap-3 text-gray-500 dark:text-gray-400"><span class="material-icons text-5xl opacity-50">search_off</span><p class="font-medium">No encontramos resultados para "' +
        escapeHtml(query) +
        '"</p><p class="text-sm">Intenta con otras palabras clave o revisa la ortografía.</p></div>';
      searchStatus.classList.remove("hidden");
    }
    return;
  }

  if (searchStatus) searchStatus.classList.add("hidden");
  if (searchResults) {
    searchResults.classList.remove("hidden");
    searchResults.innerHTML = results
      .slice(0, 10)
      .map((result: any) => {
        const item = result.item;
        const icon = item.type === "App" ? "android" : "article";
        return `
                <a href="${item.slug}" class="block p-3 rounded-lg hover:bg-surface-variant dark:hover:bg-gray-800 transition-colors group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                            <span class="material-icons text-sm">${icon}</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface dark:text-dark-on-surface group-hover:text-primary transition-colors">${escapeHtml(item.title)}</h4>
                            <p class="text-sm text-on-surface-variant dark:text-dark-on-surface-variant line-clamp-2">${escapeHtml(item.description)}</p>
                            <div class="flex gap-2 mt-1">
                                <span class="text-xs px-2 py-0.5 rounded-full bg-surface dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-500">${item.type}</span>
                            </div>
                        </div>
                    </div>
                </a>
            `;
      })
      .join("");
  }
}

export function initSearchComponent() {
  // Update DOM references for current page
  searchButton = document.getElementById("search-button");
  searchModal = document.getElementById("search-modal");
  closeSearch = document.getElementById("close-search");
  searchInput = document.getElementById("search-input") as HTMLInputElement;
  searchResults = document.getElementById("search-results");
  searchStatus = document.getElementById("search-status");

  // Re-attach event listeners
  if (searchButton) {
      searchButton.addEventListener("click", openModal);
  }

  if (closeSearch) {
      closeSearch.addEventListener("click", closeModal);
  }

  if (searchModal) {
      searchModal.addEventListener("click", (e: Event) => {
          if (e.target === searchModal) closeModal();
      });
  }

  if (searchInput) {
      const handleInput = debounce((e: Event) => {
          performSearch((e.target as HTMLInputElement).value);
      }, 300);

      searchInput.addEventListener("input", handleInput);
  }
}

// Initialize on page load and view transitions
initSearchComponent();
document.addEventListener("astro:page-load", initSearchComponent);
