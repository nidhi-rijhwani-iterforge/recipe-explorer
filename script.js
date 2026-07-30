// Get the HTML elements where recipe cards and pagination controls will be displayed
const recipeContainer = document.getElementById("recipeContainer");
const paginationContainer = document.getElementById("pagination");

const RECIPES_PER_PAGE = 10; // Number of recipes per page

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
function getRecipeUrl(limit, skip = 0) {
    const baseUrl = "https://dummyjson.com/recipes";
    return `${baseUrl}?limit=${limit}&skip=${skip}`;
}

/** Fetch recipe data from the API and Returns an array of recipes. */
async function fetchRecipes(page, limit) {
    // Calculate how many items to skip based on the current page
    const skip = Math.max(0, (page - 1) * limit);
    // Send request to API
    const response = await fetch(getRecipeUrl(limit, skip));
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
    return `
    <div class="recipe-card">

        <!-- Recipe Image -->
        <img src="${recipe.image}" alt="${recipe.name}">

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
    if (recipes.length === 0) {
        recipeContainer.innerHTML = "<p> No Recipes Found!</p>";
        return;
    }
    // Convert every recipe into HTML and insert into page
    recipeContainer.innerHTML = recipes
    .map(buildRecipeCard)
    .join("");
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

/** Main function responsible for:
 * 1. Fetching recipes
 * 2. Rendering them on the page
*/
async function loadRecipes() {
    // Stop execution if container isn't available
    if (!recipeContainer) return;

    try {
        const currentPage = isRecipesPage() ? getCurrentPage() : 1;
        const limit = isRecipesPage() ? RECIPES_PER_PAGE : 3;
        const { recipes, total } = await fetchRecipes(currentPage, limit);

        renderRecipeContainer(recipes);

        if (isRecipesPage() && paginationContainer) {
            renderPagination(total, currentPage);
            setupPaginationListeners(currentPage);
        }
    } catch (error) {
    // Show error in console if API request fails
    console.error("Failed to load recipes:", error);
    }
}

// Start loading recipes as soon as this file runs
loadRecipes();