// Nutrition tracking tests with mocked API responses
describe('Nutrition Tracking (Mocked)', function() {
  beforeEach(function() {
    // Login before each test using localStorage method
    cy.loginByLocalStorage();
    
    // Load fixture data
    cy.fixture('nutrition.json').then(function(nutritionData) {
      this.nutritionData = nutritionData;
      
      // Intercept API calls and return mock data
      cy.intercept('GET', '**/api/nutrition/categories/**', {
        statusCode: 200,
        body: nutritionData.categories
      }).as('getCategories');
      
      cy.intercept('GET', '**/api/nutrition/foods/**', {
        statusCode: 200,
        body: nutritionData.foods
      }).as('getFoods');
      
      cy.intercept('GET', '**/api/nutrition/foods/favorites/**', {
        statusCode: 200,
        body: nutritionData.favorites
      }).as('getFavorites');
      
      cy.intercept('GET', '**/api/nutrition/meal-types/**', {
        statusCode: 200,
        body: nutritionData.mealTypes
      }).as('getMealTypes');
      
      cy.intercept('GET', '**/api/nutrition/meals/summary/**', {
        statusCode: 200,
        body: nutritionData.dailySummary
      }).as('getDailySummary');
      
      cy.intercept('POST', '**/api/nutrition/meals/**', (req) => {
        req.reply({
          statusCode: 200,
          body: {
            id: 'new-meal-id',
            ...req.body,
            calories: 52,
            protein: 0.3,
            carbs: 14,
            fat: 0.2
          }
        });
      }).as('createMealEntry');
      
      cy.intercept('POST', '**/api/nutrition/foods/*/favorite/**', { 
        statusCode: 200 
      }).as('addToFavorites');
      
      cy.intercept('POST', '**/api/nutrition/foods/*/unfavorite/**', { 
        statusCode: 200 
      }).as('removeFromFavorites');
      
      cy.intercept('DELETE', '**/api/nutrition/meals/**', { 
        statusCode: 200 
      }).as('deleteMealEntry');
      
      cy.intercept('POST', '**/api/nutrition/foods/**', (req) => {
        req.reply({
          statusCode: 200,
          body: {
            id: 'new-food-id',
            ...req.body,
            is_verified: false,
            is_custom: true,
            created_by: 'user123',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
      }).as('createCustomFood');
      
      cy.intercept('PATCH', '**/api/nutrition/goals/**', (req) => {
        req.reply({
          statusCode: 200,
          body: {
            ...nutritionData.nutritionGoal,
            ...req.body
          }
        });
      }).as('updateGoals');
    });
  });

  it('should load the nutrition page successfully with mocked data', function() {
    // Visit the nutrition page
    cy.visit('/nutrition');
    
    // Wait for API calls to complete
    cy.wait('@getCategories');
    cy.wait('@getMealTypes');
    cy.wait('@getDailySummary');
    
    // Check that the page has loaded
    cy.contains('Nutrition').should('be.visible');
  });

  it('should navigate to the custom food creation page', function() {
    cy.visit('/nutrition');
    
    // Wait for API calls to complete
    cy.wait('@getCategories');
    cy.wait('@getMealTypes');
    cy.wait('@getDailySummary');
    
    // Click the "Add Custom Food" button with force option
    cy.contains('button', 'Add Custom Food').should('be.visible').click({ force: true });
    
    // Verify navigation to the custom food page
    cy.url().should('include', '/nutrition/create');
  });

  it('should navigate to the stats page', function() {
    cy.visit('/nutrition');
    
    // Wait for API calls to complete
    cy.wait('@getCategories');
    cy.wait('@getMealTypes');
    cy.wait('@getDailySummary');
    
    // Use force: true to handle cases where the element might be covered or detached
    cy.contains('button', 'Stats').should('be.visible').click({ force: true });
    
    // Verify navigation to the stats page
    cy.url().should('include', '/nutrition/stats');
  });
}); 