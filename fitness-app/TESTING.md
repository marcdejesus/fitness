# Testing Guide for Fitness App

This document provides an overview of the testing setup for the Fitness App, focusing on end-to-end testing with Cypress.

## Testing Architecture

The Fitness App uses Cypress for end-to-end testing. The tests are organized as follows:

- **Real API Tests**: These tests run against the actual backend API and verify that the frontend and backend work together correctly.
- **Mocked Tests**: These tests use mock data to simulate API responses, allowing for faster and more reliable testing of the frontend components.

## Test Files

- `cypress/e2e/nutrition_tracking.cy.js`: Tests for the nutrition tracking feature using real API calls
- `cypress/e2e/nutrition_tracking_mocked.cy.js`: Tests for the nutrition tracking feature using mocked API responses

## Mock Data

Mock data is stored in the `cypress/fixtures` directory:

- `nutrition.json`: Contains mock data for nutrition tests, including food categories, food items, meal types, daily summaries, and nutrition goals.

## Authentication in Tests

The tests use two methods for authentication:

1. **UI Login (`cy.login`)**: This method visits the login page, enters credentials, and submits the form. It's useful for testing the login flow itself but is slower for other tests.

2. **Direct Token Setting (`cy.loginByLocalStorage`)**: This method bypasses the UI and sets the authentication token directly in localStorage. It's faster and more reliable for tests that don't need to verify the login flow.

By default, the tests use the `loginByLocalStorage` method to avoid potential issues with the login page and to make tests run faster.

## Running Tests

### Prerequisites

1. Make sure the frontend app is running on `http://localhost:3000`
2. Make sure the backend API is running on `http://localhost:8000` (for non-mocked tests)

### Using NPM Scripts

The following npm scripts are available for running tests:

```bash
# Run all tests
npm test

# Open Cypress Test Runner
npm run test:open

# Run only mocked tests
npm run test:mocked

# Run only real API tests
npm run test:real

# Run specific nutrition tests
npm run test:nutrition        # Real API tests
npm run test:nutrition:mocked # Mocked tests
npm run test:nutrition:all    # All nutrition tests
```

### Using the Test Script Directly

You can also run the test script directly:

```bash
./scripts/run-tests.sh [options]
```

Options:
- `--mocked`: Run only mocked tests
- `--real`: Run only real API tests
- `--open`: Open the Cypress Test Runner instead of running tests in headless mode

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

1. Decide whether the test should use real API calls or mocked responses
2. Add appropriate data-testid attributes to components for reliable selection
3. Update fixtures if needed for mocked tests
4. Follow the existing test patterns for consistency

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

### Common Issues with Mocked Tests

1. **Authentication Token Format**: The mocked tests use a simulated JWT token. If your backend expects a specific token format, you may need to modify the `loginByLocalStorage` command in `cypress/support/commands.js`.

2. **UI Component Interactions**: Some UI components may be difficult to interact with in tests, especially those that use complex state management or have conditional rendering. For these cases:
   - Use the `{ force: true }` option with `cy.click()` or `cy.type()`
   - Add appropriate waits (`cy.wait()`) to ensure the UI has stabilized
   - Consider using `cy.contains()` instead of `cy.get()` for more reliable element selection

3. **API Intercepts**: If your tests are not correctly intercepting API calls:
   - Verify that the intercept patterns match the actual API endpoints
   - Check that the intercepts are set up before the page is visited
   - Use the Network tab in Cypress to see what requests are actually being made

4. **Data-testid Attributes**: For reliable element selection, add `data-testid` attributes to your components. This makes tests more resilient to UI changes.

## Continuous Integration

The Cypress tests are configured to run in CI/CD pipelines. The tests run in headless mode and generate reports that can be viewed in the CI/CD dashboard.

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Mantine UI Documentation](https://mantine.dev/) (for component references) 