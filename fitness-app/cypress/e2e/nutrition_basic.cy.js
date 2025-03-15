// Basic nutrition tracking tests with mocked API responses
describe('Nutrition Tracking Basic Tests', function() {
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
    
    // Click the "Add Custom Food" button
    cy.contains('Add Custom Food').click();
    
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