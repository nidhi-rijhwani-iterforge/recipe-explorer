// Get the HTML element where all recipe cards will be displayed
const recipeContainer = document.getElementById("recipeContainer");

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
 * Generate the API URL.
 * If a limit is provided, fetch only that many recipes.
 * Otherwise, fetch all recipes.
 *
 * Example:
 * https://dummyjson.com/recipes?limit=3
 * https://dummyjson.com/recipes
 */
function getRecipeUrl(limit) {
  const baseUrl = "https://dummyjson.com/recipes";

  return typeof limit === "number"
    ? `${baseUrl}?limit=${limit}`
    : baseUrl;
}

/** Fetch recipe data from the API and Returns an array of recipes. */
async function fetchRecipes(limit) {
  // Send request to API
  const response = await fetch(getRecipeUrl(limit));

  // Convert response into JavaScript object
  const data = await response.json();

  // Return recipes array
  // If recipes doesn't exist, return an empty array
  return data.recipes || [];
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
        <a href="recipe.html?id=${recipe.id}" class="view-btn">
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

  // Convert every recipe into HTML and insert into page
  recipeContainer.innerHTML = recipes
    .map(buildRecipeCard)
    .join("");
}

/** Main function responsible for:
 * 1. Fetching recipes
 * 2. Rendering them on the page
*/
async function loadRecipes() {
  // Stop execution if container isn't available
  if (!recipeContainer) return;

  try {
    // If we're on recipes.html,
    // fetch all recipes.
    // Otherwise (like homepage),
    // fetch only the first 3 recipes.
    const recipes = await fetchRecipes(
      isRecipesPage() ? undefined : 3
    );
    // Display recipes
    renderRecipeContainer(recipes);

  } catch (error) {
    // Show error in console if API request fails
    console.error("Failed to load recipes:", error);

  }
}

// Start loading recipes as soon as this file runs
loadRecipes();