# Architecture

## Directory Structure
- `src/app`: Next.js App Router (pages, layout, API routes).
- `src/components`: Reusable UI elements, features, layouts.
- `src/models`: Database models (currently Mongoose schemas).
- `src/lib`: Core utilities, database connections, auth configs.
- `src/stores`: Client state management using Zustand.

## Data Flow
- API Routes and Server Actions fetch data directly from DB.
- Client Components consume data via props or use server actions.
- Socket.IO server (optional) handles real-time updates.
