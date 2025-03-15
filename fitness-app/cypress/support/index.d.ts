/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to log in via the UI
     * @example cy.login('user@example.com', 'password')
     */
    login(email?: string, password?: string): Chainable<Element>;

    /**
     * Custom command to log in by setting the token directly in localStorage
     * @example cy.loginByLocalStorage('your-auth-token')
     */
    loginByLocalStorage(token?: string): Chainable<Element>;

    /**
     * Custom command to log out
     * @example cy.logout()
     */
    logout(): Chainable<Element>;

    /**
     * Custom command to add a data-testid attribute to the food-search-results div
     * @example cy.addTestIdToFoodSearchResults()
     */
    addTestIdToFoodSearchResults(): Chainable<Element>;

    /**
     * Custom command to add a data-testid attribute to the meal-list div
     * @example cy.addTestIdToMealList()
     */
    addTestIdToMealList(): Chainable<Element>;
  }
} 