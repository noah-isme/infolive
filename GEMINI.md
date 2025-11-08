# GEMINI.md

## Project Overview

This project is a Next.js application called "InfoLive", an educational live streaming platform for high school students to learn informatics. It uses TypeScript, Tailwind CSS, and Prisma for database management. The application allows for live classes, code showcases, chat and discussions, and community rooms.

The database schema includes models for `User`, `Class`, `Session`, and `Attendance`, indicating a system for managing users, classes, class sessions, and user attendance.

## Building and Running

### Prerequisites

- Node.js
- Docker (for the database)

### Key Commands

- **Install dependencies:**
  ```bash
  npm install
  ```

- **Run the development server:**
  ```bash
  npm run dev
  ```

- **Build the project:**
  ```bash
  npm run build
  ```

- **Start the production server:**
  ```bash
  npm run start
  ```

- **Run tests:**
  ```bash
  npm test
  ```

- **Lint the code:**
  ```bash
  npm run lint
  ```

- **Typecheck the code:**
  ```bash
  npm run typecheck
  ```

### Database

The project uses Prisma for database management.

- **Start the database:**
  ```bash
  npm run compose:up
  ```

- **Stop the database:**
  ```bash
  npm run compose:down
  ```

- **Apply database schema changes:**
  ```bash
  npm run db:push
  ```

- **Run database migrations:**
  ```bash
  npm run db:migrate
  ```

- **Seed the database:**
  ```bash
  npm run seed
  ```

## Development Conventions

- **Code Style:** The project uses ESLint and Prettier for code formatting and linting. The configuration files are `eslint.config.mjs` and `prettier.config.mjs`.
- **Testing:** The project uses Vitest for testing. The configuration file is `vitest.config.ts`.
- **Path Aliases:** The project uses the path alias `@/*` to refer to the root directory. This is configured in `tsconfig.json`.
