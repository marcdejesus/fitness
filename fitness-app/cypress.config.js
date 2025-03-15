const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    // Default test user credentials - override these in cypress.env.json for local development
    USER_EMAIL: 'test@example.com',
    USER_PASSWORD: 'password123',
    
    // API URL
    API_URL: 'http://localhost:8000',
    
    // Test data
    TEST_FOOD_NAME: 'Apple',
    TEST_FOOD_CATEGORY: 'Fruits',
  },
  viewportWidth: 1280,
  viewportHeight: 800,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 30000,
  video: false,
}) 