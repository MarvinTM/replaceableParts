# replaceableParts

replaceableParts is a web-based manufacturing simulation game where players expand a factory, research recipes, automate production, and progress through technology ages.

It is currently publicly accessible at: `https://replaceable.parts`

## Basic Architecture

- `frontend/`: Vite + React application (UI, game interactions, i18n content, charts, and client-side state).
- `backend/`: Express API for authentication, game/session persistence, and server-side business logic.
- `backend/prisma/schema.prisma`: Prisma ORM models backed by PostgreSQL.
- Root `package.json`: orchestration scripts to run backend and frontend together during development and build.

## Setup and Deployment

For environment variables, OAuth/database configuration, and deployment instructions, see `SETUP.md`.
