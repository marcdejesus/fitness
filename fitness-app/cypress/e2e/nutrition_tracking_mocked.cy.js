// Nutrition tracking tests with mocked API responses
describe('Nutrition Tracking (Mocked)', () => {
  beforeEach(function() {
    // Login before each test using localStorage method
    cy.loginByLocalStorage();
    
    // Load fixture data
    cy.fixture('nutrition.json').then((nutritionData) => {
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

  it('should load the nutrition page successfully with mocked data', () => {
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
    
    // Check that the mocked meal entry is displayed
    cy.contains('Apple').should('be.visible');
  });

  it('should navigate to the custom food creation page', () => {
    cy.visit('/nutrition');
    
    // Click the "Add Custom Food" button
    cy.contains('button', 'Add Custom Food').click();
    
    // Verify navigation to the custom food page
    cy.url().should('include', '/nutrition/create');
    cy.contains('Create Custom Food').should('be.visible');
  });

  it('should navigate to the stats page', () => {
    cy.visit('/nutrition');
    
    // Click the "Stats" button
    cy.contains('button', 'Stats').click();
    
    // Verify navigation to the stats page
    cy.url().should('include', '/nutrition/stats');
    cy.contains('Nutrition Statistics').should('be.visible');
  });
}); 