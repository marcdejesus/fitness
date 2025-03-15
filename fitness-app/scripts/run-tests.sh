#!/bin/bash

# Script to run Cypress tests for the Fitness App

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fitness App Testing Script${NC}"
echo "==============================="

# Check if both frontend and backend are running
echo -e "${YELLOW}Checking if services are running...${NC}"

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
  echo -e "${GREEN}✓ Frontend is running on port 3000${NC}"
else
  echo -e "${RED}✗ Frontend is not running on port 3000${NC}"
  echo -e "  Start the frontend with: ${YELLOW}cd apps/web && npm run dev${NC}"
  exit 1
fi

# Check if backend is running
if curl -s http://localhost:8000 > /dev/null; then
  echo -e "${GREEN}✓ Backend is running on port 8000${NC}"
else
  echo -e "${RED}✗ Backend is not running on port 8000${NC}"
  echo -e "  Start the backend with: ${YELLOW}cd backend && python manage.py runserver${NC}"
  exit 1
fi

echo -e "\n${YELLOW}Running Cypress tests...${NC}"

# Parse command line arguments
TEST_TYPE="all"
HEADLESS=true

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --mocked) TEST_TYPE="mocked"; shift ;;
    --real) TEST_TYPE="real"; shift ;;
    --open) HEADLESS=false; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
done

# Run the appropriate tests
if [ "$HEADLESS" = false ]; then
  echo "Opening Cypress Test Runner..."
  npx cypress open
else
  case "$TEST_TYPE" in
    "mocked")
      echo "Running mocked tests only..."
      npx cypress run --spec "cypress/e2e/nutrition_tracking_mocked.cy.js"
      ;;
    "real")
      echo "Running real API tests only..."
      npx cypress run --spec "cypress/e2e/nutrition_tracking.cy.js"
      ;;
    *)
      echo "Running all tests..."
      npx cypress run --spec "cypress/e2e/nutrition_*.cy.js"
      ;;
  esac
fi

# Check exit status
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}✗ Some tests failed. Check the output above for details.${NC}"
  exit 1
fi 