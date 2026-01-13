# AI Rules for GridCraft Solutions Application

This document outlines the core technologies used in this project and provides guidelines for using specific libraries to maintain consistency and best practices.

## Tech Stack

*   **Frontend Framework**: React (v18)
*   **Language**: TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS for utility-first styling.
*   **UI Components**: shadcn/ui, built on Radix UI primitives.
*   **Routing**: React Router DOM for client-side navigation.
*   **State Management & Data Fetching**: TanStack Query (React Query) for server state management.
*   **Form Handling & Validation**: React Hook Form for form state, and Zod for schema validation.
*   **Animations**: Framer Motion for declarative animations.
*   **Icons**: Lucide React for vector icons.
*   **Backend & Database**: Supabase for authentication, database, and storage.
*   **Notifications**: Sonner for toast notifications.

## Library Usage Rules

To ensure a consistent and maintainable codebase, please adhere to the following rules when developing new features or modifying existing ones:

*   **UI Components**:
    *   Always prioritize using existing `shadcn/ui` components from `src/components/ui/`.
    *   If a required component is not available in `shadcn/ui` or needs significant customization, create a new component in `src/components/` and style it using Tailwind CSS.
    *   **Do NOT modify** the files within `src/components/ui/` directly.
*   **Styling**:
    *   All styling **must** be done using Tailwind CSS utility classes.
    *   Avoid inline styles or creating new `.css` files for component-specific styling. Global styles are managed in `src/index.css`.
*   **Routing**:
    *   Use `react-router-dom` for all client-side routing.
    *   Define all main application routes within `src/App.tsx`.
*   **State Management & Data Fetching**:
    *   For managing server state, data fetching, caching, and synchronization, use `@tanstack/react-query`.
    *   For simple, local component state, use React's built-in `useState` or `useReducer` hooks.
*   **Form Handling & Validation**:
    *   Implement all forms using `react-hook-form`.
    *   Use `zod` for defining form schemas and validation rules.
*   **Animations**:
    *   Use `framer-motion` for any animations, transitions, or interactive gestures.
*   **Icons**:
    *   All icons should be imported from `lucide-react`.
*   **Notifications**:
    *   Use `sonner` for displaying toast notifications to the user (e.g., success messages, error alerts).
*   **Backend Interactions**:
    *   All interactions with Supabase (authentication, database queries, storage uploads/downloads) must use the `@supabase/supabase-js` client, imported from `src/integrations/supabase/client.ts`.
*   **File Structure**:
    *   Adhere to the existing directory structure:
        *   `src/pages/` for top-level views/pages.
        *   `src/components/` for reusable UI components.
        *   `src/hooks/` for custom React hooks.
        *   `src/lib/` for utility functions.
        *   `src/integrations/` for third-party service configurations (e.g., Supabase).