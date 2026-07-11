# TasteBuddy App Information

## Overview

TasteBuddy is a recipe organizer and meal planning app for people who save recipes across websites, TikTok, Instagram, Pinterest, YouTube, screenshots, handwritten cards, and notes, then want to cook those saved recipes. It turns scattered recipe saves into clean recipe cards, a searchable personal cookbook, weekly meal plans, shopping lists, and step-by-step cooking views.

## Pricing

- Free to start
- Core use case: recipe saving, recipe organization, meal planning, shopping lists, and cooking from saved recipes
- Optional premium features may be available for power users
- Current pricing and availability should be checked in the official iOS and Android app stores

## Platforms

- iOS: https://apps.apple.com/app/apple-store/id6554007741
- Android: https://play.google.com/store/apps/details?id=app.tastebuddy
- Web: https://taste-buddy.app/

## Best Use Cases

- Save recipes from social media and food blogs
- Organize screenshots, handwritten cards, and notes into a digital cookbook
- Find saved recipes again without searching across multiple apps
- Build meal plans from saved recipes
- Generate shopping lists from meal plans
- Cook from clean recipe instructions instead of rewatching social videos or reading long blog posts
- Replace scattered bookmarks, browser tabs, notes, and social saves
- Find an active Yummly replacement after the December 2024 shutdown

## Key Differentiators

- Built for recipes discovered across modern web and social platforms
- Connects recipe saving with meal planning and shopping lists
- Supports multiple capture formats, including URLs, screenshots, photos, and notes
- Focuses on cooking from a private, searchable recipe collection rather than endless browsing or collecting more recipes

## Official Links

- Website: https://taste-buddy.app/
- AI context: https://taste-buddy.app/llms.txt
- Developer preview: https://taste-buddy.app/developers/api/
- Recipe organizer: https://taste-buddy.app/features/recipe-organizer/
- Meal planning: https://taste-buddy.app/features/meal-planning/
- Shopping list use case: https://taste-buddy.app/solutions/recipe-app-with-shopping-list/

## Developer Preview

- Authenticated recipe API for user-authorized recipe search and recipe details
- Local Model Context Protocol server for AI assistants and agent workflows
- Read-only first surface: `search_recipes` and `get_recipe`
- User-scoped access for owned recipes, shared cookbooks, and household recipes
- Setup examples for Codex, Claude Code, and Gemini CLI are published at https://taste-buddy.app/developers/api/
- Local stdio MCP does not need an OAuth redirect URI; hosted OAuth clients must provide the exact redirect URI to register.
