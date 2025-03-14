describe('Workout Creation Flow', () => {
  beforeEach(() => {
    // Mock the authentication - this depends on how your auth is implemented
    // For example, if using JWT:
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'test-token');
    });
    
    // Mock the exercises API endpoint with the correct URL format
    cy.intercept('GET', '**/api/workouts/exercises/**', { fixture: 'exercises.json' }).as('getExercises');
    
    // Visit the workout creation page
    cy.visit('/workouts/create');
  });

  it('should fill out workout info and move to exercise selection', () => {
    // Step 1: Fill out workout info
    cy.get('input[placeholder="e.g., Monday Upper Body"]').type('Test Workout');
    
    // Select date (assuming today's date is pre-selected)
    // Set duration
    cy.get('input[aria-label="Duration (minutes)"]').clear().type('45');
    
    // Add notes
    cy.get('textarea[placeholder="Any additional information about this workout"]')
      .type('This is a test workout created by Cypress');
    
    // Move to next step
    cy.contains('button', 'Next Step').click();
    
    // Wait for the mocked API call with increased timeout
    cy.wait('@getExercises', { timeout: 10000 });
    
    // Verify we're at the exercise selection step
    cy.contains('Select Exercise').should('exist');
  });
});
