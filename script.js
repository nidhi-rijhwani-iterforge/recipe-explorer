// Get the HTML elements where recipe cards, search and pagination controls will be displayed
const recipeContainer = document.getElementById("recipeContainer");
const paginationContainer = document.getElementById("pagination");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchMessage = document.getElementById("searchMessage");
const cuisineFilter = document.getElementById("cuisineFilter");
const difficultyFilter = document.getElementById("difficultyFilter");
const sortSelect = document.getElementById("sortSelect");
const loadingIndicator = document.getElementById("loadingIndicator");
const statusMessage = document.getElementById("statusMessage");
const clearButton = document.getElementById("clearButton");

let allRecipesCache = null;
const RECIPES_PER_PAGE = 10; // Number of recipes per page

// Debounce : It prevents a function from running too frequently (e.g., typing, scrolling). 
// The function executes only after a delay from the last event. 
function debounce(callback, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

function getCuisineFilter() {
    return new URLSearchParams(window.location.search).get("cuisine") ?? "";
}

function getDifficultyFilter() {
    return new URLSearchParams(window.location.search).get("difficulty") ?? "";
}

function performSearch(query, clearFilters = false) {
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

/** 
 * Check whether the current page is recipes.html
 * Returns:
 *  - true  -> if user is on recipes.html
 *  - false -> for any other page
 */
function isRecipesPage() {
  return window.location.pathname.endsWith("recipes.html");
}

/**
 * REad the current page number from the URL query string.
 */
function getCurrentPage() {
    const searchParams = new URLSearchParams(window.location.search);
    const page = Number(searchParams.get("page"));
    return page >=1 ? page : 1;
}

/**
 * Generate the API URL.
 * If a limit is provided, fetch only that many recipes.
 * Otherwise, fetch all recipes.
 *
 * Example:
 * https://dummyjson.com/recipes?limit=3
 * https://dummyjson.com/recipes
 */
function getSearchQuery() {
    return new URLSearchParams(window.location.search).get("q")?.trim() ?? ""; 
}

function showStatusMessage(message, type = "info") {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = "block";
}

function clearStatusMessage() {
    if (!statusMessage) return;
    statusMessage.textContent = "";
    statusMessage.className = "status-message";
    statusMessage.style.display = "none";
}   

// Get al recipes from the API and store them in cache (avoid multiple API calls)
async function getAllRecipes() {
    // If recipes are already cached, return them instead of making another API call
    if (allRecipesCache) {
        return allRecipesCache;
    }       

    // Fetch recipes from page 1 with up to 100 recipes
    const { recipes } = await fetchRecipes(1, 100);
    // Store the fetched recipes in cache for future use and return them
    allRecipesCache = recipes;
    return recipes;
}

function getRecipeUrl(limit, skip = 0, query = "") {
    const baseUrl = query ? "https://dummyjson.com/recipes/search" : "https://dummyjson.com/recipes";
    const url = new URL(baseUrl);
    url.searchParams.set("limit", limit);
    url.searchParams.set("skip", skip);
    if(query) {
        url.searchParams.set("q", query);
    }
    return url.toString();
}

function getSortOption() {
    return new URLSearchParams(window.location.search).get("sort") ?? "";
}

function showLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = "block";
    }
}

function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = "none";
    }
}

function sortRecipes(recipes, sortBy) {
    if (!sortBy) return recipes;

    return [...recipes].sort((a, b) => {
        if (sortBy === "name-asc") {
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        }
        if (sortBy === "rating-desc") {
            return (b.rating || 0) - (a.rating || 0);
        }

        if (sortBy === "time-asc") {
            return (a.cookTimeMinutes || 0) - (b.cookTimeMinutes || 0);
        }
        return 0;
    });
}

/** Fetch recipe data from the API and Returns an array of recipes. */
async function fetchRecipes(page, limit, query = "") {
    // Calculate how many items to skip based on the current page
    const skip = Math.max(0, (page - 1) * limit);
    // Send request to API
    const response = await fetch(getRecipeUrl(limit, skip, query));
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    // Convert response into JavaScript object
    const data = await response.json();

    // Return recipes array & totaal number of recipes
    // Provide the default values if the API response is missing these fields
    return {
        recipes: data.recipes || [], // List of all recipes
        total: typeof data.total === "number" ? data.total : 0, // Total recipe count
    };
}

/** Create the HTML structure for one recipe card.
 * This function receives a recipe object and returns a string of HTML.
*/
function buildRecipeCard(recipe) {
    const imageSrc = recipe.image || (Array.isArray(recipe.images) && recipe.images[0]) || "https://via.placeholder.com/640x360?text=No+Image";

    return `
    <div class="recipe-card">

        <!-- Recipe Image -->
        <img src="${imageSrc}" alt="${recipe.name}">

        <div class="recipe-content">

        <!-- Recipe Name -->
        <h3>${recipe.name}</h3>

        <!-- Recipe Details -->
        <div class="recipe-info">

            <!-- Cuisine -->
            <span class="info cuisine"> 🍽 ${recipe.cuisine} </span>

            <!-- Difficulty -->
            <span class="info difficulty">🔥 ${recipe.difficulty} </span>

            <!-- Rating -->
            <span class="info rating"> ⭐ ${recipe.rating} </span>

            <!-- Cooking Time -->
            <span class="info time"> ⏱ ${recipe.cookTimeMinutes} mins </span>

            <!-- Meal Type -->
            <span class="info meal"> 🥗 ${recipe.mealType} </span>
        </div>

        <!-- Link to individual recipe page -->
        <a href="single-recipe.html?id=${recipe.id}" class="view-btn">
            View Recipe
        </a>

        </div>
    </div>
    `;
}

/** Display all recipe cards inside the container. */
function renderRecipeContainer(recipes) {
    // Stop if container doesn't exist
    if (!recipeContainer) return;

    // Display a message when there are no recipes to show
    // if (recipes.length === 0) {
    //     recipeContainer.innerHTML = "<p> No Recipes Found!</p>";
    //     return;
    // }

    // Convert every recipe into HTML and insert into page
    recipeContainer.innerHTML = recipes
    .map(buildRecipeCard)
    .join("");
}

// Check the rendering for Search Message
function renderSearchMessage(query, recipes) {
    if(!searchMessage) return;

    if(!query) {
        searchMessage.textContent = "";
        return;
    }

    if(recipes.length === 0) {
        searchMessage.textContent = `No matching recipes found for "${query}".`;
    } else {
        searchMessage.textContent = `Showing recipes for "${query}".`;
    }
}

// Create a pagination button with optional active and disabled
function createPageButton(label, page, disabled = false, active = false) {
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

// Render pagination buttons based on the total recipes and current page
function renderPagination(total, currentPage) {
    // Exit if it doesn't exist
    if(!paginationContainer) return;

    // calculate the total number of pages
    const totalPages = Math.max(1, Math.ceil(total/ RECIPES_PER_PAGE));
    // Hide pagination if there is only one page
    if(totalPages <=1) {
        paginationContainer.innerHTML = "";
        return;
    }

    // Store all pagination buttons
    const pageButtons = [];
    // Add the "Previous" button
    // Disable it when the user is on the first page
    pageButtons.push(createPageButton("Previous", currentPage - 1, currentPage === 1));

    // Create numbered page buttons
    for(let page = 1; page <= totalPages; page +=1) {
        // Check it this is the currentPage
        const isCurrent = page === currentPage;
        
        // Create a page button and current page will be active + disabled
        pageButtons.push(createPageButton(String(page), page, isCurrent, isCurrent));
    }

    // Add the "Next" button and disable it when its on last page
    pageButtons.push(createPageButton("Next", currentPage + 1, currentPage >=totalPages));

    // Render all pagination buttons in the container
    paginationContainer.innerHTML = pageButtons.join("");
}

function setupPaginationListeners(currentPage) {
    if(!paginationContainer) return;

    paginationContainer.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-page]");
        if(!button || button.disabled) return;
            
        const page = Number(button.dataset.page);
        if(Number.isNaN(page) || page === currentPage) return;

        // Update the page number in the URL
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("page", page);
        
        // Reload the page with updated page number
        window.location.search = searchParams.toString();
    });
}

async function populateFilters() {
    const allRecipes = await getAllRecipes();
    const cuisines = [...new Set(allRecipes.map(r => r.cuisine))].filter(Boolean).sort();

    cuisineFilter.innerHTML =
        `<option value="">All Cuisines</option>` +
        cuisines
            .map(c => `<option value="${c}">${c}</option>`)
            .join("");

    cuisineFilter.value = getCuisineFilter();
    difficultyFilter.value = getDifficultyFilter();
    sortSelect.value = getSortOption();
}


// Setup Event Listeners for Search
function setupSearchListeners() {
    if (!searchForm || !searchInput) return;

    const debouncedSearch = debounce(() => {
        performSearch(searchInput.value.trim());
    }, 500);

    // Search after user stops typing
    searchInput.addEventListener("input", debouncedSearch);

    // Search immediately when Enter is pressed
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

/** Main function responsible for:
 * 1. Fetching recipes
 * 2. Rendering them on the page
*/
async function loadRecipes() {
    if (!recipeContainer) return;

    try {
        clearStatusMessage();
        showLoading();
        const currentPage = isRecipesPage() ? getCurrentPage() : 1;
        const query = isRecipesPage() ? getSearchQuery() : "";

        let filteredRecipes = [];
        if (!isRecipesPage()) {
            const { recipes } = await fetchRecipes(1,3, "");
            filteredRecipes = recipes;
        } else {
            const allRecipes = await getAllRecipes();
            filteredRecipes = allRecipes;
            if (query) {
                const normalizedQuery = query.toLowerCase();
                filteredRecipes = filteredRecipes.filter(recipe =>
                    recipe.name.toLowerCase().includes(normalizedQuery)
                );
            }
        }

        const cuisine = getCuisineFilter();
        const difficulty = getDifficultyFilter();

        // Apply filters on complete data
        if (cuisine) {
            filteredRecipes = filteredRecipes.filter(
                recipe => recipe.cuisine === cuisine
            );
        }

        if (difficulty) {
            filteredRecipes = filteredRecipes.filter(
                recipe => recipe.difficulty === difficulty
            );
        }

        const sortOption = getSortOption();
        filteredRecipes = sortRecipes(filteredRecipes, sortOption);

        // Total after filtering
        const total = filteredRecipes.length;

        // Pagination slicing
        const startIndex = (currentPage - 1) * RECIPES_PER_PAGE;
        const endIndex = startIndex + RECIPES_PER_PAGE;

        const recipesForCurrentPage = filteredRecipes.slice(
            startIndex,
            endIndex
        );

        if (searchInput) {
            searchInput.value = query;
        }

        renderRecipeContainer(recipesForCurrentPage);

        renderSearchMessage(
            query,
            filteredRecipes
        );

        if (isRecipesPage() && paginationContainer) {
            renderPagination(total, currentPage);
            setupPaginationListeners(currentPage);
        }

    } catch (error) {
        console.error("Failed to load recipes:", error);
        renderRecipeContainer([]);
        if(searchMessage) {
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
            if(paginationContainer) {
                paginationContainer.innerHTML = "";
            }
            showStatusMessage("Unable to load recipes page. Please try again later.", "error");
        }
    } else {
        await loadRecipes();
    }
})();
