describe('Mocked API Tests', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'test-token');
    });
    
    // Mock the exercises API endpoint with the correct URL format
    cy.intercept('GET', '**/api/workouts/exercises/**', { fixture: 'exercises.json' }).as('getExercises');
  });

  it('should display mocked exercises', () => {
    // Visit the workout creation page
    cy.visit('/workouts/create');
    
    // Fill in required fields to enable the Next button
    cy.get('input[placeholder="e.g., Monday Upper Body"]').type('Test Workout');
    
    // Move to exercise selection step
    cy.contains('button', 'Next Step').click();
    
    // Wait for the mocked API call with increased timeout
    cy.wait('@getExercises', { timeout: 10000 });
    
    // Wait longer for exercises to render
    cy.wait(3000);
    
    // Verify that mocked exercises are displayed
    cy.contains('Bench Press').should('exist');
    cy.contains('Squat').should('exist');
    cy.contains('Deadlift').should('exist');
    cy.contains('Running').should('exist');
  });
}); 