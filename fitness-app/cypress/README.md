# Cypress Tests for Fitness App

This directory contains end-to-end tests for the Fitness App using Cypress.

## Test Structure

The tests are organized as follows:

- `e2e/` - Contains all end-to-end test files
  - `nutrition_tracking.cy.js` - Tests for the nutrition tracking feature using real API calls
  - `nutrition_tracking_mocked.cy.js` - Tests for the nutrition tracking feature using mocked API responses
- `fixtures/` - Contains mock data used in tests
  - `nutrition.json` - Mock data for nutrition tests
- `support/` - Contains support files and custom commands
  - `commands.js` - Custom Cypress commands
  - `e2e.js` - Global configuration for e2e tests

## Authentication

The tests use two methods for authentication:

1. **UI Login (`cy.login`)**: This method visits the login page, enters credentials, and submits the form.
   ```javascript
   cy.login('user@example.com', 'password');
   ```

2. **Direct Token Setting (`cy.loginByLocalStorage`)**: This method bypasses the UI and sets the authentication token directly in localStorage.
   ```javascript
   cy.loginByLocalStorage('your-auth-token');
   ```

By default, the tests use the `loginByLocalStorage` method with a mock JWT token. This is faster and more reliable for tests that don't need to verify the login flow.

## Mocked Tests

The mocked tests use Cypress's intercept functionality to mock API responses. This allows us to test the frontend without relying on the backend. The mocked tests:

1. Use a fixture file (`nutrition.json`) to provide consistent test data
2. Intercept API calls and return the mock data
3. Verify that the UI correctly displays the mock data

The mocked tests are particularly useful for:
- Testing the UI in isolation
- Testing edge cases that are hard to reproduce with real data
- Running tests in CI/CD pipelines without a backend

### Current Mocked Test Coverage

The mocked tests currently cover:
- Loading the nutrition page and verifying key components are displayed
- Navigating to the custom food creation page
- Navigating to the nutrition statistics page

### Known Limitations

Some tests that involve complex user interactions (like searching for foods or adding foods to the meal log) are currently not mocked due to challenges with the UI components. These tests are still available in the real API test suite.

## Running Tests

### Prerequisites

1. Make sure the frontend app is running on `http://localhost:3000`
2. Make sure the backend API is running on `http://localhost:8000` (for non-mocked tests)

### Commands

- Run all tests in headless mode:
  ```
  npm run cypress:run
  ```

- Open Cypress Test Runner:
  ```
  npm run cypress:open
  ```

- Run only mocked tests:
  ```
  npm run cypress:run -- --spec "cypress/e2e/nutrition_tracking_mocked.cy.js"
  ```

- Run only real API tests:
  ```
  npm run cypress:run -- --spec "cypress/e2e/nutrition_tracking.cy.js"
  ```

## Test User

The tests use a default test user with the following credentials:
- Email: `test@example.com`
- Password: `password123`

You can override these in a local `cypress.env.json` file (not committed to git):

```json
{
  "USER_EMAIL": "your-test-user@example.com",
  "USER_PASSWORD": "your-test-password"
}
```

## Adding New Tests

When adding new tests:

1. Consider whether the test should use real API calls or mocked responses
2. Add appropriate data-testid attributes to components for reliable selection
3. Add any new custom commands to `support/commands.js`
4. Update fixtures if needed for mocked tests

## Best Practices

- Use data-testid attributes for element selection instead of CSS classes or text content
- Keep tests independent of each other
- Clean up any test data created during tests
- Use custom commands for common operations
- Use meaningful assertions that verify the actual functionality, not just the presence of elements

## Troubleshooting

- If tests fail with timeout errors, try increasing the timeout values in `cypress.config.js`
- If tests fail due to authentication issues:
  - Check that the login command is working correctly
  - Try using `cy.loginByLocalStorage()` instead of `cy.login()`
  - Verify that your auth routes are correctly set up at `/auth/signin`
- For mocked tests, verify that the fixture data matches the expected API response structure
- Check the Cypress logs and screenshots/videos for more details on failures 