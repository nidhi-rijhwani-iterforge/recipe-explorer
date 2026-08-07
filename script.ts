// Recipe Explorer TypeScript source

type Recipe = {
    id: number | string;
    name: string;
    cuisine?: string;
    difficulty?: string;
    rating?: number;
    cookTimeMinutes?: number;
    mealType?: string;
    image?: string;
    images?: string[];
    description?: string;
    ingredients?: string[];
    instructions?: string[];
    [key: string]: unknown;
};

type SearchResponse = {
    recipes: Recipe[];
    total: number;
};

const recipeContainer = document.getElementById("recipeContainer") as HTMLElement | null;
const favoriteContainer = document.getElementById("favoriteContainer") as HTMLElement | null;
const recipeDetailContent = document.getElementById("recipeDetailContent") as HTMLElement | null;
const paginationContainer = document.getElementById("pagination") as HTMLElement | null;
const searchForm = document.getElementById("searchForm") as HTMLFormElement | null;
const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
const searchMessage = document.getElementById("searchMessage") as HTMLElement | null;
const cuisineFilter = document.getElementById("cuisineFilter") as HTMLSelectElement | null;
const difficultyFilter = document.getElementById("difficultyFilter") as HTMLSelectElement | null;
const sortSelect = document.getElementById("sortSelect") as HTMLSelectElement | null;
const loadingIndicator = document.getElementById("loadingIndicator") as HTMLElement | null;
const statusMessage = document.getElementById("statusMessage") as HTMLElement | null;
const clearButton = document.getElementById("clearButton") as HTMLElement | null;

let allRecipesCache: Recipe[] | null = null;
const RECIPES_PER_PAGE = 10;
const FAVORITES_STORAGE_KEY = "favoriteRecipes";

function isSingleRecipePage(): boolean {
    return window.location.pathname.endsWith("single-recipe.html");
}

function isFavoritesPage(): boolean {
    return window.location.pathname.endsWith("favorites.html");
}

function isRecipesPage(): boolean {
    return window.location.pathname.endsWith("recipes.html");
}

function getFavorites(): Recipe[] {
    try {
        const rawValue = localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]";
        const favorites = JSON.parse(rawValue) as unknown;
        return Array.isArray(favorites) ? (favorites as Recipe[]) : [];
    } catch (error) {
        console.error("Could not read favorites:", error);
        return [];
    }
}

function saveFavorites(favorites: Recipe[]): void {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

function toggleFavorite(recipe: Recipe): void {
    const favorites = getFavorites();
    const exists = favorites.some((item) => item.id === recipe.id);

    if (exists) {
        saveFavorites(favorites.filter((item) => item.id !== recipe.id));
    } else {
        favorites.push(recipe);
        saveFavorites(favorites);
    }
}

function isFavorite(recipeId: number | string): boolean {
    return getFavorites().some((item) => item.id === recipeId);
}

function getRecipeById(recipeId: string | null): Recipe | null {
    return allRecipesCache?.find((recipe) => String(recipe.id) === String(recipeId)) ?? null;
}

function debounce<T extends unknown[]>(callback: (...args: T) => void, delay: number) {
    let timeoutId: number | undefined;

    return (...args: T): void => {
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId);
        }

        timeoutId = window.setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

function getCuisineFilter(): string {
    return new URLSearchParams(window.location.search).get("cuisine") ?? "";
}

function getDifficultyFilter(): string {
    return new URLSearchParams(window.location.search).get("difficulty") ?? "";
}

function getSortOption(): string {
    return new URLSearchParams(window.location.search).get("sort") ?? "";
}

function getSearchQuery(): string {
    return new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
}

function performSearch(query: string, clearFilters = false): void {
    const params = new URLSearchParams(window.location.search);

    if (query) {
        params.set("q", query);
    } else {
        params.delete("q");
    }

    if (clearFilters) {
        params.delete("cuisine");
        params.delete("difficulty");
        params.delete("sort");

        if (cuisineFilter) cuisineFilter.value = "";
        if (difficultyFilter) difficultyFilter.value = "";
        if (sortSelect) sortSelect.value = "";
    } else {
        if (cuisineFilter?.value) {
            params.set("cuisine", cuisineFilter.value);
        } else {
            params.delete("cuisine");
        }

        if (difficultyFilter?.value) {
            params.set("difficulty", difficultyFilter.value);
        } else {
            params.delete("difficulty");
        }

        if (sortSelect?.value) {
            params.set("sort", sortSelect.value);
        } else {
            params.delete("sort");
        }
    }

    params.set("page", "1");
    window.location.search = params.toString();
}

function showStatusMessage(message: string, type = "info"): void {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = "block";
}

function clearStatusMessage(): void {
    if (!statusMessage) return;
    statusMessage.textContent = "";
    statusMessage.className = "status-message";
    statusMessage.style.display = "none";
}

async function getAllRecipes(): Promise<Recipe[]> {
    if (allRecipesCache) {
        return allRecipesCache;
    }

    const { recipes } = await fetchRecipes(1, 100);
    allRecipesCache = recipes;
    return recipes;
}

function getRecipeUrl(limit: number, skip = 0, query = ""): string {
    const baseUrl = query ? "https://dummyjson.com/recipes/search" : "https://dummyjson.com/recipes";
    const url = new URL(baseUrl);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("skip", String(skip));

    if (query) {
        url.searchParams.set("q", query);
    }

    return url.toString();
}

function showLoading(): void {
    if (loadingIndicator) {
        loadingIndicator.style.display = "block";
    }
}

function hideLoading(): void {
    if (loadingIndicator) {
        loadingIndicator.style.display = "none";
    }
}

function sortRecipes(recipes: Recipe[], sortBy: string): Recipe[] {
    if (!sortBy) return recipes;

    return [...recipes].sort((a, b) => {
        if (sortBy === "name-asc") {
            return String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" });
        }

        if (sortBy === "rating-desc") {
            return (b.rating ?? 0) - (a.rating ?? 0);
        }

        if (sortBy === "time-asc") {
            return (a.cookTimeMinutes ?? 0) - (b.cookTimeMinutes ?? 0);
        }

        return 0;
    });
}

async function fetchRecipes(page: number, limit: number, query = ""): Promise<SearchResponse> {
    const skip = Math.max(0, (page - 1) * limit);
    const response = await fetch(getRecipeUrl(limit, skip, query));

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
        recipes: Array.isArray(data.recipes) ? (data.recipes as Recipe[]) : [],
        total: typeof data.total === "number" ? data.total : 0,
    };
}

function buildRecipeCard(recipe: Recipe): string {
    const imageSrc = recipe.image || (Array.isArray(recipe.images) ? recipe.images[0] : undefined) ||
        "https://via.placeholder.com/640x360?text=No+Image";
    const favoriteActiveClass = isFavorite(recipe.id) ? " active" : "";

    return `
    <div class="recipe-card">
        <img src="${imageSrc}" alt="${recipe.name}">
        <div class="recipe-content">
            <h3>${recipe.name}</h3>
            <div class="recipe-info">
                <span class="info cuisine"> 🍽 ${recipe.cuisine ?? "Unknown"} </span>
                <span class="info difficulty">🔥 ${recipe.difficulty ?? "N/A"} </span>
                <span class="info rating"> ⭐ ${recipe.rating ?? "—"} </span>
                <span class="info time"> ⏱ ${recipe.cookTimeMinutes ?? "—"} mins </span>
                <span class="info meal"> 🥗 ${recipe.mealType ?? "—"} </span>
            </div>
            <div class="card-actions">
                <a href="single-recipe.html?id=${recipe.id}" class="view-btn">
                    View Recipe
                </a>
                <button type="button" class="favorite-btn${favoriteActiveClass}" data-recipe-id="${recipe.id}" data-recipe="${encodeURIComponent(JSON.stringify(recipe))}">
                    ${isFavorite(recipe.id) ? "★ Saved" : "☆ Save"}
                </button>
            </div>
        </div>
    </div>
    `;
}

function renderRecipeContainer(recipes: Recipe[]): void {
    if (!recipeContainer) return;
    recipeContainer.innerHTML = recipes.map(buildRecipeCard).join("");
}

function renderFavorites(): void {
    if (!favoriteContainer) return;

    const favorites = getFavorites();

    if (favorites.length === 0) {
        favoriteContainer.innerHTML = `
            <div class="empty-state">
                <h3>No favorite recipes yet.</h3>
                <p>Save recipes from the recipes page to see them here.</p>
                <a href="recipes.html">Browse recipes</a>
            </div>
        `;
        return;
    }

    favoriteContainer.innerHTML = favorites.map((recipe) => buildRecipeCard(recipe)).join("");
}

function renderRecipeDetail(recipe: Recipe | null): void {
    if (!recipeDetailContent) return;

    if (!recipe) {
        recipeDetailContent.innerHTML = `
            <div class="empty-state">
                <h3>Recipe not found.</h3>
                <p>The requested recipe could not be loaded.</p>
                <a href="recipes.html">Back to recipes</a>
            </div>
        `;
        return;
    }

    const imageSrc = recipe.image || (Array.isArray(recipe.images) ? recipe.images[0] : undefined) ||
        "https://via.placeholder.com/640x360?text=No+Image";
    const isSaved = isFavorite(recipe.id);

    recipeDetailContent.innerHTML = `
        <div class="recipe-detail-card">
            <img src="${imageSrc}" alt="${recipe.name}">
            <div class="recipe-detail-content">
                <h1>${recipe.name}</h1>
                <div class="recipe-meta">
                    <span>🍽 ${recipe.cuisine ?? "Unknown"}</span>
                    <span>🔥 ${recipe.difficulty ?? "N/A"}</span>
                    <span>⭐ ${recipe.rating ?? "—"}</span>
                    <span>⏱ ${recipe.cookTimeMinutes ?? "—"} mins</span>
                    <span>🥗 ${recipe.mealType ?? "—"}</span>
                </div>
                <p class="recipe-description">${recipe.description ?? "A delicious recipe waiting to be tried."}</p>
                <button type="button" class="favorite-btn ${isSaved ? "active" : ""}" data-recipe-id="${recipe.id}" data-recipe="${encodeURIComponent(JSON.stringify(recipe))}">
                    ${isSaved ? "★ Saved to Favorites" : "☆ Add to Favorites"}
                </button>
                <h2>Ingredients</h2>
                <ul>
                    ${(recipe.ingredients ?? []).map((ingredient) => `<li>${ingredient}</li>`).join("")}
                </ul>
                <h2>Instructions</h2>
                <ul>
                    ${(recipe.instructions ?? []).map((step) => `<li>${step}</li>`).join("")}
                </ul>
            </div>
        </div>
    `;
}

function renderSearchMessage(query: string, recipes: Recipe[]): void {
    if (!searchMessage) return;

    if (!query) {
        searchMessage.textContent = "";
        return;
    }

    searchMessage.textContent = recipes.length === 0
        ? `No matching recipes found for "${query}".`
        : `Showing recipes for "${query}".`;
}

function createPageButton(label: string, page: number, disabled = false, active = false): string {
    return `
        <button
            type="button"
            class="page-button${active ? " active" : ""}"
            data-page="${page}"
            ${disabled ? "disabled" : ""}
        >
            ${label}
        </button>
    `;
}

function renderPagination(total: number, currentPage: number): void {
    if (!paginationContainer) return;

    const totalPages = Math.max(1, Math.ceil(total / RECIPES_PER_PAGE));
    if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        return;
    }

    const pageButtons: string[] = [];
    pageButtons.push(createPageButton("Previous", currentPage - 1, currentPage === 1));

    for (let page = 1; page <= totalPages; page += 1) {
        const isCurrent = page === currentPage;
        pageButtons.push(createPageButton(String(page), page, isCurrent, isCurrent));
    }

    pageButtons.push(createPageButton("Next", currentPage + 1, currentPage >= totalPages));
    paginationContainer.innerHTML = pageButtons.join("");
}

function setupPaginationListeners(currentPage: number): void {
    if (!paginationContainer) return;

    paginationContainer.addEventListener("click", (event) => {
        const button = (event.target as Element).closest("button[data-page]") as HTMLButtonElement | null;
        if (!button || button.disabled) return;

        const page = Number(button.dataset.page);
        if (Number.isNaN(page) || page === currentPage) return;

        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("page", String(page));
        window.location.search = searchParams.toString();
    });
}

async function populateFilters(): Promise<void> {
    if (!cuisineFilter || !difficultyFilter || !sortSelect) return;

    const allRecipes = await getAllRecipes();
    const cuisines = [...new Set(allRecipes.map((recipe) => recipe.cuisine).filter(Boolean))].sort() as string[];

    cuisineFilter.innerHTML =
        `<option value="">All Cuisines</option>` +
        cuisines.map((c) => `<option value="${c}">${c}</option>`).join(" ");

    cuisineFilter.value = getCuisineFilter();
    difficultyFilter.value = getDifficultyFilter();
    sortSelect.value = getSortOption();
}

function setupSearchListeners(): void {
    if (!searchForm || !searchInput) return;

    const debouncedSearch = debounce(() => {
        performSearch(searchInput.value.trim());
    }, 500);

    searchInput.addEventListener("input", debouncedSearch);

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        performSearch(searchInput.value.trim(), true);
    });

    if (clearButton) {
        clearButton.addEventListener("click", () => {
            searchInput.value = "";
            performSearch("", true);
        });
    }

    if (cuisineFilter) {
        cuisineFilter.addEventListener("change", () => {
            performSearch(searchInput.value.trim());
        });
    }

    if (difficultyFilter) {
        difficultyFilter.addEventListener("change", () => {
            performSearch(searchInput.value.trim());
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            performSearch(searchInput.value.trim());
        });
    }
}

function getCurrentPage(): number {
    const searchParams = new URLSearchParams(window.location.search);
    const page = Number(searchParams.get("page"));
    return page >= 1 ? page : 1;
}

async function loadRecipes(): Promise<void> {
    if (!recipeContainer) return;

    try {
        clearStatusMessage();
        showLoading();
        const currentPage = isRecipesPage() ? getCurrentPage() : 1;
        const query = isRecipesPage() ? getSearchQuery() : "";

        let filteredRecipes: Recipe[] = [];

        if (!isRecipesPage()) {
            const { recipes } = await fetchRecipes(1, 3, "");
            filteredRecipes = recipes;
            allRecipesCache = recipes;
        } else {
            const allRecipes = await getAllRecipes();
            filteredRecipes = allRecipes;

            if (query) {
                const normalizedQuery = query.toLowerCase();
                filteredRecipes = filteredRecipes.filter((recipe) =>
                    recipe.name.toLowerCase().includes(normalizedQuery)
                );
            }
        }

        const cuisine = getCuisineFilter();
        const difficulty = getDifficultyFilter();

        if (cuisine) {
            filteredRecipes = filteredRecipes.filter((recipe) => recipe.cuisine === cuisine);
        }

        if (difficulty) {
            filteredRecipes = filteredRecipes.filter((recipe) => recipe.difficulty === difficulty);
        }

        filteredRecipes = sortRecipes(filteredRecipes, getSortOption());

        const total = filteredRecipes.length;
        const startIndex = (currentPage - 1) * RECIPES_PER_PAGE;
        const recipesForCurrentPage = filteredRecipes.slice(startIndex, startIndex + RECIPES_PER_PAGE);

        if (searchInput) {
            searchInput.value = query;
        }

        renderRecipeContainer(recipesForCurrentPage);
        renderSearchMessage(query, filteredRecipes);

        if (isRecipesPage() && paginationContainer) {
            renderPagination(total, currentPage);
            setupPaginationListeners(currentPage);
        }
    } catch (error) {
        console.error("Failed to load recipes:", error);
        renderRecipeContainer([]);

        if (searchMessage) {
            searchMessage.textContent = "";
        }

        showStatusMessage("Unable to load recipes. Please try again later.", "error");

        if (paginationContainer) {
            paginationContainer.innerHTML = "";
        }
    } finally {
        hideLoading();
    }
}

async function loadSingleRecipe(): Promise<void> {
    if (!recipeDetailContent) return;

    try {
        const params = new URLSearchParams(window.location.search);
        const recipeId = params.get("id");

        if (!recipeId) {
            renderRecipeDetail(null);
            return;
        }

        let recipe = getRecipeById(recipeId);

        if (!recipe) {
            const { recipes } = await fetchRecipes(1, 100, "");
            allRecipesCache = recipes;
            recipe = getRecipeById(recipeId);
        }

        renderRecipeDetail(recipe);
    } catch (error) {
        console.error("Failed to load recipe detail:", error);
        renderRecipeDetail(null);
    }
}

function attachFavoriteListeners(): void {
    document.addEventListener("click", (event) => {
        const button = (event.target as Element).closest(".favorite-btn") as HTMLButtonElement | null;
        if (!button) return;

        const recipeId = button.dataset.recipeId ?? null;
        let recipe = getRecipeById(recipeId);

        if (!recipe) {
            try {
                recipe = JSON.parse(decodeURIComponent(button.dataset.recipe ?? "")) as Recipe;
            } catch (error) {
                console.error("Could not parse favorite recipe data:", error);
                return;
            }
        }

        if (!recipe) return;

        toggleFavorite(recipe);

        if (isFavoritesPage()) {
            renderFavorites();
        } else if (isSingleRecipePage()) {
            renderRecipeDetail(recipe);
        } else if (recipeContainer) {
            loadRecipes();
        }
    });
}

(async () => {
    if (isRecipesPage()) {
        try {
            await populateFilters();
            setupSearchListeners();
            await loadRecipes();
        } catch (error) {
            console.error("Failed to initialize recipes page:", error);
            hideLoading();
            renderRecipeContainer([]);

            if (paginationContainer) {
                paginationContainer.innerHTML = "";
            }

            showStatusMessage("Unable to load recipes page. Please try again later.", "error");
        }
    } else if (isSingleRecipePage()) {
        await loadSingleRecipe();
    } else if (isFavoritesPage()) {
        renderFavorites();
    } else {
        await loadRecipes();
    }

    attachFavoriteListeners();
})();
