# Recipe Explorer

A simple recipe website with a landing page, a searchable recipe list, and a detail view for each recipe.

## Files

- `index.html` — Home page with hero section and featured card list.
- `recipes.html` — Searchable recipe list with filtering and pagination.
- `single-recipe.html` — Detailed recipe page using the recipe ID from the URL.
- `style.css` — Global layout and design styles.
- `responsive.css` — Mobile and tablet responsive adjustments.
- `script.ts` — Typescript source code for recipe data fetching, search, filtering and rendering.
- `script.js` — Compiled plain Javascript runtime used by the HTML pages.
- `tsconfig.json` — Typescript compiler configuration for building `script.ts` into `script.js`.

## Usage

1. Open `index.html` in a browser.
2. Click `Recipes` to go to the recipes listing.
3. Search and filter recipes.
4. Click `View Recipe` to open the detail page.
5. Click `Save` to make it Favorite.
6. Click `Favorites` to open the save recipes.

## Notes

- The project uses `https://dummyjson.com/recipes` for recipe data.
- If the API is unavailable, the page shows a friendly error message.
- The Javascript runtime file `script.js` is generated from the Typescript source `script.ts`.
- Use the Typescript compiler (`tsc`) to rebuild `script.js` after changes to `script.ts`.

## Typescript Commands

Use one of the following commands from the project root:
- Install Typescript globally : npm install -g typescript
- Install Typescript locally : npm install --save-dev typescript
- Compile : tsc  
