// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (email = Cypress.env('USER_EMAIL'), password = Cypress.env('USER_PASSWORD')) => {
  // Check if we're already logged in by looking for a token in localStorage
  cy.window().then(window => {
    const token = window.localStorage.getItem('authToken');
    if (token) {
      return; // Already logged in
    }
    
    // If no token exists, perform login
    cy.visit('/auth/signin');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.contains('button', 'Sign In').click();
    
    // Wait for login to complete and redirect
    cy.url().should('not.include', '/auth/signin');
    
    // Verify we have a token now
    cy.window().its('localStorage.authToken').should('exist');
  });
});

// Alternative login method that bypasses the UI and sets the token directly
Cypress.Commands.add('loginByLocalStorage', (token) => {
  // Create a more realistic JWT token if none is provided
  if (!token) {
    // This is a mock JWT token with the structure: header.payload.signature
    // The payload contains a user_id and exp (expiration) claim
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      user_id: 'test-user-id',
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      iat: Math.floor(Date.now() / 1000)
    }));
    const signature = 'mock-signature'; // In a real JWT, this would be a cryptographic signature
    token = `${header}.${payload}.${signature}`;
  }
  
  cy.window().then(window => {
    window.localStorage.setItem('authToken', token);
  });
  
  // Visit the home page to trigger the auth context to load the token
  cy.visit('/');
});

// Command for logging out
Cypress.Commands.add('logout', () => {
  cy.window().then(window => {
    window.localStorage.removeItem('authToken');
  });
  cy.visit('/auth/signin');
});

// Command to add a data-testid attribute to the food-search-results div
Cypress.Commands.add('addTestIdToFoodSearchResults', () => {
  cy.window().then(window => {
    const resultsDiv = window.document.querySelector('.food-search-results');
    if (resultsDiv) {
      resultsDiv.setAttribute('data-testid', 'food-search-results');
    }
  });
});

// Command to add a data-testid attribute to the meal-list div
Cypress.Commands.add('addTestIdToMealList', () => {
  cy.window().then(window => {
    const mealListDiv = window.document.querySelector('.meal-list');
    if (mealListDiv) {
      mealListDiv.setAttribute('data-testid', 'meal-list');
    }
  });
});

// Command to create a workout directly via API
Cypress.Commands.add('createWorkoutViaApi', (workoutData) => {
  const defaultWorkout = {
    name: 'API Created Workout',
    date: new Date().toISOString().split('T')[0],
    start_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    duration: 45,
    notes: 'Created via Cypress API command'
  };
  
  const workout = { ...defaultWorkout, ...workoutData };
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/workouts/`,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: workout
  });
}); 