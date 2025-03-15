// Nutrition tracking tests with real API calls
describe('Nutrition Tracking', () => {
  beforeEach(() => {
    // Login before each test using localStorage method
    cy.loginByLocalStorage();
    
    // Set up API aliases
    cy.intercept('GET', '**/api/nutrition/categories/**').as('getCategories');
    cy.intercept('GET', '**/api/nutrition/foods/**').as('getFoods');
    cy.intercept('GET', '**/api/nutrition/foods/favorites/**').as('getFavorites');
    cy.intercept('GET', '**/api/nutrition/meal-types/**').as('getMealTypes');
    cy.intercept('GET', '**/api/nutrition/meals/summary/**').as('getDailySummary');
    cy.intercept('POST', '**/api/nutrition/meals/**').as('createMealEntry');
    cy.intercept('POST', '**/api/nutrition/foods/*/favorite/**').as('addToFavorites');
    cy.intercept('POST', '**/api/nutrition/foods/*/unfavorite/**').as('removeFromFavorites');
    cy.intercept('DELETE', '**/api/nutrition/meals/**').as('deleteMealEntry');
    cy.intercept('POST', '**/api/nutrition/foods/**').as('createCustomFood');
    cy.intercept('PATCH', '**/api/nutrition/goals/**').as('updateGoals');
  });

  it('should load the nutrition page successfully', () => {
    // Visit the nutrition page
    cy.visit('/nutrition');
    
    // Check that the page title is visible
    cy.contains('h2', 'Nutrition Tracker').should('be.visible');
    
    // Wait for API calls to complete
    cy.wait('@getCategories');
    cy.wait('@getMealTypes');
    cy.wait('@getDailySummary');
    
    // Check that the date selector is visible
    cy.contains('Today').should('be.visible');
    
    // Check that the main sections are visible
    cy.contains('Daily Progress').should('be.visible');
    cy.contains('Nutrition Breakdown').should('be.visible');
    cy.contains('Add Food').should('be.visible');
    cy.contains('Today\'s Meals').should('be.visible');
  });

  it('should search for foods successfully', () => {
    cy.visit('/nutrition');
    
    // Wait for initial data to load
    cy.wait('@getCategories');
    cy.wait('@getMealTypes');
    
    // Type in the search box
    cy.get('[data-testid="food-search-input"]').type('apple');
    
    // Click the search button
    cy.get('[data-testid="search-button"]').click();
    
    // Wait for search results
    cy.wait('@getFoods');
    
    // Check that search results are displayed
    cy.get('[data-testid="food-search-results"]').should('exist');
    
    // There should be at least one result (assuming the database has apple-related foods)
    cy.get('[data-testid="food-search-results"]').find('.mantine-Card-root').should('have.length.at.least', 1);
  });

  it('should add a food to the meal log', () => {
    cy.visit('/nutrition');
    
    // Wait for initial data to load
    cy.wait('@getCategories');
    cy.wait('@getMealTypes');
    cy.wait('@getDailySummary');
    
    // Search for a food
    cy.get('[data-testid="food-search-input"]').type('apple');
    cy.get('[data-testid="search-button"]').click();
    cy.wait('@getFoods');
    
    // Click the "Add" button on a food item
    cy.get('[data-testid="add-food-button"]').first().click();
    
    // Check that the add food modal is open
    cy.contains('Add Food to Log').should('be.visible');
    
    // Select a meal type if not already selected
    cy.get('input[placeholder="Select meal type"]').parent().click();
    cy.contains('Breakfast').click();
    
    // Set servings
    cy.get('input[placeholder="Number of servings"]').clear().type('1.5');
    
    // Add notes
    cy.get('textarea[placeholder="Add any notes about this food"]').type('Test note');
    
    // Click the "Add to Log" button
    cy.contains('button', 'Add to Log').click();
    
    // Wait for the API call to complete
    cy.wait('@createMealEntry');
    
    // Verify the meal was added
    cy.wait('@getDailySummary');
    cy.get('[data-testid="meal-list"]').should('contain', 'Apple');
  });

  it('should toggle food favorites', () => {
    cy.visit('/nutrition');
    
    // Wait for initial data to load
    cy.wait('@getCategories');
    cy.wait('@getMealTypes');
    
    // Search for a food
    cy.get('[data-testid="food-search-input"]').type('apple');
    cy.get('[data-testid="search-button"]').click();
    cy.wait('@getFoods');
    
    // Get the first food item
    cy.get('.mantine-Card-root').first().within(() => {
      // Check if it's already a favorite
      cy.get('[data-testid="star-filled-icon"]').then(($star) => {
        if ($star.length > 0) {
          // If it's already a favorite, unfavorite it
          cy.get('[data-testid="star-filled-icon"]').click();
          cy.wait('@removeFromFavorites');
          
          // Verify it's no longer a favorite
          cy.get('[data-testid="star-icon"]').should('exist');
        } else {
          // If it's not a favorite, favorite it
          cy.get('[data-testid="star-icon"]').click();
          cy.wait('@addToFavorites');
          
          // Verify it's now a favorite
          cy.get('[data-testid="star-filled-icon"]').should('exist');
        }
      });
    });
  });

  it('should navigate to the custom food creation page', () => {
    cy.visit('/nutrition');
    
    // Click the "Add Custom Food" button
    cy.contains('button', 'Add Custom Food').click();
    
    // Verify navigation to the custom food page
    cy.url().should('include', '/nutrition/create');
    cy.contains('Create Custom Food').should('be.visible');
  });

  it('should create a custom food', () => {
    cy.visit('/nutrition/create');
    
    // Wait for categories to load
    cy.wait('@getCategories');
    
    // Generate a unique food name to avoid duplicates
    const uniqueFoodName = `Test Food ${Date.now()}`;
    
    // Fill out the form
    cy.get('input[placeholder*="e.g., Homemade Granola"]').type(uniqueFoodName);
    cy.get('input[placeholder*="e.g., Homemade"]').type('Test Brand');
    
    // Select a category
    cy.get('input[placeholder="Select a category"]').parent().click();
    cy.contains('li', /Snacks|Protein|Fruits/).click();
    
    // Fill out serving information
    cy.get('input[placeholder="100"]').clear().type('200');
    cy.get('input[placeholder="g, ml, oz, etc."]').clear().type('g');
    
    // Fill out nutrition facts
    cy.get('input[placeholder="0"]').eq(0).clear().type('250'); // Calories
    cy.get('input[placeholder="0"]').eq(1).clear().type('10');  // Protein
    cy.get('input[placeholder="0"]').eq(2).clear().type('30');  // Carbs
    cy.get('input[placeholder="0"]').eq(3).clear().type('12');  // Fat
    
    // Submit the form
    cy.contains('button', 'Create Food').click();
    
    // Wait for the API call to complete
    cy.wait('@createCustomFood');
    
    // Verify success message
    cy.contains('Custom food created successfully').should('be.visible');
  });

  it('should navigate to the stats page', () => {
    cy.visit('/nutrition');
    
    // Click the "Stats" button
    cy.contains('button', 'Stats').click();
    
    // Verify navigation to the stats page
    cy.url().should('include', '/nutrition/stats');
    cy.contains('Nutrition Statistics').should('be.visible');
  });

  it('should update nutrition goals', () => {
    cy.visit('/nutrition');
    
    // Wait for initial data to load
    cy.wait('@getDailySummary');
    
    // Click the "Goals" button
    cy.contains('button', 'Goals').click();
    
    // Verify the goals modal is open
    cy.contains('Nutrition Goals').should('be.visible');
    
    // Update the calorie target
    cy.get('input[placeholder="Enter calorie target"]').clear().type('2500');
    
    // Update macros
    cy.get('input[placeholder="Protein"]').clear().type('150');
    cy.get('input[placeholder="Carbs"]').clear().type('250');
    cy.get('input[placeholder="Fat"]').clear().type('80');
    
    // Save the changes
    cy.contains('button', 'Save Goals').click();
    
    // Wait for the API call to complete
    cy.wait('@updateGoals');
    cy.wait('@getDailySummary');
    
    // Verify the goals were updated
    cy.contains('button', 'Goals').click();
    cy.get('input[placeholder="Enter calorie target"]').should('have.value', '2500');
    cy.get('input[placeholder="Protein"]').should('have.value', '150');
    cy.get('input[placeholder="Carbs"]').should('have.value', '250');
    cy.get('input[placeholder="Fat"]').should('have.value', '80');
  });

  it('should delete a meal entry', () => {
    // First add a meal to ensure we have something to delete
    cy.visit('/nutrition');
    
    // Wait for initial data to load
    cy.wait('@getCategories');
    cy.wait('@getMealTypes');
    cy.wait('@getDailySummary');
    
    // Search for a food
    cy.get('[data-testid="food-search-input"]').type('apple');
    cy.get('[data-testid="search-button"]').click();
    cy.wait('@getFoods');
    
    // Click the "Add" button on a food item
    cy.get('[data-testid="add-food-button"]').first().click();
    
    // Select a meal type
    cy.get('input[placeholder="Select meal type"]').parent().click();
    cy.contains('Breakfast').click();
    
    // Add to log
    cy.contains('button', 'Add to Log').click();
    cy.wait('@createMealEntry');
    cy.wait('@getDailySummary');
    
    // Now delete the meal
    cy.get('[data-testid="meal-list"]').find('[data-testid="delete-meal-button"]').first().click();
    
    // Confirm deletion
    cy.contains('button', 'Delete').click();
    
    // Wait for the API call to complete
    cy.wait('@deleteMealEntry');
    cy.wait('@getDailySummary');
  });
}); 