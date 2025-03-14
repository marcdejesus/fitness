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
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password') => {
  // If your app uses JWT or similar token-based auth:
  // Option 1: Mock the token (faster for tests)
  cy.window().then((win) => {
    win.localStorage.setItem('token', 'test-token');
  });
  
  // Option 2: Actually log in through the API (more realistic)
  /*
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/login/`,
    body: { email, password }
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem('token', response.body.token);
  });
  */
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