describe('API Interactions', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'test-token');
    });
    
    // Mock the exercises API endpoint
    cy.intercept('GET', '**/api/workouts/exercises/**', { fixture: 'exercises.json' }).as('getExercises');
  });

  it('should fetch exercises from the API', () => {
    // Visit the workout creation page
    cy.visit('/workouts/create');
    
    // Fill in required fields to enable the Next button
    cy.get('input[placeholder="e.g., Monday Upper Body"]').type('Test Workout');
    
    // Move to exercise selection step
    cy.contains('button', 'Next Step').click();
    
    // Wait for the mocked API call
    cy.wait('@getExercises', { timeout: 10000 });
    
    // Verify that exercises are displayed
    cy.contains('Bench Press').should('exist');
    cy.contains('Squat').should('exist');
  });
});
