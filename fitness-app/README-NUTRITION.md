# Nutrition Tracking Feature

This document provides instructions on how to set up and use the nutrition tracking feature in the fitness app.

## Overview

The nutrition tracking feature allows users to:

- Search for food items in a pre-populated database
- Create custom food items
- Save favorite foods for quick access
- View detailed nutritional information for each food item

## Backend Setup

1. Apply the migrations to create the necessary database tables:

```bash
cd fitness-app/backend
python manage.py migrate
```

2. Seed the database with common food items:

```bash
python manage.py seed_foods
```

## API Endpoints

The nutrition API is available at `/api/nutrition/` and includes the following endpoints:

### Food Categories

- `GET /api/nutrition/categories/` - List all food categories

### Food Items

- `GET /api/nutrition/foods/` - List all food items
- `GET /api/nutrition/foods/{id}/` - Get a specific food item
- `POST /api/nutrition/foods/` - Create a custom food item
- `PATCH /api/nutrition/foods/{id}/` - Update a custom food item
- `DELETE /api/nutrition/foods/{id}/` - Delete a custom food item

### Search and Filters

- `GET /api/nutrition/foods/search/?q={query}` - Search for food items by name, brand, or barcode
- `GET /api/nutrition/foods/barcode/?code={barcode}` - Search for a food item by barcode

### User-specific Endpoints

- `GET /api/nutrition/foods/favorites/` - Get user's favorite food items
- `POST /api/nutrition/foods/{id}/favorite/` - Add a food item to favorites
- `POST /api/nutrition/foods/{id}/unfavorite/` - Remove a food item from favorites
- `GET /api/nutrition/foods/custom/` - Get user's custom food items

## Frontend Pages

The nutrition tracking feature includes the following pages:

- `/nutrition` - Main nutrition page with tabs for searching foods, viewing favorites, and managing custom foods
- `/nutrition/create` - Form for creating custom food items

## Adding More Food Items

You can add more food items to the database by:

1. Editing the `seed_foods.py` management command to include more food items
2. Creating a CSV import script to import food data from external sources
3. Using the API to create custom food items

## Future Enhancements

Planned enhancements for the nutrition tracking feature include:

- Meal planning and tracking
- Daily nutrition goals and progress tracking
- Recipe creation with automatic nutritional information calculation
- Barcode scanning for easy food entry
- Integration with third-party nutrition databases

## Troubleshooting

If you encounter issues with the nutrition tracking feature:

1. Ensure the backend server is running
2. Check that the migrations have been applied
3. Verify that the food database has been seeded
4. Check the browser console for any API errors
5. Ensure the user is authenticated before accessing the nutrition pages 